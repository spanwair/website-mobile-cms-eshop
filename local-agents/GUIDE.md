# local-agents — Production Guide

A standalone agentic coding system that runs entirely against your own local model (`llama-server`, no cloud calls), scoped to this repo. It reuses the role structure and conventions of `.claude/agents/*.md` and the `admin-permissions` skill, but it is a **separate harness** — Claude Code cannot be repointed at a local model, so this is new software, not a config change.

Read this once, start to finish, before running `run.py`. It explains every design decision so you don't have to re-derive them later.

---

## 1. Core principles (read this before changing anything)

1. **One model, always loaded, never swapped.** Every "role" (planner, architect, specialist, tester, reviewer, disclaimer) is a different *system prompt* sent to the same running `llama-server` process. The harness never requests a model reload. This is both a hardware constraint (your GPU can't hold two models) and a latency win — no reload tax between roles.
2. **Deterministic gates beat LLM self-judgment.** A 35B-A3B local model, however good, will hallucinate and will occasionally decide broken code is fine. Every task ends at `gate.py`, which runs real `pnpm typecheck` / `lint` / `build` / `playwright test` commands and reports PASS/FAIL from exit codes — never from the model's opinion of its own work.
3. **Isolation, never direct edits.** Every task runs inside a `treehouse`-leased git worktree. The harness **never commits, never pushes** — this mirrors `.claude/agents/nightly-autonomous-agent.md`'s existing rule and is the single biggest safety property in this whole system: a bad run costs you a `treehouse destroy`, not a broken main branch.
4. **Read-before-write, exact-match edits.** `edit_file` requires the file to have been `read_file`'d first in the same session, and replaces an exact substring (like Claude Code's own Edit tool) rather than a diff. Small models are unreliable at diff hunks/line numbers but reliable at exact-match replacement, and a non-matching `old_string` fails loudly instead of silently corrupting a file.
5. **Abort is a first-class action.** The model has an `abort(reason)` tool it's explicitly told to prefer over pushing forward on a plan it no longer trusts. This is the "go back when the concept is wrong" mechanism you asked for — it's a tool call, not a hope that the model self-corrects in prose.
6. **Context budget is enforced by code, not by asking the model to be concise.** See §4.

None of this makes the system unable to ship a bug — no system built on any model size can promise that. What it guarantees structurally: nothing merges without passing the same real commands a human would run, and every change is reversible until a human explicitly merges it.

---

## 2. Model & hardware setup

### What changed from your current Gemma setup, and why

Your current command:
```
llama-server -m gemma-4-31B-it-UD-Q4_K_XL.gguf -c 131072 -ngl 15 -fa on -ctk q8_0 -ctv q8_0 -nkvo -b 256 -ub 128 --jinja --webui-mcp-proxy --port 8080 --host 0.0.0.0
```

Recommended replacement:
```
llama-server \
  -hf unsloth/Qwen3.6-35B-A3B-GGUF:UD-Q4_K_XL \
  -c 100000 \
  --n-cpu-moe 40 \
  -fa on -ctk q8_0 -ctv q8_0 -nkvo \
  -b 256 -ub 128 \
  --jinja \
  --port 8080 --host 0.0.0.0
```

Changes and why:

