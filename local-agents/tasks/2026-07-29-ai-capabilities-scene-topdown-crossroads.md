# Task: AI Capabilities three.js scene — top-down mini crossroad, further polish

## Where

`website/src/components/landing/three/aiScene.ts` (`mountAccentScene`) —
mounted by `website/src/components/landing/sections/AICapabilities.astro` into
the square `#ai-scene` card canvas (`aspect-ratio: 1`, called with
`{ accent: 0x10b981 }`, green). `mountAccentScene` is shared verbatim with the
Templates Showcase card (`aiScene.ts` is used from two section files) — see
the sibling doc `2026-07-29-templates-showcase-scene-topdown-crossroads.md`
for that call site's specifics.

## Current state (already implemented, 2026-07-29)

Previously this canvas showed a small rotating cluster (one factory + two
trees, no roads, no cars, no people) on a near-black fog (`0x111827`) — which
read as a dark box floating on this section's light page background (section
has no `landing--dark` class, unlike the hero).

Rebuilt as a compact top-down crossroad, consistent with the hero and the
templates-showcase card:

- `HALF = 1.7`, `STREET_OFFSETS = [-0.75, 0.75]` → a 2×2 street grid (4
  intersections) sized for a small square card, via the shared
  `buildCityGrid()` (`three/cityGrid.ts`) — same grid/lane/crosswalk logic as
  the hero, just smaller (`roadWidth: 0.32`, `walkWidth: 0.14`).
- Camera moved to a steep top-down angle: `position (0, 4.4, 0.6)`,
  `lookAt(0,0,0)`.
- Bright fog (`0xeaf6ff`) and lighting instead of the old dark fog; the
  `accent` color is now applied narrowly — one `PointLight` plus a recolor of
  exactly one car's body material (`car.group.traverse(...)` matching only the
  metalness>0 body/cabin material) — so each card keeps its brand color as a
  highlight rather than as the dominant dark tone.
- 3 cars (bright palette + lights from `actors/car.ts`) and 3 pedestrians
  (grounded, car-scaled, from `actors/person.ts`) loop the mini grid.
- Verified with a Playwright screenshot — factory in the center cell, trees in
  the 3 outer cells, one green-accented car, pedestrians on sidewalks, no
  console errors.

## Ideas for further improvement (not yet done)

1. **This card is the tightest space of the three scenes** (`HALF = 1.7`) —
   at small render sizes on a phone the zebra-crossing stripes and dashed
   centerlines may be too fine to read. Worth testing on an actual 360px-wide
   card render and, if muddy, either drop the crosswalk stripes for this scene
   only or bump `roadWidth`/reduce `streetOffsets` to a single intersection
   (`[0]`, one crossroad) for this size class specifically.
2. **Accent color is currently only on the car + point light.** Consider also
   tinting the factory's window-glow emissive (`buildFactory`'s `windowMat`)
   per-instance so the brand color reads even when the accent car is
   momentarily out of frame/occluded by a tree.
3. **Static per-card variety** — right now this card and the templates-showcase
   card run the exact same layout/counts, differing only in `accent`. Since
   they sit on the same page, consider varying `STREET_OFFSETS` or car/people
   counts slightly between the two call sites so a user scrolling past both
   doesn't see two identical dioramas back to back.
4. **Reduced-motion / paused state** — `sceneUtils` already renders a single
   static frame under `prefers-reduced-motion`; double check that static frame
   still looks intentional for this scene (cars/people mid-stride look odd
   frozen — consider forcing `elapsed = 0` exactly, i.e. lane start position,
   for the reduced-motion static render instead of whatever `tick(0)` produces
   from default phases).

## Why this doc exists

Per request: each of the 3 landing three.js animations gets its own tracked
task doc, even though two of them (`AICapabilities` and `TemplatesShowcase`)
mount the same `mountAccentScene` function — because the card contexts,
accent colors, and surrounding page copy differ enough to warrant separate
tracking. See also `2026-07-29-hero-scene-topdown-crossroads.md`.
