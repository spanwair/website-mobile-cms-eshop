# Task: Templates Showcase three.js scene — top-down mini crossroad, further polish

## Where

`website/src/components/landing/three/aiScene.ts` (`mountAccentScene`) —
mounted by `website/src/components/landing/sections/TemplatesShowcase.astro`
into the square `#templates-scene`-style card canvas (`showcase-canvas`,
`aspect-ratio: 1`, `background:var(--bg-surface)` on the section), called with
the indigo accent (`0x4f46e5`). This is the **same** `mountAccentScene`
function as the AI Capabilities card — see
`2026-07-29-ai-capabilities-scene-topdown-crossroads.md` for the shared
implementation details. This doc tracks this specific call site.

## Current state (already implemented, 2026-07-29)

Same rebuild as the AI Capabilities card: a compact top-down 2×2 crossroad
grid (`HALF = 1.7`, `STREET_OFFSETS = [-0.75, 0.75]`) replacing the old
rotating factory+trees cluster on a near-black fog. Bright fog/lighting, an
indigo-accented car + point light, cars with headlights/taillights, and
grounded car-scale pedestrians on sidewalks only. Confirmed via Playwright
screenshot on the full page render — both this card and the AI Capabilities
card show correctly with no console errors, and the indigo accent reads
distinctly from the AI card's green.

Note this section (`TemplatesShowcase.astro`) uses `showcase-grid--reverse`
(RTL trick to flip the visual/copy order) — the canvas sits on the *left* of
its grid row here vs. the right on the AI Capabilities card. That's a layout
detail only; it doesn't affect the three.js scene itself.

## Ideas for further improvement (not yet done)

1. **Differentiate from the AI Capabilities card.** As noted in the sibling
   doc, both cards are currently pixel-identical aside from accent color.
   Since `TemplatesShowcase` is about templates/design and `AICapabilities` is
   about AI tooling, consider a small visual hook specific to this card — e.g.
   swap one of the tree cells for a second, smaller building (implies "choice
   of templates/layouts") once building variety (see hero doc, item 3) lands.
2. **RTL layout interaction** — double-check the canvas isn't mirrored by the
   `showcase-grid--reverse` CSS `direction: rtl` rule (it resets
   `direction: ltr` on children via `.showcase-grid--reverse > *`, which should
   cover the canvas, but re-verify after any layout CSS changes — a mirrored
   top-down grid would still "look fine" at a glance but would have cars
   driving on the visually wrong side, worth a specific screenshot check).
3. **Same reduced-motion and small-card legibility concerns** as the AI
   Capabilities card — see that doc's items 1 and 4, they apply identically
   here since it's the same code path.

## Why this doc exists

Per request: each of the 3 landing three.js animations gets its own tracked
task doc. This one and the AI Capabilities one point at the same source file
by design — splitting them lets each card's specific copy/layout context and
follow-up ideas be tracked independently even as the underlying scene code
stays shared. See also `2026-07-29-hero-scene-topdown-crossroads.md`.
