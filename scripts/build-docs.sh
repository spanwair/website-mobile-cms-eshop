#!/usr/bin/env bash
# Build the Starlight docs (configured with base=/docs) and publish the static output into the
# website's assets at website/public/docs, so the Cloudflare Workers site serves the docs under
# /docs on the same domain. Run automatically by `website` build/deploy; safe to run on its own.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/website/public/docs"

cd "$ROOT/docs"
pnpm build

rm -rf "$DEST"
mkdir -p "$DEST"
cp -r dist/. "$DEST/"

pages="$(find "$DEST" -name '*.html' | wc -l | tr -d ' ')"
echo "Docs published to website/public/docs (${pages} HTML pages)."
