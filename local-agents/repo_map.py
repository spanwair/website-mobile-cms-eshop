"""Builds a compact, cacheable index of the repo for context budgeting.

Excludes generated/data files (DB types, i18n locales) per config — they
carry near-zero architectural signal per source token and would blow the
budget. The map is a flat list of {path, lines, summary}, not full content;
context_builder.py decides which files' actual content to pull in per task.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import time

SOURCE_EXTS = {".ts", ".tsx", ".astro", ".js", ".mjs", ".sql", ".md"}
SUMMARY_PATTERNS = [
    re.compile(r"^export\s+(?:async\s+)?function\s+(\w+)"),
    re.compile(r"^export\s+const\s+(\w+)"),
    re.compile(r"^export\s+class\s+(\w+)"),
    re.compile(r"^export\s+(?:type|interface)\s+(\w+)"),
]


def _git_head(root):
    try:
        return subprocess.run(
            ["git", "rev-parse", "HEAD"], cwd=root, capture_output=True, text=True, check=True
        ).stdout.strip()
    except Exception:
        return "no-git"


def _summarize(path):
    exports = []
    try:
        with open(path, "r", errors="ignore") as f:
            for line in f:
                line = line.strip()
                for pat in SUMMARY_PATTERNS:
                    m = pat.match(line)
                    if m:
                        exports.append(m.group(1))
    except OSError:
        return ""
    return ", ".join(exports[:12])


def _is_excluded(rel_path, exclude):
    return any(rel_path == e or rel_path.startswith(e.rstrip("/") + "/") for e in exclude)


def build(root, exclude):
    entries = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in ("node_modules", ".git", "dist", ".treehouse", "__pycache__")]
        for fname in filenames:
            full = os.path.join(dirpath, fname)
            rel = os.path.relpath(full, root)
            if os.path.splitext(fname)[1] not in SOURCE_EXTS:
                continue
            if _is_excluded(rel, exclude):
                try:
                    lines = sum(1 for _ in open(full, errors="ignore"))
                except OSError:
                    lines = 0
                entries.append({"path": rel, "lines": lines, "summary": "(excluded: generated/data file)"})
                continue
            try:
                lines = sum(1 for _ in open(full, errors="ignore"))
            except OSError:
                continue
            entries.append({"path": rel, "lines": lines, "summary": _summarize(full)})
    entries.sort(key=lambda e: e["path"])
    return entries


def build_cached(root, exclude, cache_dir):
    os.makedirs(cache_dir, exist_ok=True)
    head = _git_head(root)
    cache_file = os.path.join(cache_dir, f"repo_map.{head}.json")
    if os.path.exists(cache_file):
        with open(cache_file) as f:
            return json.load(f)
    entries = build(root, exclude)
    payload = {"generated_at": time.time(), "git_head": head, "entries": entries}
    with open(cache_file, "w") as f:
        json.dump(payload, f)
    return payload


if __name__ == "__main__":
    try:
        import tomllib
    except ModuleNotFoundError:
        import tomli as tomllib  # Python <3.11 backport

    cfg_path = sys.argv[1] if len(sys.argv) > 1 else "config.toml"
    with open(cfg_path, "rb") as f:
        cfg = tomllib.load(f)
    root = cfg["repo"]["root"]
    exclude = cfg["repo"]["exclude"]
    cache_dir = os.path.join(os.path.dirname(os.path.abspath(cfg_path)), ".cache")
    payload = build_cached(root, exclude, cache_dir)
    print(json.dumps(payload, indent=2))
