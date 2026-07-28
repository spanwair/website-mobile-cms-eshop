"""Assembles the system prompt + retrieved file context for one task, inside budget.

Retrieval is deliberately heuristic (path/keyword matching), not embeddings —
running a second model for embeddings would compete for the single 8GB GPU
this system is built to never swap models on. See GUIDE.md "Upgrading
retrieval" for the embedding-based path if this stops being precise enough.
"""
import os
import re

import httpx

ROLE_TRIGGERS = {
    "admin-permissions": {
        "paths": [
            "website/src/pages/admin/",
            "website/src/components/cms/Sidebar.astro",
            "website/src/lib/admin.ts",
            "shared/constants/permissions.ts",
        ],
        "keywords": [
            "role", "permission", "access control", "canAssignRole",
            "requireAdminCtx", "hasPermission", "invite",
        ],
    },
}


def count_tokens(base_url, text):
    r = httpx.post(f"{base_url}/tokenize", json={"content": text}, timeout=30)
    r.raise_for_status()
    return len(r.json()["tokens"])


def load_role_prompt(role_dir, role_name):
    path = os.path.join(role_dir, f"{role_name}.md")
    with open(path) as f:
        return f.read()


def triggered_skills(task_description, touched_or_candidate_paths, skills_dir):
    matched = []
    desc_lower = task_description.lower()
    for skill_name, trigger in ROLE_TRIGGERS.items():
        path_hit = any(
            p.startswith(tp.rstrip("/")) for p in touched_or_candidate_paths for tp in trigger["paths"]
        )
        kw_hit = any(kw.lower() in desc_lower for kw in trigger["keywords"])
        if path_hit or kw_hit:
            skill_path = os.path.join(skills_dir, f"{skill_name}.md")
            if os.path.exists(skill_path):
                with open(skill_path) as f:
                    matched.append(f.read())
    return matched


# Generic words that appear in many unrelated paths/filenames (new.astro,
# index.astro, id.astro, ...) or are common English filler — without this
# filter, a task like "add a new permission bit" scores every admin
# .../new.astro page as highly as shared/constants/permissions.ts, purely
# because "new" is in both the task and the filename.
STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "add", "new", "page",
    "index", "should", "when", "from", "into", "make", "need", "want",
    "file", "files", "component", "components", "update", "change",
    "fix", "bug", "feature", "please", "some", "each", "your", "have",
}


def rank_candidate_files(task_description, repo_map_entries, top_n=40):
    """Cheap relevance: token overlap between task words and path/summary text."""
    words = set(re.findall(r"[a-zA-Z_]{3,}", task_description.lower())) - STOPWORDS
    scored = []
    for entry in repo_map_entries:
        haystack_path = entry["path"].lower()
        haystack_summary = entry.get("summary", "").lower()
        # exports/constants named in the summary are a stronger signal than
        # incidental path substrings, so weight them higher
        score = sum(2 for w in words if w in haystack_summary) + sum(1 for w in words if w in haystack_path)
        if score > 0:
            scored.append((score, entry))
    scored.sort(key=lambda x: -x[0])
    return [e for _, e in scored[:top_n]]


def build_context(cfg, base_url, task_description, role_name, repo_map_entries):
    budget = cfg["budget"]
    root = cfg["repo"]["root"]
    role_dir = os.path.join(os.path.dirname(__file__), "roles")
    skills_dir = os.path.join(os.path.dirname(__file__), "skills")

    system_prompt = load_role_prompt(role_dir, role_name)
    candidates = rank_candidate_files(task_description, repo_map_entries)
    candidate_paths = [c["path"] for c in candidates]
    for skill_text in triggered_skills(task_description, candidate_paths, skills_dir):
        system_prompt += "\n\n---\n\n" + skill_text

    repo_map_text = "\n".join(f"{e['path']} ({e['lines']}L) {e.get('summary','')}" for e in repo_map_entries)

    file_blocks = []
    used = 0
    for entry in candidates:
        full = os.path.join(root, entry["path"])
        try:
            with open(full, errors="ignore") as f:
                content = f.read()
        except OSError:
            continue
        block = f"### {entry['path']}\n```\n{content}\n```\n"
        tok = count_tokens(base_url, block)
        if used + tok > budget["retrieved_files_max"]:
            break
        file_blocks.append(block)
        used += tok

    return {
        "system_prompt": system_prompt,
        "repo_map_text": repo_map_text,
        "file_context": "\n".join(file_blocks),
        "files_included": [c["path"] for c in candidates[: len(file_blocks)]],
    }
