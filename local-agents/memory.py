"""Session logging + expertise consolidation.

Format mirrors _project_specs/nightly/{date}-progress.md so a human
scanning both systems' logs sees the same shape. The key departure from
skillopt-sleep: promotion to memory/expertise/*.md is gated on gate.py's
objective PASS, not a fuzzy replay score.
"""
import os
import time

SESSIONS_DIR = os.path.join(os.path.dirname(__file__), "sessions")
EXPERTISE_DIR = os.path.join(os.path.dirname(__file__), "memory", "expertise")


def log_session(task_slug, role, task_description, workspace_path, gate_result, model_summary, role_stats=None):
    os.makedirs(SESSIONS_DIR, exist_ok=True)
    ts = time.strftime("%Y%m%d-%H%M%S")
    path = os.path.join(SESSIONS_DIR, f"{ts}-{task_slug}.md")
    checks_md = "\n".join(
        f"- [{'x' if c['ok'] else ' '}] {c['check']}: {'PASS' if c['ok'] else ('SKIPPED/MANUAL' if c['ok'] is None else 'FAIL')}"
        for c in gate_result["checks"]
    )
    stats_md = _role_stats_table(role_stats) if role_stats else ""
    content = f"""# Session — {ts}

**Role:** {role}
**Task:** {task_description}
**Workspace:** `{workspace_path}`
**Gate verdict:** {gate_result['verdict']}

## Gate checks
{checks_md or '(no applicable checks — no gated surfaces touched)'}
{stats_md}
## Model summary
{model_summary}
"""
    with open(path, "w") as f:
        f.write(content)
    return path


def _role_stats_table(role_stats):
    # role_stats: list of {"role", "status", "wall_time_s", "prompt_tokens",
    # "completion_tokens", "requests", "files_included"} — one entry per hop in the
    # chain. This is the concrete "where did the wall clock go" answer that used to
    # require guessing; see GUIDE.md "Reading the token/timing log".
    rows = "\n".join(
        f"| {s['role']} | {s['status']} | {s['wall_time_s']}s | {s['requests']} | "
        f"{s['prompt_tokens']} | {s['completion_tokens']} | {s['files_included']} |"
        for s in role_stats
    )
    total_time = sum(s["wall_time_s"] for s in role_stats)
    total_prompt = sum(s["prompt_tokens"] for s in role_stats)
    total_completion = sum(s["completion_tokens"] for s in role_stats)
    return f"""
## Token/timing per role hop
| role | status | wall time | LLM calls | prompt tok | completion tok | files inlined |
|---|---|---|---|---|---|---|
{rows}
| **total** | | **{round(total_time, 1)}s** | | **{total_prompt}** | **{total_completion}** | |
"""


def promote_to_expertise(domain, pattern_name, context, why_it_works, gate_result):
    if gate_result["verdict"] != "PASS":
        raise ValueError("refusing to promote a learning from a session whose gate did not PASS")
    os.makedirs(EXPERTISE_DIR, exist_ok=True)
    path = os.path.join(EXPERTISE_DIR, f"{domain}.md")
    entry = f"""
### {pattern_name}
**Discovered:** {time.strftime('%Y-%m-%d')}
**Context:** {context}
**Why it works:** {why_it_works}
"""
    mode = "a" if os.path.exists(path) else "w"
    with open(path, mode) as f:
        if mode == "w":
            f.write(f"# {domain} Expertise\n\n**Iterations:** 0\n\n## Patterns That Work\n")
        f.write(entry)
    return path
