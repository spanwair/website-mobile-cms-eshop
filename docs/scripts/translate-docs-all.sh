#!/usr/bin/env bash
set -u
DOCS="$(cd "$(dirname "$0")/../src/content/docs" && pwd)"
SC="$(dirname "$0")/translate-docs.py"
cd "$DOCS/en" || exit 1
mapfile -t files < <(find . \( -name "*.md" -o -name "*.mdx" \) | sed 's#^\./##' | sort)
total=${#files[@]}
i=0
for rel in "${files[@]}"; do
  i=$((i+1))
  dest="$DOCS/$rel"
  if [ -f "$dest" ]; then
    echo "[$i/$total] SKIP (exists) $rel"
    continue
  fi
  echo "[$i/$total] translating $rel ..."
  if python3 "$SC" "$DOCS/en/$rel" "$dest"; then
    echo "[$i/$total] DONE $rel"
  else
    echo "[$i/$total] FAILED $rel" >&2
  fi
done
echo "ALL_TRANSLATIONS_COMPLETE ($total files)"
