"""CLI entrypoint — hybrid autonomy.

  python run.py task "<description>" --role planner
      One interactive task, one treehouse workspace, human reviews after.

  python run.py loop
      Continuous/nightly mode: repeats the discover -> plan -> execute ->
      gate -> log cycle from _project_specs/todos/active.md, honoring
      [loop].enabled_hours in config.toml. Never commits, never pushes —
      same as .claude/agents/nightly-autonomous-agent.md.

Both paths always end in gate.py before a workspace is reported mergeable;
neither path ever runs `git commit` or `git push`.
"""
import argparse
import re
import sys
import time

try:
    import tomllib
except ModuleNotFoundError:
    import tomli as tomllib  # Python <3.11 backport

import context_builder
import gate as gate_mod
import memory
import repo_map
from agent_loop import run_task
from workspace import Workspace

ROLE_ORDER = {
    "website": ["planner", "architect", "website-specialist", "tester", "code-reviewer"],
    "mobile": ["planner", "architect", "mobile-specialist", "tester", "code-reviewer"],
    "supabase": ["planner", "architect", "supabase-specialist", "tester", "code-reviewer"],
    "shared": ["planner", "architect", "tester", "code-reviewer"],
}


def load_config(path="config.toml"):
    with open(path, "rb") as f:
        return tomllib.load(f)


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:40]


def parse_planner_summary(summary):
    """Planner's output contract (roles/planner.md) always has SURFACE: and
    PERMISSION_SENSITIVE: lines — parsed here to pick the rest of the chain."""
    surface_match = re.search(r"SURFACE:\s*([a-z, ]+)", summary, re.IGNORECASE)
    perm_match = re.search(r"PERMISSION_SENSITIVE:\s*(yes|no)", summary, re.IGNORECASE)
    surfaces = [s.strip().lower() for s in surface_match.group(1).split(",")] if surface_match else ["shared"]
    permission_sensitive = bool(perm_match) and perm_match.group(1).lower() == "yes"
    return surfaces, permission_sensitive


def pick_domain(surfaces):
    for s in surfaces:
        if s in ROLE_ORDER:
            return s
    return "shared"


def run_one_task(cfg, description, forced_role=None):
    base_url = cfg["server"]["base_url"]
    slug = slugify(description)
    ws = Workspace(slug, cfg["workspace"]["lease_holder_prefix"])
    ws.acquire()
    print(f"workspace: {ws.path}", file=sys.stderr)

    repo_map_payload = repo_map.build_cached(cfg["repo"]["root"], cfg["repo"]["exclude"], ".cache")
    entries = repo_map_payload["entries"]

    # forced_role: single-role debug mode, unchanged. Otherwise: planner runs
    # first, then its SURFACE/PERMISSION_SENSITIVE verdict expands the queue
    # to the rest of ROLE_ORDER for that domain, all in this one workspace —
    # closing the "no auto-chaining" gap noted in GUIDE.md "Known limitations".
    roles = [forced_role] if forced_role else ["planner"]
    history = []
    last_result = None
    idx = 0
    while idx < len(roles):
        role = roles[idx]
        idx += 1
        task_for_role = description
        if history:
            prior = "\n\n".join(f"### {r} output\n{s}" for r, s in history)
            task_for_role = f"{description}\n\n## Work so far (prior roles in this chain)\n{prior}"

        ctx = context_builder.build_context(cfg, base_url, task_for_role, role, entries)
        full_prompt = ctx["system_prompt"] + "\n\n## Repo map\n" + ctx["repo_map_text"] + "\n\n## Relevant files\n" + ctx["file_context"]
        last_result = run_task(cfg, base_url, cfg["server"]["model_alias"], full_prompt, task_for_role, ws.path)
        print(f"[{role}] {last_result['status']}", file=sys.stderr)

        if last_result["status"] in ("ABORTED", "TIMEOUT", "MAX_CALLS_EXCEEDED"):
            break

        summary = last_result.get("summary", "")
        history.append((role, summary))

        if role == "planner" and not forced_role:
            surfaces, permission_sensitive = parse_planner_summary(summary)
            domain = pick_domain(surfaces)
            chain = list(ROLE_ORDER[domain][1:])  # drop leading "planner", already ran
            if permission_sensitive and "disclaimer" not in chain:
                pos = chain.index("code-reviewer") + 1 if "code-reviewer" in chain else len(chain)
                chain.insert(pos, "disclaimer")
            roles = roles + chain

    touched = ws.touched_files()
    gate_result = gate_mod.run_gate(ws.path, cfg, touched) if touched else {"verdict": "PASS", "checks": []}
    combined_summary = "\n\n".join(f"[{r}] {s}" for r, s in history) or (
        last_result.get("reason", last_result["status"]) if last_result else "no result"
    )
    log_path = memory.log_session(
        slug, forced_role or "auto-chain", description, ws.path, gate_result, combined_summary,
    )
    print(f"session log: {log_path}", file=sys.stderr)
    print(f"gate: {gate_result['verdict']}", file=sys.stderr)
    print(f"NOT committed, NOT pushed — review {ws.path} and merge by hand.", file=sys.stderr)
    return gate_result


def loop_mode(cfg):
    hours = cfg["loop"]["enabled_hours"]
    while True:
        if hours != "any":
            start, end = hours.split("-")
            now = time.strftime("%H:%M")
            in_window = (start <= now <= end) if start < end else (now >= start or now <= end)
            if not in_window:
                time.sleep(cfg["loop"]["poll_interval_s"])
                continue
        # Discovery source, in priority order, mirrors nightly-autonomous-agent.md:
        # failing tests > type errors > todos > human feedback file.
        # v1 scaffold: read the first unchecked item from _project_specs/todos/active.md.
        todo = next_todo_item(cfg)
        if not todo:
            print("no pending todo items; sleeping", file=sys.stderr)
            time.sleep(cfg["loop"]["poll_interval_s"])
            continue
        run_one_task(cfg, todo)


def next_todo_item(cfg):
    import os
    path = os.path.join(cfg["repo"]["root"], "_project_specs", "todos", "active.md")
    if not os.path.exists(path):
        return None
    with open(path) as f:
        for line in f:
            if line.strip().startswith("- [ ]"):
                return line.strip()[6:].strip()
    return None


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)
    task_p = sub.add_parser("task")
    task_p.add_argument("description")
    task_p.add_argument("--role", default=None, choices=[
        "planner", "architect", "website-specialist", "mobile-specialist",
        "supabase-specialist", "tester", "code-reviewer", "disclaimer",
    ])
    sub.add_parser("loop")
    args = parser.parse_args()

    cfg = load_config()
    if args.cmd == "task":
        run_one_task(cfg, args.description, args.role)
    elif args.cmd == "loop":
        loop_mode(cfg)
