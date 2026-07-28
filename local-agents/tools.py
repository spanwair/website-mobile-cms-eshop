"""Tool implementations exposed to the model, and their OpenAI-style schemas.

edit_file uses exact-string old->new replacement (like Claude Code's Edit
tool) rather than unified diffs. Small local models are unreliable at
generating correct diff hunks/line numbers but reliable at exact-match
replacement — and a non-matching old_string fails loudly instead of
corrupting the file, which matters more here than with a frontier model.
"""
import os
import subprocess

ALLOWED_COMMANDS = {
    "website:typecheck": ["pnpm", "typecheck"],
    "website:lint": ["pnpm", "lint"],
    "website:build": ["pnpm", "build"],
    "website:test:e2e": ["pnpm", "test:e2e"],
    "mobile:typecheck": ["pnpm", "typecheck"],
    "mobile:lint": ["pnpm", "lint"],
    "mobile:test": ["pnpm", "test"],
    "git:status": ["git", "status", "--short"],
    "git:diff": ["git", "diff"],
}


class ReadBeforeWriteError(Exception):
    pass


class Tools:
    def __init__(self, workspace_root):
        self.root = workspace_root
        self._read_paths = set()

    def _resolve(self, rel_path):
        full = os.path.abspath(os.path.join(self.root, rel_path))
        if not full.startswith(os.path.abspath(self.root)):
            raise ValueError(f"path escapes workspace: {rel_path}")
        return full

    def read_file(self, path):
        full = self._resolve(path)
        with open(full, errors="ignore") as f:
            content = f.read()
        self._read_paths.add(path)
        return content

    def write_file(self, path, content):
        full = self._resolve(path)
        if os.path.exists(full):
            raise FileExistsError(f"{path} exists — use edit_file to modify it")
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w") as f:
            f.write(content)
        return f"wrote {path} ({len(content.splitlines())} lines)"

    def edit_file(self, path, old_string, new_string, replace_all=False):
        if path not in self._read_paths:
            raise ReadBeforeWriteError(f"must read_file({path}) before editing it")
        full = self._resolve(path)
        with open(full) as f:
            content = f.read()
        count = content.count(old_string)
        if count == 0:
            raise ValueError(f"old_string not found verbatim in {path}")
        if count > 1 and not replace_all:
            raise ValueError(f"old_string is not unique in {path} ({count} matches) — add context or set replace_all")
        new_content = content.replace(old_string, new_string) if replace_all else content.replace(old_string, new_string, 1)
        with open(full, "w") as f:
            f.write(new_content)
        return f"edited {path}"

    def search_files(self, pattern, path_glob="."):
        result = subprocess.run(
            ["rg", "-n", "--max-count", "50", pattern, path_glob],
            cwd=self.root, capture_output=True, text=True,
        )
        return result.stdout or "(no matches)"

    def list_directory(self, path="."):
        full = self._resolve(path)
        return "\n".join(sorted(os.listdir(full)))

    def run_command(self, command_key):
        if command_key not in ALLOWED_COMMANDS:
            raise ValueError(f"command not allowlisted: {command_key}. allowed: {list(ALLOWED_COMMANDS)}")
        surface, _, argv_tail = command_key.partition(":")
        cwd = os.path.join(self.root, "website" if surface == "website" else "mobile") if surface in ("website", "mobile") else self.root
        result = subprocess.run(ALLOWED_COMMANDS[command_key], cwd=cwd, capture_output=True, text=True, timeout=600)
        return f"exit={result.returncode}\n{result.stdout[-4000:]}\n{result.stderr[-4000:]}"


TOOL_SCHEMAS = [
    {"type": "function", "function": {
        "name": "read_file", "description": "Read a file's full contents. Required before editing it.",
        "parameters": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]},
    }},
    {"type": "function", "function": {
        "name": "write_file", "description": "Create a NEW file. Fails if the file already exists.",
        "parameters": {"type": "object", "properties": {
            "path": {"type": "string"}, "content": {"type": "string"},
        }, "required": ["path", "content"]},
    }},
    {"type": "function", "function": {
        "name": "edit_file", "description": "Replace an exact substring in a file you have already read.",
        "parameters": {"type": "object", "properties": {
            "path": {"type": "string"}, "old_string": {"type": "string"},
            "new_string": {"type": "string"}, "replace_all": {"type": "boolean"},
        }, "required": ["path", "old_string", "new_string"]},
    }},
    {"type": "function", "function": {
        "name": "search_files", "description": "ripgrep search for a pattern under a path.",
        "parameters": {"type": "object", "properties": {
            "pattern": {"type": "string"}, "path_glob": {"type": "string"},
        }, "required": ["pattern"]},
    }},
    {"type": "function", "function": {
        "name": "list_directory", "description": "List entries in a directory.",
        "parameters": {"type": "object", "properties": {"path": {"type": "string"}}, "required": []},
    }},
    {"type": "function", "function": {
        "name": "run_command", "description": f"Run an allowlisted command. Keys: {list(ALLOWED_COMMANDS)}",
        "parameters": {"type": "object", "properties": {"command_key": {"type": "string"}}, "required": ["command_key"]},
    }},
    {"type": "function", "function": {
        "name": "done", "description": "Declare the task finished.",
        "parameters": {"type": "object", "properties": {"summary": {"type": "string"}}, "required": ["summary"]},
    }},
    {"type": "function", "function": {
        "name": "abort", "description": "Stop work because the task is wrong, infeasible, or you've lost confidence in the approach. Never push forward on a plan you no longer trust.",
        "parameters": {"type": "object", "properties": {"reason": {"type": "string"}}, "required": ["reason"]},
    }},
]
