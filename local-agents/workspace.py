"""Treehouse worktree lifecycle — mirrors .claude/agents/nightly-autonomous-agent.md
conventions exactly (naming, lease semantics, never-commit rule) so the two
systems stay legible side by side. Lease-holder prefix is distinct
("local-agent-*" vs the Claude nightly agent's "nightly-*") to avoid any
naming collision if both run against the same treehouse pool.
"""
import subprocess
import time


class Workspace:
    def __init__(self, task_slug, lease_holder_prefix="local-agent"):
        ts = time.strftime("%Y%m%d-%H%M%S")
        self.lease_holder = f"{lease_holder_prefix}-{ts}-{task_slug}"
        self.path = None

    def acquire(self):
        result = subprocess.run(
            ["treehouse", "get", "--lease", "--lease-holder", self.lease_holder],
            capture_output=True, text=True, check=True,
        )
        self.path = result.stdout.strip()
        return self.path

    def release(self, force=False):
        if not self.path:
            return
        cmd = ["treehouse", "return", "--if-lease-holder", self.lease_holder]
        if force:
            cmd.append("--force")
        cmd.append(self.path)
        subprocess.run(cmd, capture_output=True, text=True)

    def touched_files(self):
        result = subprocess.run(
            ["git", "diff", "--name-only", "HEAD"], cwd=self.path, capture_output=True, text=True,
        )
        return [l for l in result.stdout.splitlines() if l]
