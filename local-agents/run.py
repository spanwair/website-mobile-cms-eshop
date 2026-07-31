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

SPECIALIST_FOR_DOMAIN = {
    "website": "website-specialist", "mobile": "mobile-specialist", "supabase": "supabase-specialist",
}

# planner is a pure classification/handoff role (SURFACE + PERMISSION_SENSITIVE + a
# STEPS list) — no code judgment involved, so it's the one role that can safely run
# with thinking off. Everything else keeps reasoning on by default; tune per-role
# here once the token/timing log (memory.log_session) shows which hops are actually
# expensive, rather than guessing up front.
ROLE_THINKING = {
    "planner": False,
}

# Top-level directory a file lives under maps 1:1 to a ROLE_ORDER domain — used to
# pick the domain without a planner call when the task already names its files.
DOMAIN_FOR_DIR = {"mobile": "mobile", "website": "website", "supabase": "supabase", "shared": "shared"}


def load_config(path="config.toml"):
    with open(path, "rb") as f:
        return tomllib.load(f)


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:40]


def parse_planner_summary(summary):
    """Planner's output contract (roles/planner.md) always has SURFACE: and
    PERMISSION_SENSITIVE: lines — parsed here to pick the rest of the chain.
    PERMISSION_SENSITIVE from the model is advisory only: context_builder's
    deterministic check (same trigger table used for skill injection) is the
    authority and can only upgrade this to True, never downgrade it — see
    run_one_task's use of `ctx["permission_sensitive"]`."""
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


def domain_from_paths(paths):
    """Infer SURFACE from named files' top-level directory — used to skip the
    planner call entirely when looks_like_finished_plan() is true."""
    for p in paths:
        top = p.split("/", 1)[0]
        if top in DOMAIN_FOR_DIR:
            return DOMAIN_FOR_DIR[top]
    return "shared"


def assemble_prompt(ctx):
    """Static content first (repo map, then skill text if any), role-specific
    instructions and retrieved files last. Byte-identical repo_map_text/skill_text
    across consecutive role hops in the same chain gives llama.cpp's prefix cache
    a real shared prefix to reuse instead of reprocessing from token zero on every
    hop — see GUIDE.md "Prompt ordering for cache reuse"."""
    parts = ["## Repo map\n" + ctx["repo_map_text"]]
    if ctx["skill_text"]:
        parts.append(ctx["skill_text"])
    parts.append(ctx["role_prompt"])
    if ctx["file_context"]:
        parts.append("## Relevant files\n" + ctx["file_context"])
    return "\n\n---\n\n".join(parts)


def _build_chain(domain, permission_sensitive):
    chain = list(ROLE_ORDER[domain][1:])  # drop leading "planner"
    if permission_sensitive and "disclaimer" not in chain:
        pos = chain.index("code-reviewer") + 1 if "code-reviewer" in chain else len(chain)
        chain.insert(pos, "disclaimer")
    return chain


