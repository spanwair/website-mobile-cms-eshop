# Docs translation pipeline (EN -> CS)

The Starlight docs are bilingual:

- **Czech = root locale** (default) -> `src/content/docs/**` -> served at `/docs/...`
- **English = `en` locale** -> `src/content/docs/en/**` -> served at `/docs/en/...`

English is the **source of truth**; Czech pages are machine-translated from the English files.

## How translations are produced

A local LLM (Gemma, llama.cpp OpenAI-compatible server) does the translation.
This project only orchestrates it - it never translates by hand.

```bash
# translate every English file that has no Czech counterpart yet (resumable)
./scripts/translate-docs-all.sh

# translate a single file
./scripts/translate-docs.py src/content/docs/en/admin/orders.md src/content/docs/admin/orders.md
```

Server endpoint and model are set at the top of `translate-docs.py`
(`SERVER`, `MODEL`). Single inference slot -> ~75s per file, sequential.

## Rules the prompt enforces

- Preserves Markdown/MDX structure, tables, code, URLs, frontmatter keys, JSX, ALL_CAPS constants.
- Translates only prose, headings, table-cell text, link display text, and frontmatter values.
- A glossary pins Czech technical terms (the small model garbles them otherwise).

## Link gotcha (important)

Absolute cross-links must match their locale:

- Czech (root) files link to `/docs/...`
- English (`en/`) files link to `/docs/en/...`

When re-translating, English files already carry `/docs/en/` links, so the Czech
output inherits them. After translating, rewrite `/docs/en/` -> `/docs/` in the
**root** files only:

```bash
grep -rl "/docs/en/" src/content/docs --include="*.md" --include="*.mdx" --exclude-dir=en \
  | xargs -r sed -i 's#/docs/en/#/docs/#g'
```

## After translating

```bash
pnpm build   # verify i18n + OpenAPI plugin still build cleanly
```
