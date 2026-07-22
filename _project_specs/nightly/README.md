# Nightly Autonomous Agent System

## Overview

This directory contains the **Nightly Autonomous Agent** system - a fully autonomous AI agent that evolves your codebase while you sleep (22:00-08:00).

## How It Works

```
22:00 ─► Agent starts
  │
  ├─► Discovers opportunities (tests, bugs, todos, roadmap)
  ├─► Prioritizes by impact/effort/time
  ├─► Creates isolated treehouse workspace for each task
  ├─► Implements → validates → documents
  ├─► Logs everything to progress files
  ├─► Accumulates knowledge in expertise files
  │
08:00 ─► Generates morning report & stops
```

## Key Features

✅ **Fully Autonomous** - Discovers, prioritizes, and implements without human input
✅ **Safe** - Never commits or pushes, uses isolated workspaces
✅ **Treehouse Integration** - Each task gets its own git worktree
✅ **Morning Review** - You review and approve workspaces each morning
✅ **Expertise Accumulation** - Learns patterns and builds knowledge base
✅ **Comprehensive Logging** - Every decision documented

## Directory Structure

```
_project_specs/nightly/
├── {YYYYMMDD}-progress.md      # Detailed session log
├── {YYYYMMDD}-report.md        # Morning summary report
├── active-workspaces.txt       # List of workspace paths
├── feedback.md                 # Your feedback to the agent
├── expertise/                  # Domain knowledge accumulation
│   ├── stripe-integration.md
│   ├── email-automation.md
│   ├── mobile-development.md
│   ├── supabase-patterns.md
│   ├── testing-strategies.md
│   └── admin-permissions.md
├── test-workspaces/            # Simulated workspaces (for testing)
└── archive/                    # Completed sessions
    └── {YYYYMMDD}/
```

## Agent Definition

**Location:** `.claude/agents/nightly-autonomous-agent.md`

**Tools:** read_file, write_file, patch, search_files, terminal, skill_view, skill_manage, session_search, memory, delegate_task, browser_navigate, cronjob, computer_use

**Operational Hours:** 22:00-08:00 only (hard constraint)

## Morning Routine

1. **Read the report:** `_project_specs/nightly/{date}-report.md`
2. **Review workspaces:** Listed by priority (High/Med/Low)
3. **Decide on each:**
   - ✅ Merge validated changes
   - ❌ Discard failed experiments
   - ⚠️ Request revisions
4. **Provide feedback:** Write to `feedback.md` for next night
5. **Release workspaces:** `treehouse return {path}` for reviewed items

## Expertise Files

The agent accumulates domain knowledge in `expertise/*.md` files:

- **Patterns That Work** - Successful approaches
- **Pitfalls to Avoid** - Known gotchas
- **Common Solutions** - Reusable fixes
- **Decision Log** - Architectural choices
- **Examples** - Real code snippets

These files grow over time, making the agent smarter each night.

## Test Mode

Run a test without waiting for 22:00:

```bash
./scripts/test-nightly-agent.sh
```

This bypasses the time check and runs a single iteration to validate the infrastructure.

## Setup Requirements

### Required
- Working directory: `/home/jan/PROJECTS/react-native/website-mobile-template`
- Claude Code agent runtime
- Bash shell

### Recommended
- **Treehouse** installed for true isolated workspaces:
  ```bash
  curl -fsSL https://kunchenguid.github.io/treehouse/install.sh | sh
  ```

Without treehouse, the agent will simulate workspaces in `test-workspaces/`.

## Safety Guarantees

The agent **NEVER**:
- Commits to git
- Pushes to remote
- Deletes main branch
- Uses service_role key
- Works outside 22:00-08:00
- Breaks multi-tenancy (always filters by party_id)

The agent **ALWAYS**:
- Works in isolated workspaces
- Validates before declaring success (E2E, typecheck, build, lint)
- Logs everything
- Documents learnings
- Leaves workspaces for human review

## Feedback Loop

Provide feedback in `feedback.md`:

```markdown
## {YYYY-MM-DD}

**Workspace:** `{path}`
**Decision:** ✅ Merged / ❌ Discarded / ⚠️ Needs revision

**Comments:**
Great work on fixing the test! The approach was clean.

**Learnings for Agent:**
- Remember to update i18n when adding UI strings
- Consider edge cases in validation
```

The agent reads this at the start of each session and incorporates feedback.

## Metrics & Evolution

Each session tracks:
- Iterations completed
- Success rate
- Files modified
- Tests added
- Bugs fixed
- Features added
- Knowledge accumulated

The agent uses these metrics to improve its prioritization and approach over time.

## Integration with Other Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| `nightly-autonomous-agent` | Autonomous overnight evolution | 22:00-08:00 automatic |
| `stripe-integration-specialist` | Stripe payment expert | Manual invocation for Stripe work |
| `project-leader` | Task coordination | Manual invocation for planning |
| Other specialists | Domain expertise | Manual invocation as needed |

The nightly agent **complements** specialist agents - it handles routine improvements and bug fixes overnight, while you invoke specialists for complex domain-specific work.

## Getting Started

1. **Test the system:**
   ```bash
   ./scripts/test-nightly-agent.sh
   ```

2. **Review test results:**
   ```bash
   cat _project_specs/nightly/$(date +%Y%m%d)-report.md
   ```

3. **Provide feedback:**
   ```bash
   vim _project_specs/nightly/feedback.md
   ```

4. **Let it run tonight:**
   The agent will activate at 22:00 automatically

5. **Review tomorrow morning:**
   Check the report and workspace candidates

## Troubleshooting

**Agent didn't run:**
- Check operational hours (22:00-08:00 only)
- Verify Claude Code agent runtime is available

**No workspaces created:**
- Install treehouse for real isolation
- Check `active-workspaces.txt` for simulated workspaces

**Morning report missing:**
- Check `_project_specs/nightly/{date}-report.md`
- Review `{date}-progress.md` for session details

**Need to stop early:**
- Agent automatically stops at 08:00
- If testing, Ctrl+C the test script

## Future Enhancements

Potential improvements:
- [ ] Integration with GitHub Issues/PRs
- [ ] Slack/Discord notifications for morning report
- [ ] Web dashboard for progress visualization
- [ ] Multi-agent parallel workstreams
- [ ] ML-based priority scoring
- [ ] Automatic workspace merging for low-risk changes

---

**Created:** 2026-07-22
**Version:** 1.0
**Status:** ✅ Tested and ready for deployment
