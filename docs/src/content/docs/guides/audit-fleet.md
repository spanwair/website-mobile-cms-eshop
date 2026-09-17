---
title: Audit Fleet
description: How the quiet autonomous audit fleet works
---

The fleet iterates over every admin slice, checking code, docs, and tutorial in the same pass.

## Running

```bash
./scripts/audit/fleet.sh products --dry-run
./scripts/audit/scan-rls.sh
./scripts/audit/scan-permissions.sh
node ./scripts/audit/report.mjs
```

## Adding a new slice

1. Add row to docs/superpowers/specs/quiet-audit-fleet-spec.md
2. Add findings JSON path to scripts/audit/report.mjs if needed
3. Run pilot per Task 3 pattern

## Quiet decisions

P2 auto-lands as draft PR per worktree. P1/P0 writes RFC to _project_specs/todos/fleet-backlog.md.
