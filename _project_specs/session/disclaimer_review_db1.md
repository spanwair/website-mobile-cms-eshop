# Disclaimer Review — DB-001..004
**Reviewer:** Disclaimer Agent
**Date:** 2026-07-15
**Scope:** supabase/migrations/20260102000001_parties_rbac.sql through 20260102000004_notifications.sql

---

## DB-001 — parties_rbac.sql (153 lines)

| Check | Result |
|-------|--------|
| Lines ≤ 200 | PASS (153) |
| All PKs: UUID + gen_random_uuid() | PASS |
| All timestamps: TIMESTAMPTZ | PASS |
| RLS enabled on all new tables | PASS — parties, roles, user_party_roles |
| Bitmask permissions: BIGINT column | PASS — roles.permissions BIGINT NOT NULL DEFAULT 0 |
| BIT_OR aggregate in get_user_permissions | PASS |
| Bitwise-AND check in user_has_permission | PASS |
| SECURITY DEFINER functions pin search_path | PASS — all 3 functions SET search_path = public |
| No hardcoded credentials | PASS |
| party_id FK on all tenant-scoped tables | PASS — roles and user_party_roles both reference parties |
| No fallback mechanisms | PASS |
| Comments only on non-obvious WHY | PASS — bitmask constant block is the API contract; trigger comments explain intentional permission split |

**Verdict: PASS**

Notes:
- Permission constant block (lines 1–17) is borderline but justified: these are public API values that application code must match. Without them the migration is a black box.
- `create_party_super_admin_role` trigger seeds 32767 (bits 0–14); comment correctly explains FULL_ACCESS (32768) is intentionally excluded.
- RLS policy split on user_party_roles (read-own vs admin-read-all) is correctly separated into two SELECT policies.

---

## DB-002 — profiles_extend.sql (71 lines)

| Check | Result |
|-------|--------|
| Lines ≤ 200 | PASS (71) |
| All timestamps: TIMESTAMPTZ | PASS — last_login_at TIMESTAMPTZ |
| RLS on new tables | N/A — no new tables, only ALTER TABLE on existing profiles |
| COALESCE pattern: never overwrites user values | PASS — ON CONFLICT DO UPDATE uses COALESCE(profiles.col, EXCLUDED.col) on all 5 fields |
| NULLIF strips empty OAuth strings | PASS — NULLIF(TRIM(...), '') applied to full_name, display_name, avatar_url, email |
| Google ID captured from provider sub | PASS — conditional on raw_app_meta_data->>'provider' = 'google' |
| SECURITY DEFINER + search_path | PASS |
| No hardcoded credentials | PASS |
| No fallback mechanisms | PASS — enum guard is idempotency, not a fallback |
| Comments only on non-obvious WHY | PASS — COALESCE/NULLIF strategy comment is essential for maintainers |

**Verdict: PASS**

Notes:
- The `DO $$ ... $$` block for adding `eshop_admin` to `app_role` uses a pg_enum catalog guard. This is idempotent migration hygiene, not a fallback mechanism.
- `display_name` defaults to `full_name` if display_name metadata is absent (`COALESCE(v_display_name, v_full_name)`) — correct bootstrap behavior.

---

## DB-003 — audit_logs.sql (75 lines)

| Check | Result |
|-------|--------|
| Lines ≤ 200 | PASS (75) |
| UUID PK + gen_random_uuid() | PASS |
| All timestamps: TIMESTAMPTZ | PASS — created_at TIMESTAMPTZ |
| RLS enabled | PASS |
| Required fields: action, table_name, record_id, party_id, user_id, ip_address, device_info, old_value, new_value | PASS — all 9 required fields present with correct types |
| SECURITY DEFINER + search_path | PASS |
| No hardcoded credentials | PASS |
| No UPDATE/DELETE policies (append-only) | PASS — only SELECT and INSERT policies exist |
| SECURITY DEFINER blocks direct inserts | PASS — INSERT RLS policy `WITH CHECK (false)` |
| No fallback mechanisms | BORDERLINE — see note |

**Verdict: PASS with advisory note**

Advisory (not a blocker):
- Lines 60–63: `EXCEPTION WHEN OTHERS THEN v_ip := NULL; v_device := NULL;` silently swallows header-parsing errors. The inline comment says "rather than failing silently" which is misleading — the error IS silent. The pragmatic justification is that losing header metadata must not abort the audit event itself. This is the least-bad tradeoff for an audit function. However, the comment should be clarified: "If request headers are unavailable or malformed, record NULL rather than aborting the audit event."
- This does not violate rule #4 in spirit (rule targets application-level fallbacks that hide business logic failures), but it should be documented as a deliberate choice.

---

## DB-004 — notifications.sql (79 lines)

| Check | Result |
|-------|--------|
| Lines ≤ 200 | PASS (79) |
| Both tables present: notifications + user_notifications | PASS |
| UUID PKs + gen_random_uuid() | PASS |
| All timestamps: TIMESTAMPTZ | PASS — created_at, read_at |
| RLS enabled on both tables | PASS |
| party_id FK on notifications | PASS |
| RLS covers read + write for both tables | PASS — 5 policies covering SELECT/INSERT/UPDATE |
| No SECURITY DEFINER functions | N/A — no functions in this migration |
| No hardcoded credentials | PASS |
| No fallback mechanisms | PASS |
| Comments only on non-obvious WHY | PASS — comments explain permission threshold choices |

**Verdict: PASS**

Notes:
- Partial index `WHERE read_at IS NULL` on user_notifications is a solid optimization for unread-count queries.
- `notification_type` enum is appropriately scoped; adding new types requires a migration (expected for typed enums).
- No DELETE policy on user_notifications means users cannot remove notification records, only mark them read. This is likely intentional (audit trail) but not explicitly documented. Minor — not a blocker.

---

## Summary

| ID | Migration | Lines | Verdict |
|----|-----------|-------|---------|
| DB-001 | parties_rbac.sql | 153 | DONE |
| DB-002 | profiles_extend.sql | 71 | DONE |
| DB-003 | audit_logs.sql | 75 | DONE (advisory) |
| DB-004 | notifications.sql | 79 | DONE |

All four migrations pass the architectural checklist. DB-003 carries one advisory about a misleading comment on the exception handler — not a blocker, but the comment should be corrected before the next review cycle.
