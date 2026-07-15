#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# ── Arguments ────────────────────────────────────────────
BUILD_TYPE="apk"   # apk (default) or aab (Play Store)
SKIP_DEPLOY=false
for arg in "$@"; do
  case "$arg" in
    --aab)          BUILD_TYPE="aab" ;;
    --skip-deploy)  SKIP_DEPLOY=true ;;
  esac
done

# ── Guards ───────────────────────────────────────────────
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "main" ]]; then
  echo "Error: production build requires main branch (you are on '$BRANCH')" >&2
  exit 1
fi

ENV_FILE=".env.production"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found — copy .env.production.example first" >&2
  exit 1
fi

export APP_ENV=production
set -a; source "$ENV_FILE"; set +a

# ── Signing vars ─────────────────────────────────────────
: "${KEYSTORE_PASSWORD:?KEYSTORE_PASSWORD not set in $ENV_FILE}"
: "${KEY_ALIAS:?KEY_ALIAS not set in $ENV_FILE}"
: "${KEY_PASSWORD:?KEY_PASSWORD not set in $ENV_FILE}"

if [[ "$BUILD_TYPE" == "aab" ]]; then
  : "${KEYSTORE_FILE:?KEYSTORE_FILE not set in $ENV_FILE}"
  [[ -f "$KEYSTORE_FILE" ]] || { echo "Error: keystore file not found: $KEYSTORE_FILE" >&2; exit 1; }
fi

# ── Deploy DB + Functions (unless skipped) ───────────────
if [[ "$SKIP_DEPLOY" == "false" ]]; then
  echo "→ Deploying DB migrations to production..."
  ./scripts/db-push.sh production
  echo "✓ DB migrations deployed"

  echo "→ Deploying Edge Functions to production..."
  ./scripts/functions-deploy.sh production
  echo "✓ Edge Functions deployed"
fi

# ── Restore on exit ──────────────────────────────────────
STRINGS_XML="mobile/android/app/src/main/res/values/strings.xml"
cleanup() {
  # Restore dev app name on exit (success or failure)
  if [[ -f "$STRINGS_XML" ]]; then
    APP_NAME=$(grep -oP '(?<=<string name="app_name">)[^<]+' "$STRINGS_XML" 2>/dev/null || true)
    [[ -n "$APP_NAME" ]] && sed -i "s|<string name=\"app_name\">.*</string>|<string name=\"app_name\">Template Dev</string>|" "$STRINGS_XML"
  fi
}
trap cleanup EXIT

# ── Set production app name ──────────────────────────────
if [[ -f "$STRINGS_XML" ]]; then
  PROD_APP_NAME="${EXPO_PUBLIC_APP_NAME:-Template}"
  sed -i "s|<string name=\"app_name\">.*</string>|<string name=\"app_name\">${PROD_APP_NAME}</string>|" "$STRINGS_XML"
  echo "→ Set app_name to ${PROD_APP_NAME}"
fi

# ── Auto-increment versionCode for AAB ───────────────────
if [[ "$BUILD_TYPE" == "aab" ]]; then
  BUILD_GRADLE="mobile/android/app/build.gradle"
  if [[ -f "$BUILD_GRADLE" ]]; then
    CURRENT_VC=$(grep -E '^\s+versionCode [0-9]+' "$BUILD_GRADLE" | grep -oE '[0-9]+')
    NEW_VC=$((CURRENT_VC + 1))
    sed -i -E "s/(versionCode )${CURRENT_VC}/\1${NEW_VC}/" "$BUILD_GRADLE"
    echo "→ Bumped versionCode: ${CURRENT_VC} → ${NEW_VC}"
  fi
fi

# ── Build ─────────────────────────────────────────────────
cd mobile/android
if [[ "$BUILD_TYPE" == "aab" ]]; then
  APP_ENV=production ./gradlew app:bundleRelease
  echo "✓ AAB: mobile/android/app/build/outputs/bundle/release/app-release.aab"
else
  APP_ENV=production ./gradlew app:assembleRelease
  echo "✓ APK: mobile/android/app/build/outputs/apk/release/"
fi
