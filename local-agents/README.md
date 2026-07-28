# local-agents

A standalone, local-LLM-only agent harness for this repo — runs against your own `llama-server`, never against Claude. It complements the Claude Code agent team in `.claude/agents/`, it doesn't replace it. Read **GUIDE.md** before running anything; this is a v1 scaffold, not a polished tool.

## Quick start

```bash
cd local-agents
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp config.example.toml config.toml   # edit base_url/model_alias/paths for your box
python run.py task "add a loading spinner to the mobile items list"
```

Every run creates an isolated `treehouse` worktree, never commits, never pushes. Review the diff yourself and merge by hand.

See `GUIDE.md` for the model setup, architecture, and the reasoning behind every design choice.
