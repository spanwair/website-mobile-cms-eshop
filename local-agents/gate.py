"""Deterministic merge gate. No LLM judgment — pass/fail is entirely from
exit codes of real commands. This is the thing that makes "never break the
code" enforceable: a task's workspace is only ever flagged mergeable if
every applicable check below exits 0. Nothing here auto-commits or pushes.

This directly replaces the old skillopt-sleep gate, which scored every
candidate 0.000 via a mock replay backend and rejected all 14/14 sessions —
see .skillopt-sleep/staging/20260721-031702/report.json. An objective,
observable gate (did the real build/test commands pass?) can't silently
no-op the way a fuzzy replay score did.
"""
import subprocess


def _run(cmd, cwd):
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=900)
    return result.returncode == 0, result.stdout[-4000:] + result.stderr[-4000:]


def run_gate(workspace_path, cfg, touched_files):
    checks = []
    website_touched = any(f.startswith(cfg["gate"]["website_dir"] + "/") for f in touched_files)
    mobile_touched = any(f.startswith(cfg["gate"]["mobile_dir"] + "/") for f in touched_files)
    shared_touched = any(f.startswith(cfg["gate"]["shared_dir"] + "/") for f in touched_files)
    admin_touched = any(
        f.startswith(p) for f in touched_files for p in cfg["gate"]["admin_permission_paths"]
    )

    if website_touched or shared_touched:
        for label, cmd in [
            ("website:typecheck", ["pnpm", "typecheck"]),
            ("website:lint", ["pnpm", "lint"]),
            ("website:build", ["pnpm", "build"]),
        ]:
            ok, out = _run(cmd, f"{workspace_path}/website")
            checks.append({"check": label, "ok": ok, "output": out})

    if mobile_touched or shared_touched:
        for label, cmd in [
            ("mobile:typecheck", ["pnpm", "typecheck"]),
            ("mobile:lint", ["pnpm", "lint"]),
        ]:
            ok, out = _run(cmd, f"{workspace_path}/mobile")
            checks.append({"check": label, "ok": ok, "output": out})
        checks.append({
            "check": "mobile:test", "ok": None,
            "output": "SKIPPED — mobile/ has zero test files as of this scaffold. "
                      "Gate cannot enforce regression safety here until tests exist. "
                      "See GUIDE.md 'Known limitations'.",
        })

    if admin_touched:
        spec_args = []
        for spec in cfg["gate"]["admin_permission_specs"]:
            spec_args += ["-g", f"*{spec}*"]
        ok, out = _run(["pnpm", "playwright", "test"] + spec_args, f"{workspace_path}/website")
        checks.append({"check": "e2e:admin-permission-specs", "ok": ok, "output": out})
        checks.append({
            "check": "disclaimer:manual-checklist", "ok": None,
            "output": "MANUAL — run the owner/admin/eshop_admin/user persona checklist from "
                      "the admin-permissions skill; this cannot be fully automated.",
        })

    hard_fails = [c for c in checks if c["ok"] is False]
    verdict = "PASS" if not hard_fails else "FAIL"
    return {"verdict": verdict, "checks": checks}
