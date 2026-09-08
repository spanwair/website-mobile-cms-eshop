#!/usr/bin/env bash
# Storage-safe replacement for `supabase db reset`.
#
# `supabase db reset` truncates the storage.objects table, which makes every uploaded image /
# video / label return 400 even though the blobs still live on the storage volume. Always use
# THIS wrapper instead of a bare `supabase db reset` for local dev: it resets the DB, then
# immediately re-registers the storage objects from the volume so nothing is ever lost.
#
# Never call `supabase db reset` directly for this project.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "reset-db-safe: resetting local database..."
npx --yes supabase db reset "$@"

echo "reset-db-safe: re-registering storage objects..."
bash "${HERE}/restore-local-storage.sh"

echo "reset-db-safe: done."
