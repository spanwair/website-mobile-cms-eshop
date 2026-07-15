#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f mobile/.env.development ]]; then
  echo "Error: mobile/.env.development not found — copy .env.development.example first" >&2
  exit 1
fi

export APP_ENV=development

echo "→ Building dev APK via EAS (local)..."
cd mobile
rm -rf ~/.gradle/caches/
eas build --profile development --platform android --local --clear-cache

echo "✓ Dev APK ready"
