// Platform limits shared by website + mobile. Keep in sync with any DB-level enforcement
// (SQL can't import this file), e.g. the enforce_pending_org_product_cap trigger.

// A not-yet-live organization (status other than 'active') may hold at most this many
// products until an owner approves it and it goes live. Mirrored by the DB trigger
// enforce_pending_org_product_cap (migration 20260103000181_pending_org_product_cap.sql).
export const PENDING_ORG_PRODUCT_CAP = 100;
