"""Assembles the system prompt + retrieved file context for one task, inside budget.

Retrieval is deliberately heuristic (path/keyword matching), not embeddings —
running a second model for embeddings would compete for the single 8GB GPU
this system is built to never swap models on. See GUIDE.md "Upgrading
retrieval" for the embedding-based path if this stops being precise enough.

Two things this module deliberately does NOT delegate to the LLM, because the
answer is already knowable from the task text + repo map without spending a
token on it:
  - whether the task is permission-sensitive (`permission_sensitive()`)
  - which files the task is actually about, when it already names them
    (`extract_explicit_paths()`)
Both used to be re-derived by the model on every single role hop, at the cost
of a 60k-token file dump per hop (see GUIDE.md "Why context assembly changed").
"""
import os
import re
import sys

import httpx

import server_auth

_tokenize_warned = False

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

# Roles that actually write or approve code inside a gated area need the full skill
# doc inline. Everything else (planner scopes, tester writes specs, code-reviewer
# reads a diff) only needs to know a gate applies — the one-line pointer below is
# enough for them to say so in their own output; the specialist/disclaimer that
# actually touches the files loads the real thing.
ROLES_NEEDING_FULL_SKILL = {
    "website-specialist", "mobile-specialist", "supabase-specialist", "disclaimer",
}


def count_tokens(base_url, text, cfg):
    # /tokenize is llama.cpp's native endpoint, not part of the OpenAI-compatible
    # surface — it lives at server root, not under the /v1 prefix base_url uses
    # for /chat/completions.
    global _tokenize_warned
    root_url = re.sub(r"/v1/?$", "", base_url)
    try:
        r = httpx.post(
            f"{root_url}/tokenize", json={"content": text}, headers=server_auth.headers(cfg), timeout=30,
        )
        r.raise_for_status()
        return len(r.json()["tokens"])
    except httpx.HTTPError as e:
        # This runs once per candidate file while building context, before the role's
        # own request even goes out — a busy/slow server here shouldn't crash the whole
        # task over a budgeting estimate. len//4 is the same rough heuristic
        # agent_loop._approx_tokens uses; being exact doesn't matter here either.
        if not _tokenize_warned:
            print(f"[context_builder] /tokenize unreachable ({e}) — falling back to len//4 estimate", file=sys.stderr)
            _tokenize_warned = True
        return len(text) // 4


def load_role_prompt(role_dir, role_name):
    path = os.path.join(role_dir, f"{role_name}.md")
    with open(path) as f:
        return f.read()


def matched_skill_names(task_description, touched_or_candidate_paths):
    desc_lower = task_description.lower()
    matched = []
    for skill_name, trigger in ROLE_TRIGGERS.items():
        path_hit = any(
            p.startswith(tp.rstrip("/")) for p in touched_or_candidate_paths for tp in trigger["paths"]
        )
        kw_hit = any(kw.lower() in desc_lower for kw in trigger["keywords"])
        if path_hit or kw_hit:
            matched.append(skill_name)
    return matched


def permission_sensitive(task_description, touched_or_candidate_paths):
    """Deterministic — same trigger table the skill injection uses. This is the
    authoritative answer; a role's own PERMISSION_SENSITIVE: yes/no text is only
    ever OR'd on top of this, never allowed to downgrade it to no."""
    return len(matched_skill_names(task_description, touched_or_candidate_paths)) > 0


def _load_skill_text(skill_name, skills_dir):
    skill_path = os.path.join(skills_dir, f"{skill_name}.md")
    if not os.path.exists(skill_path):
        return None
    with open(skill_path) as f:
        return f.read()


def build_skill_context(task_description, candidate_paths, skills_dir, role_name):
    """Returns (skill_text, skill_names). Full text only for roles that edit the
    gated area; everyone else gets a short pointer so the 200+ line skill doc
    isn't paid for by roles that never open one of those files."""
    names = matched_skill_names(task_description, candidate_paths)
    if not names:
        return "", []
    if role_name in ROLES_NEEDING_FULL_SKILL:
        texts = [t for n in names for t in [_load_skill_text(n, skills_dir)] if t]
        return "\n\n---\n\n".join(texts), names
    pointer = (
        f"\n\n---\n\nNote: this task is permission-sensitive (matches: {', '.join(names)}). "
        "You are not the role that edits the gated files, so the full skill doc is not "
        "included here — just flag PERMISSION_SENSITIVE: yes / call it out in your output; "
        "the specialist and disclaimer roles load the full admin-permissions skill before "
        "any edit or review of those files.\n"
    )
    return pointer, names


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

# Matches repo-relative-looking path tokens in free text: something/something.ext,
# with at least one slash and a real extension — deliberately conservative (would
# rather miss a path than mis-fire on "e.g." or a version number).
EXPLICIT_PATH_RE = re.compile(r"\b[\w][\w./-]*/[\w.-]+\.[a-zA-Z]{1,5}\b")