def run_one_task(cfg, description, forced_role=None):
    base_url = cfg["server"]["base_url"]
    slug = slugify(description)
    ws = Workspace(slug, cfg["workspace"]["lease_holder_prefix"])
    ws.acquire()
    print(f"workspace: {ws.path}", file=sys.stderr)

    repo_map_payload = repo_map.build_cached(cfg["repo"]["root"], cfg["repo"]["exclude"], ".cache")
    entries = repo_map_payload["entries"]

    # forced_role: single-role debug mode, unchanged.
    #
    # Otherwise: if the task text is already a scoped implementation plan (names
    # its own files, has structured sections — see context_builder's
    # looks_like_finished_plan) there is nothing left for planner+architect to
    # scope, so skip straight to the specialist. This is the common case for
    # tickets in this repo (see GUIDE.md "Skipping planner/architect") — planner
    # otherwise re-derives SURFACE from a file path the ticket already gave it.
    #
    # Plain feature requests still start at planner, whose SURFACE/PERMISSION_
    # SENSITIVE verdict expands the queue to the rest of ROLE_ORDER for that
    # domain, all in this one workspace (closes the "no auto-chaining" gap
    # GUIDE.md used to flag).
    skip_planning = False
    if not forced_role:
        explicit_paths = context_builder.extract_explicit_paths(description, entries)
        if context_builder.looks_like_finished_plan(description, entries):
            skip_planning = True
            domain = domain_from_paths(explicit_paths)
            det_permission_sensitive = context_builder.permission_sensitive(description, explicit_paths)
            roles = _build_chain(domain, det_permission_sensitive)
            print(
                f"[skip-planning] finished plan detected (paths: {explicit_paths}) -> "
                f"domain={domain} permission_sensitive={det_permission_sensitive}",
                file=sys.stderr,
            )
    if not skip_planning:
        roles = [forced_role] if forced_role else ["planner"]

    history = []
    role_stats = []
    last_result = None
    idx = 0
    # Everything in this loop that talks to the model server is expected to fail
    # sometimes on hardware this constrained (agent_loop already turns network/
    # timeout errors into a SERVER_ERROR result rather than raising). This try/except
    # is the backstop for anything that *isn't* already handled that way — a bug, an
    # unexpected exception type — so a crash here still falls through to the gate/log
    # block below instead of losing the workspace lease with zero record of what
    # happened, the way an uncaught httpx.ReadTimeout used to. See GUIDE.md
    # "Bounding tool-loop growth" / "Never lose a workspace lease to a crash".
    try:
        while idx < len(roles):
            role = roles[idx]
            idx += 1
            task_for_role = description
            if history:
                prior = "\n\n".join(f"### {r} output\n{s}" for r, s in history)
                task_for_role = f"{description}\n\n## Work so far (prior roles in this chain)\n{prior}"

            ctx = context_builder.build_context(cfg, base_url, task_for_role, role, entries)
            full_prompt = assemble_prompt(ctx)
            thinking = ROLE_THINKING.get(role, True)
            max_calls = cfg["limits"].get("max_tool_calls_by_role", {}).get(
                role, cfg["limits"]["max_tool_calls_per_task"]
            )
            last_result = run_task(
                cfg, base_url, cfg["server"]["model_alias"], full_prompt, task_for_role, ws.path,
                thinking=thinking, max_calls=max_calls,
            )
            usage = last_result.get("usage", {})
            role_stats.append({
                "role": role, "status": last_result["status"],
                "wall_time_s": last_result.get("wall_time_s", 0),
                "requests": usage.get("requests", 0),
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "files_included": len(ctx["files_included"]),
            })
            print(
                f"[{role}] {last_result['status']} "
                f"({last_result.get('wall_time_s', 0)}s, "
                f"{usage.get('prompt_tokens', 0)} prompt / {usage.get('completion_tokens', 0)} completion tok, "
                f"{len(ctx['files_included'])} files)",
                file=sys.stderr,
            )
            if last_result["status"] == "SERVER_ERROR":
                print(f"[{role}] server error: {last_result.get('error', '(no detail)')}", file=sys.stderr)

            if last_result["status"] in ("ABORTED", "TIMEOUT", "MAX_CALLS_EXCEEDED", "SERVER_ERROR"):
                break

            summary = last_result.get("summary", "")
            history.append((role, summary))

            if role == "planner" and not forced_role:
                surfaces, model_permission_sensitive = parse_planner_summary(summary)
                domain = pick_domain(surfaces)
                # deterministic check can only upgrade yes/no to yes, never downgrade —
                # see parse_planner_summary's docstring
                permission_sensitive = model_permission_sensitive or ctx["permission_sensitive"]
                chain = _build_chain(domain, permission_sensitive)
                roles = roles + chain
    except Exception as e:
        print(f"[CRASHED] unexpected error during role chain: {type(e).__name__}: {e}", file=sys.stderr)
        last_result = {"status": "CRASHED", "reason": f"{type(e).__name__}: {e}"}
        role_stats.append({
            "role": roles[idx - 1] if 0 < idx <= len(roles) else "(unknown)", "status": "CRASHED",
            "wall_time_s": 0, "requests": 0, "prompt_tokens": 0, "completion_tokens": 0, "files_included": 0,
        })

    touched = ws.touched_files()
    gate_result = gate_mod.run_gate(ws.path, cfg, touched) if touched else {"verdict": "PASS", "checks": []}
    combined_summary = "\n\n".join(f"[{r}] {s}" for r, s in history) or (
        last_result.get("reason", last_result["status"]) if last_result else "no result"
    )
    log_path = memory.log_session(
        slug, forced_role or "auto-chain", description, ws.path, gate_result, combined_summary,
        role_stats=role_stats,
    )
    total_time = sum(s["wall_time_s"] for s in role_stats)
    total_prompt = sum(s["prompt_tokens"] for s in role_stats)
    print(f"session log: {log_path}", file=sys.stderr)
    print(f"total: {round(total_time, 1)}s, {total_prompt} prompt tokens across {len(role_stats)} hop(s)", file=sys.stderr)
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
