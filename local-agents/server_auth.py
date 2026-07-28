"""Auth header for llama-server calls. The server is started with
`--api-key <token>` (a changeable password, not a fixed secret) — this reads
it from LLAMA_SERVER_API_KEY, auto-loaded from the repo's .env.development
(per .claude/CLAUDE.md: "credentials only in .env.development/.env.production
/.envrc — never hardcode"), or config.toml's [server].api_key as a fallback.
An already-exported shell env var always wins over the file.
"""
import os

_ENV_LOADED = False


def _load_env_file(repo_root):
    global _ENV_LOADED
    if _ENV_LOADED:
        return
    _ENV_LOADED = True
    path = os.path.join(repo_root, ".env.development")
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def headers(cfg):
    _load_env_file(cfg.get("repo", {}).get("root", "."))
    key = os.environ.get("LLAMA_SERVER_API_KEY") or cfg.get("server", {}).get("api_key")
    return {"Authorization": f"Bearer {key}"} if key else {}