def extract_explicit_paths(task_description, repo_map_entries):
    """A ticket that already names its files (this repo's tasks often do — see
    GUIDE.md §10, this closes the gap it flags) shouldn't be re-discovered by
    keyword-overlap ranking. Returns repo-map paths mentioned verbatim in the
    task text, in first-appearance order, deduped."""
    known_paths = {e["path"] for e in repo_map_entries}
    found = []
    seen = set()
    for m in EXPLICIT_PATH_RE.finditer(task_description):
        candidate = m.group(0)
        # task text sometimes wraps/backticks paths right up against punctuation
        candidate = candidate.strip("`\"'.,()[]")
        if candidate in known_paths and candidate not in seen:
            seen.add(candidate)
            found.append(candidate)
    return found


def looks_like_finished_plan(task_description, repo_map_entries):
    """True when the task text is already a scoped implementation plan (explicit
    file path(s) + structured sections) rather than a raw feature request. When
    true, run.py skips the planner/architect hops entirely — there is nothing
    for them to scope that the ticket hasn't already scoped. See GUIDE.md
    "Skipping planner/architect"."""
    explicit_paths = extract_explicit_paths(task_description, repo_map_entries)
    if not explicit_paths:
        return False
    heading_count = len(re.findall(r"^#{1,3}\s", task_description, re.MULTILINE))
    return heading_count >= 2


def rank_candidate_files(task_description, repo_map_entries, pinned_paths=(), top_n=40):
    """Cheap relevance: token overlap between task words and path/summary text.
    Pinned paths (named verbatim in the task) always come first and count toward
    top_n; when any exist, the heuristic-ranked tail is deliberately shortened —
    a ticket precise enough to name its own files doesn't need 40 speculative
    extras alongside them."""
    by_path = {e["path"]: e for e in repo_map_entries}
    pinned_entries = [by_path[p] for p in pinned_paths if p in by_path]
    pinned_set = set(pinned_paths)

    effective_top_n = min(top_n, 8) if pinned_entries else top_n
    remaining_slots = max(effective_top_n - len(pinned_entries), 0)

    words = set(re.findall(r"[a-zA-Z_]{3,}", task_description.lower())) - STOPWORDS
    scored = []
    for entry in repo_map_entries:
        if entry["path"] in pinned_set:
            continue
        haystack_path = entry["path"].lower()
        haystack_summary = entry.get("summary", "").lower()
        # exports/constants named in the summary are a stronger signal than
        # incidental path substrings, so weight them higher
        score = sum(2 for w in words if w in haystack_summary) + sum(1 for w in words if w in haystack_path)
        if score > 0:
            scored.append((score, entry))
    scored.sort(key=lambda x: -x[0])
    return pinned_entries + [e for _, e in scored[:remaining_slots]]


def _file_budget_for_role(cfg, role_name):
    budget = cfg["budget"]
    per_role = budget.get("retrieved_files_by_role", {})
    return per_role.get(role_name, budget["retrieved_files_max"])


def build_context(cfg, base_url, task_description, role_name, repo_map_entries):
    root = cfg["repo"]["root"]
    role_dir = os.path.join(os.path.dirname(__file__), "roles")
    skills_dir = os.path.join(os.path.dirname(__file__), "skills")
    file_budget = _file_budget_for_role(cfg, role_name)

    role_prompt = load_role_prompt(role_dir, role_name)
    explicit_paths = extract_explicit_paths(task_description, repo_map_entries)
    candidates = rank_candidate_files(task_description, repo_map_entries, pinned_paths=explicit_paths)
    candidate_paths = [c["path"] for c in candidates]

    skill_text, skill_names = build_skill_context(task_description, candidate_paths, skills_dir, role_name)
    is_permission_sensitive = permission_sensitive(task_description, candidate_paths)

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
        tok = count_tokens(base_url, block, cfg)
        if used + tok > file_budget:
            # explicitly pinned files always get in even if a low-priority
            # heuristic pick before them would have blown the budget — re-check
            # without the running total for anything the task named by hand.
            if entry["path"] in explicit_paths:
                file_blocks.append(block)
                used += tok
                continue
            break
        file_blocks.append(block)
        used += tok

    return {
        # Ordered static-first: repo_map_text is byte-identical across every role
        # hop in one run_one_task() call, and skill_text is identical whenever the
        # same skill triggers for consecutive roles (e.g. specialist -> disclaimer).
        # Callers should assemble the final prompt in that order (repo map, skill,
        # role prompt, files) so llama.cpp's prefix cache has the longest possible
        # shared prefix to reuse across the chain — see GUIDE.md "Prompt ordering
        # for cache reuse".
        "repo_map_text": repo_map_text,
        "skill_text": skill_text,
        "role_prompt": role_prompt,
        "file_context": "\n".join(file_blocks),
        "files_included": [c["path"] for c in candidates[: len(file_blocks)]],
        "explicit_paths": explicit_paths,
        "permission_sensitive": is_permission_sensitive,
        "skill_names": skill_names,
    }
