#!/usr/bin/env python3
"""Orchestrate EN->CS translation of Starlight docs via the local Gemma server.

Usage:
  translate.py <src_file> <dest_file>     translate one file
The script never translates by itself; it only sends chunks to the LLM server
and assembles the response into a Markdown file.
"""
import sys, os, json, re, time, urllib.request

SERVER = "http://192.168.0.108:8080/v1/chat/completions"
MODEL = "./gemma-4-E4B-it-Q5_K_M.gguf"

GLOSSARY = """GLOSSARY (use these exact Czech terms):
- login session -> přihlašovací relace
- unread -> nepřečtené ; read (status) -> přečtené
- badge -> odznak
- muted (text) -> ztlumený
- dashboard -> nástěnka
- inbox -> schránka
- permission(s) -> oprávnění ; permission bit -> bit oprávnění
- role -> role ; owner -> vlastník ; admin -> administrátor
- organization / party -> organizace
- sidebar -> boční panel
- settings -> nastavení ; branding -> vzhled značky
- product -> produkt ; order -> objednávka ; customer -> zákazník
- inventory -> skladové zásoby ; pricing -> ceny ; category -> kategorie
- review -> recenze ; return -> vrácení ; refund -> vrácení peněz
- coupon -> kupón ; discount -> sleva ; price list -> ceník
- audit log -> protokol auditu ; notification -> oznámení
- store / storefront -> obchod ; checkout -> pokladna ; cart -> košík
- shipping -> doprava ; payout -> výplata ; billing -> fakturace
- redirect -> přesměrovat ; render -> vykreslit
- empty state -> prázdný stav ; timestamp -> časové razítko"""

SYSTEM = """You are a professional technical translator translating English Markdown documentation into natural, fluent Czech (čeština). Czech is a real language with correct diacritics - always spell Czech words correctly and completely; never invent or garble words.

STRICT OUTPUT RULES:
1. Output ONLY the translated Markdown. No preamble, no explanations, no ``` fences wrapping the whole output.
2. Preserve the EXACT Markdown/MDX structure line for line: headings, tables (all | and --- separators), lists, blank lines, bold/italic markers, blockquotes.
3. YAML frontmatter (between the --- lines): translate ONLY the values of these keys: title, description, tagline, and any human-readable text/label/tagline fields. Keep every key name, link:, icon:, variant:, template:, slug:, and URL value UNCHANGED.
4. NEVER translate or alter: text inside `backticks`, fenced code blocks, URLs and link targets inside (parentheses), file paths, import statements, JSX/MDX component tags and their attribute names, ALL_CAPS constants (e.g. VIEW_DASHBOARD), and function/identifier names (e.g. requireAdminCtx, fetchUserNotifications).
5. DO translate: normal prose, heading text, table cell prose, and link display text inside [square brackets].
6. Do not add or remove any lines. Keep every URL exactly as-is.
7. Write fluent, grammatically correct Czech - not word-for-word. Use correct Czech declension.

""" + GLOSSARY


def call(messages, max_tokens=16384):
    payload = {
        "model": MODEL, "messages": messages,
        "temperature": 0.15, "top_p": 0.9, "max_tokens": max_tokens, "stream": False,
    }
    req = urllib.request.Request(SERVER, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=600) as r:
        resp = json.load(r)
    ch = resp["choices"][0]
    return ch["message"]["content"], ch.get("finish_reason")


def clean(out):
    out = out.strip()
    # strip an accidental ```markdown ... ``` wrapper around the whole thing
    m = re.match(r"^```[a-zA-Z]*\n(.*)\n```$", out, re.DOTALL)
    if m:
        out = m.group(1)
    out = out.replace("—", "-").replace("–", "-")
    return out.rstrip() + "\n"


def translate_text(text):
    msgs = [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": "Translate this Markdown to Czech:\n\n" + text},
    ]
    out, fr = call(msgs)
    if fr == "length":
        raise RuntimeError("OUTPUT TRUNCATED (finish_reason=length) - needs chunking")
    return clean(out)


def split_sections(text):
    """Split into frontmatter + top-level ## sections for chunked translation."""
    parts = []
    fm = ""
    body = text
    m = re.match(r"^(---\n.*?\n---\n)(.*)$", text, re.DOTALL)
    if m:
        fm, body = m.group(1), m.group(2)
    chunks = re.split(r"(?=^## )", body, flags=re.MULTILINE)
    return fm, [c for c in chunks if c.strip()]


def translate_file(src, dest):
    text = open(src, encoding="utf-8").read()
    try:
        result = translate_text(text)
    except RuntimeError:
        fm, sections = split_sections(text)
        pieces = []
        if fm:
            pieces.append(translate_text(fm).rstrip())
        for s in sections:
            pieces.append(translate_text(s).rstrip())
        result = "\n\n".join(pieces).rstrip() + "\n"
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, "w", encoding="utf-8").write(result)
    return result


if __name__ == "__main__":
    src, dest = sys.argv[1], sys.argv[2]
    t0 = time.time()
    out = translate_file(src, dest)
    sys.stderr.write(f"[ok] {src} -> {dest}  ({len(out)} chars, {time.time()-t0:.1f}s)\n")
