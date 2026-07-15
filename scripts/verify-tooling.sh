#!/usr/bin/env bash
set -e

ERRORS=0

check() {
  local label="$1"; local cmd="$2"; local fix="$3"
  if eval "$cmd" &>/dev/null 2>&1; then
    echo "✓ $label"
  else
    echo "✗ $label — $fix"
    ERRORS=$((ERRORS + 1))
  fi
}

echo "Verifying project tooling..."
echo ""

# pnpm
if command -v pnpm &>/dev/null; then
  echo "✓ pnpm $(pnpm --version)"
else
  echo "✗ pnpm not installed — run: npm i -g pnpm"
  ERRORS=$((ERRORS + 1))
fi

# Node
if command -v node &>/dev/null; then
  echo "✓ node $(node --version)"
else
  echo "✗ node not installed"
  ERRORS=$((ERRORS + 1))
fi

# EAS CLI
check "eas-cli" "command -v eas" "run: pnpm i -g eas-cli"

# Supabase CLI
if command -v supabase &>/dev/null; then
  if supabase projects list &>/dev/null 2>&1; then
    echo "✓ Supabase CLI authenticated"
  else
    echo "✗ Supabase CLI not authenticated — run: supabase login"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "✗ Supabase CLI not installed — run: brew install supabase/tap/supabase"
  ERRORS=$((ERRORS + 1))
fi

# GitHub CLI (optional)
if command -v gh &>/dev/null; then
  if gh auth status &>/dev/null 2>&1; then
    echo "✓ GitHub CLI authenticated"
  else
    echo "⚠ GitHub CLI installed but not authenticated — run: gh auth login"
  fi
else
  echo "⚠ GitHub CLI not installed (optional) — brew install gh"
fi

# direnv (optional)
if command -v direnv &>/dev/null; then
  echo "✓ direnv $(direnv version)"
else
  echo "⚠ direnv not installed (optional) — brew install direnv"
fi

# .env files
echo ""
echo "Checking environment files..."
for f in .env.development .env.production .envrc; do
  if [[ -f "$f" ]]; then
    echo "✓ $f"
  else
    echo "⚠ $f missing — copy from ${f}.example"
  fi
done

echo ""
if [[ $ERRORS -eq 0 ]]; then
  echo "All required tools OK."
else
  echo "$ERRORS required tool(s) missing — fix above before building."
  exit 1
fi