| Change | Reason |
|---|---|
| Gemma4-31B (dense) → Qwen3.6-35B-A3B (MoE, ~3B active/token) | Dense models activate every parameter every token; on an 8GB card most of that compute happens on CPU, which is why you're seeing ~4 t/s. MoE activates ~3B params/token regardless of the 35B total, so CPU-side compute per token is far cheaper. Qwen3.6-35B-A3B also scores >2x Gemma4-31B on MCPMark (tool-calling/MCP benchmark) — directly relevant since this whole system runs on tool calls. |
| `-ngl 15` → `--n-cpu-moe 40` | `-ngl` offloads N whole transformer layers to GPU — for a dense model that's the right lever. For MoE, the right lever is `--n-cpu-moe N`, which keeps attention + shared-expert weights on GPU and pushes routed-expert FFN weights to CPU RAM. This is the flag actually designed for "small GPU, big MoE model." Start at 40, watch `nvidia-smi` and lower it (more on GPU) if you have VRAM headroom, or raise it (more on CPU) if you OOM. |
| `-c 131072` → `-c 100000` | Your own stated ceiling. Native context on this model family is much larger, but 100k is what you asked for as the working budget — see §4 for how it's spent. |
| Dropped `--webui-mcp-proxy` | This flag makes the web UI proxy MCP requests through the server. It's unrelated to API-level tool calling (which `--jinja` + `/v1/chat/completions` already gives you) and combined with `--host 0.0.0.0` it's a known open-proxy exposure on your LAN (upstream issue ggml-org/llama.cpp#20372). Drop it unless you're actively using the browser web UI's MCP features. |
| Kept `-fa on -ctk q8_0 -ctv q8_0 -nkvo -b 256 -ub 128` | These were already right: flash attention on, quantized KV cache (halves KV memory vs fp16), KV cache kept off-GPU (`-nkvo`) so it doesn't compete with the tight 8GB budget, and small batch sizes appropriate for a memory-constrained box. |

On-disk size at `UD-Q4_K_XL`: ~22.4GB. With 32GB system RAM + 8GB VRAM this fits with room for the KV cache, but exact `--n-cpu-moe` tuning is something you dial in by watching memory headroom on your actual box — don't treat the value 40 above as exact, treat it as a starting point.

### Verifying tool calling works

Before wiring up the harness, confirm the server round-trips a tool call correctly:

```bash
curl -s http://192.168.0.108:8080/v1/chat/completions -H "Content-Type: application/json" -d '{
  "model": "qwen3.6-35b-a3b",
  "messages": [{"role":"user","content":"What files are in the current directory? Use the tool."}],
  "tools": [{"type":"function","function":{"name":"list_directory","description":"list files","parameters":{"type":"object","properties":{"path":{"type":"string"}}}}}]
}'
```

You should get back a `tool_calls` array in the response, not prose. If you get prose instead, double-check `--jinja` is set and that the model's built-in chat template supports tool calling (Qwen3.x models do).

---

## 3. Architecture

```
local-agents/
├── GUIDE.md              # this file
├── README.md             # quick start
├── config.example.toml   # copy to config.toml, edit for your box
├── requirements.txt
├── repo_map.py            # builds+caches a compact index of the repo
├── context_builder.py     # assembles system prompt + retrieved files, within budget
├── tools.py                # tool implementations + JSON schemas (read/write/edit/search/run/done/abort)
├── agent_loop.py           # the OpenAI-style tool-calling loop against llama-server
├── workspace.py             # treehouse lease/return wrapper
├── gate.py                   # deterministic pass/fail gate (typecheck/lint/build/e2e)
├── memory.py                  # session logging + expertise consolidation
├── run.py                      # CLI: `task` (interactive) and `loop` (continuous/nightly)
├── roles/                       # one system-prompt file per agent role
│   ├── planner.md
│   ├── architect.md
│   ├── website-specialist.md
│   ├── mobile-specialist.md
│   ├── supabase-specialist.md
│   ├── tester.md
│   ├── code-reviewer.md
│   └── disclaimer.md
├── skills/
│   └── admin-permissions.md    # auto-injected when a task is permission-sensitive
├── sessions/                    # one markdown log per task run
└── memory/expertise/            # promoted learnings, gated on gate.py PASS
```

### Mapping to the existing Claude Code agent team

| `.claude/agents/*.md` | `local-agents/roles/*.md` | Notes |
|---|---|---|
| `project-leader.md` | `planner.md` | Same scoping job, tightened output contract (small models need an explicit format, not prose) |
| `architect.md` | `architect.md` | Same placement rules, condensed |
| `mobile-specialist.md` | `mobile-specialist.md` | Same, plus an explicit callout that mobile has zero existing tests |
| `website-specialist.md` | `website-specialist.md` | Same, admin-permissions trigger made explicit and abortable |
| `supabase-specialist.md` | `supabase-specialist.md` | Same, migration-push is explicitly a human-only action |
| `tester.md` | `tester.md` | Same verification duty |
| `code-reviewer.md` | `code-reviewer.md` | Same final-gate role, but the *actual* merge gate is `gate.py`, not this role's opinion |
| `disclaimer.md` | `disclaimer.md` | Ported the exact persona checklist from `CLAUDE.md` |
| `copier.md` | *(not ported)* | Cross-project migration is a judgment-heavy task better suited to Claude Code; out of scope for v1 |
| `nightly-autonomous-agent.md` | `run.py loop` mode | Same discover→plan→execute→validate→log→evolve shape, see §8 |

---

## 4. Context budgeting — how a 100k window stays on-point

This is the piece that keeps a small model from being handed the whole repo and drowning. `config.toml [budget]` enforces a hard split (defaults shown, tune per task type):

| Slice | Tokens | Enforced by |
|---|---|---|
| Output reserve | 8,000 | left unfilled |
| Tool-call round-trip overhead | 10,000 | left unfilled |
| System prompt (role + auto-injected skill) | ≤6,000 | `context_builder.build_context` truncates role file loading is capped; skills are small by design |
| Repo map (always included) | ≤3,000 | `repo_map.py` excludes generated/data files entirely (`shared/supabase/types.ts`, i18n locale files — 3143 and 1318 lines respectively, near-zero architectural signal per token) |
| Retrieved file content | ≤60,000 | `context_builder.rank_candidate_files` + a running token count via the server's own `/tokenize` endpoint, stops adding files once the cap is hit |
| Tool-call history buffer | remainder (~13,000) | `agent_loop.py`'s `max_tool_calls_per_task` cap (default 40) bounds how much history can accumulate |

**Retrieval is heuristic, not embeddings.** `rank_candidate_files` scores repo-map entries by keyword overlap between the task description and each file's path + one-line export summary. This is deliberately simple: an embedding model would need to run somewhere, and running it on the GPU competes with the coding model for the same 8GB you're trying not to swap; running it CPU-only means a second always-resident process, which is a bigger commitment. Start with heuristic retrieval and see if it's precise enough — for a monorepo where paths are meaningful (`admin/products/[id].astro`, `shared/services/orderService.ts`) it usually is.

**Upgrading retrieval later**, if heuristic ranking starts missing relevant files: run a small embedding-only model (e.g. a ~100-300M param model like `bge-small` or `nomic-embed-text`) CPU-only, permanently resident, separate from the coding model entirely. It's cheap enough on CPU that it doesn't compete for the GPU budget and doesn't violate the "one model, never swapped" principle for the *coding* model — it's a different, much smaller tool. Not built in this scaffold; a natural v2.

---

## 5. The tool-calling loop

`agent_loop.run_task` is a standard OpenAI-style loop: send `messages` + `tools` to `/v1/chat/completions`, if the response has `tool_calls`, execute each and append `{"role": "tool", ...}` results, repeat. Two things make it safer for a smaller/less reliable model than a naive version:

- **Hard caps.** `max_tool_calls_per_task` (default 40) and `max_wall_clock_s` (default 3600) in `config.toml`. Small models are more prone to loops (re-reading the same file, retrying an edit that keeps failing for the same reason) — these caps turn a runaway loop into a bounded, logged failure instead of an unbounded one.
- **Tool errors go back to the model, not up to the caller.** If `edit_file` fails because `old_string` wasn't found, the model sees `ERROR: ...` as the tool result and can retry with corrected input, rather than the whole task crashing. Only `done` and `abort` end the loop.

`tools.py`'s allowlist for `run_command` is intentionally narrow — `pnpm typecheck/lint/build/test:e2e` per surface, plus `git status`/`git diff`. No arbitrary shell access. If you need a new command available to the model, add it to `ALLOWED_COMMANDS` explicitly; don't widen this to a general shell tool.

---

## 6. Treehouse workspace lifecycle

`workspace.py` wraps the `treehouse` CLI already vendored in this repo (`treehouse/`, kunchenguid/treehouse v2.1.0). Every task:

1. `treehouse get --lease --lease-holder "local-agent-{timestamp}-{task-slug}"` — durable lease, no subshell, prints the worktree path.
2. All tool calls (`read_file`, `edit_file`, `run_command`, ...) are scoped to that worktree path — `Tools._resolve` rejects any path that would escape it.
3. On completion (success, FAIL, TIMEOUT, or ABORTED), the workspace is **left leased**, not released — same as the nightly Claude agent's "never release, human reviews in the morning" convention. You inspect it with `treehouse status`, review the diff, and either merge by hand or `treehouse return`/`treehouse destroy` it.

**Naming collision note:** the existing Claude nightly agent uses lease-holder prefix `nightly-{timestamp}-{task-slug}`; this system uses `local-agent-{timestamp}-{task-slug}`. They're distinguishable in `treehouse status` output. If you ever run both systems' continuous/loop modes at the same time against the same repo, you'll have two sets of unmerged worktrees to review each morning — that's fine, but don't let them silently accumulate; review and prune regularly (`treehouse prune` is a dry run by default, so it's safe to run often just to see what's stale).

---

## 7. The gate — what "never break the code" actually means here

`gate.py` runs after every task, before a workspace is ever described as mergeable. It's pure Python + `subprocess`, no LLM involved:

- Touches `website/` or `shared/` → `pnpm typecheck`, `pnpm lint`, `pnpm build` in `website/`.
- Touches `mobile/` or `shared/` → `pnpm typecheck`, `pnpm lint` in `mobile/`. `pnpm test` is **not** run automatically because `mobile/` currently has zero test files — the gate reports this as an explicit `SKIPPED` line rather than silently passing, so you're never fooled into thinking mobile is regression-tested when it isn't. Closing this gap (writing the first mobile Jest tests) is the single highest-leverage thing you could do to strengthen this whole system.
- Touches anything in `admin_permission_paths` (mirrors the `CLAUDE.md` auto-trigger list) → runs the Playwright specs covering roles/permissions/multi-org security (09, 12, 14-17), and flags the disclaimer persona checklist as a required **manual** step — some of it (server-rendered redirect behavior across four personas) isn't fully automatable from a single E2E pass and needs a human's eyes, same as it does today for the Claude-based team.
- `supabase/migrations/` changes are **never** auto-applied. The gate can check the migration file exists and is well-formed, but running `./scripts/db-push.sh development` against even the dev database is left as an explicit human step, matching the existing project rule that all DB changes are reviewed before they touch a real Supabase project.

Verdict is `PASS` only if every check that ran returned exit code 0. Anything `None` (skipped/manual) doesn't block the verdict but is always printed — you decide whether "PASS but 2 manual items outstanding" is good enough to merge.

---

## 8. Running it

### Interactive (single task)

```bash
python run.py task "add pagination to the admin orders list" --role website-specialist
```

Runs one role (or, if you omit `--role`, starts at `planner` and you re-invoke with the role it recommends — v1 doesn't auto-chain roles yet, see §10). Ends with a session log in `sessions/` and a gate verdict printed to stderr. Nothing is committed.

### Continuous / nightly (`loop` mode)

```bash
python run.py loop
```

Pulls the next unchecked `- [ ]` item from `_project_specs/todos/active.md`, runs it through the same task pipeline, logs it, and moves to the next. Respects `config.toml [loop].enabled_hours` — set to `"22:00-08:00"` if you want it to only run overnight (same window as the Claude nightly agent), or `"any"` for always-on. This is intentionally the *simplest* possible version of the discover→prioritize→execute→validate→log loop in `nightly-autonomous-agent.md` — no priority scoring, no expertise-file auto-updates yet. Treat it as a starting point you'll extend once you trust the gate's judgment on real tasks.

**Do not run this unattended against real todo items until you've run several `task` invocations by hand and are satisfied with the gate's behavior on your actual codebase.** Interactive-first was your own call when we scoped this, and it's the right one for a v1.

### Coexisting with the Claude Code nightly agent

Nothing prevents both `run.py loop` and `.claude/agents/nightly-autonomous-agent.md` from running the same night. If you do run both: they use distinct treehouse lease-holder prefixes so they won't collide on the same worktree, but you'll have two independent sets of candidate changes to review each morning, potentially touching overlapping files in *different* worktrees. Recommendation: pick disjoint task sources (e.g., point the local loop only at a specific tagged subset of `_project_specs/todos/active.md`, leave the rest to the Claude agent) until you have a feel for how often they'd actually conflict.

---

## 9. Memory & self-evolution — fixing what skillopt-sleep got wrong

`.skillopt-sleep/staging/20260721-031702/report.json` shows the existing self-evolution plugin's most recent run: `baseline_score: 0.0`, `candidate_score: 0.0`, `accepted: false`, `edits: []` — every one of 14 sessions rejected, using a `mock` replay backend. The gate never actually observed real pass/fail; it observed a placeholder that always evaluates to zero, so nothing was ever promoted.

`memory.py` avoids this by tying promotion to something objective: `promote_to_expertise()` **refuses to run** unless `gate_result["verdict"] == "PASS"` — i.e., a learning only gets written to `memory/expertise/*.md` after real typecheck/lint/build/test commands actually succeeded for that session. There's no scoring model, no replay, nothing that can silently return zero forever. The tradeoff is it's coarser (binary gate pass, not a graded score) — that's intentional; a binary signal you can trust beats a graded one you can't.

`log_session()` writes one markdown file per task to `sessions/`, in the same shape as `_project_specs/nightly/{date}-progress.md` so the two systems' logs are easy to compare side by side.

**This is a starting point, not a finished self-evolution system.** What it does today: log everything, and let you (or a future automated step) manually call `promote_to_expertise` for genuinely reusable patterns you notice across sessions. What it doesn't do yet: automatically mine sessions for patterns, automatically rewrite role prompts, or replay past tasks to validate a prompt change before adopting it. Build that once you have enough real session logs to know what patterns are actually worth automating — building it before that is exactly the trap `skillopt-sleep` fell into (a scoring mechanism with nothing real to score against).

---

## 10. Known limitations — read this before trusting it with anything important

- **No role auto-chaining yet.** `planner` recommends a role sequence in its output, but `run.py task` doesn't yet parse that and automatically invoke each subsequent role. For now, read the planner's `STEPS:` output and re-invoke `run.py task` with `--role <next>` yourself. Automating this chain is the natural next increment once you trust each role in isolation.
- **Retrieval is heuristic**, not embeddings — see §4. It will occasionally miss a relevant file with an unhelpful name. When that happens, the task's prompt can name the file explicitly to force inclusion (extend `rank_candidate_files` to accept an explicit path list — small change, not yet wired to the CLI).
- **Mobile has no test safety net.** The gate cannot catch mobile regressions beyond typecheck/lint until `mobile/` has real Jest tests. Treat mobile-specialist output with more manual scrutiny than website output until that gap closes.
- **`--n-cpu-moe` value is a starting guess**, not measured on your actual box. Tune it against real `nvidia-smi` output before trusting throughput numbers.
- **This will still occasionally be wrong.** No local model at this size, no gate design, eliminates that. What this system gives you is: wrong output never merges without a human seeing a red gate first, and every change lives in a disposable, isolated worktree until you say otherwise.
