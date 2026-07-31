# Task: Hero three.js scene — top-down crossroad city, further polish

## Where

`website/src/components/landing/three/fulfillmentScene.ts` — mounted by
`website/src/components/landing/sections/Hero.astro` into the full-bleed
`#hero-scene` canvas behind the hero headline. Shares actors/helpers with the two
other landing animations:
- `website/src/components/landing/three/actors/{person,car,props}.ts`
- `website/src/components/landing/three/cityGrid.ts` (road/sidewalk grid + lane math)
- `website/src/components/landing/three/sceneUtils.ts` (renderer/tone-mapping base)

## Current state (already implemented, 2026-07-29)

This scene was rebuilt from a single circular road loop with a 3/4-angle camera
into a top-down city block:

- Camera is near-overhead (`position (0, 11.5, 1.6)`, `lookAt(0,0,0)`) — a real
  bird's-eye angle, not the old ~36°-elevation 3/4 view.
- `buildCityGrid({ half: 4.4, streetOffsets: [-2.2, 2.2] })` lays down a real
  street grid — 2 streets per axis crossing at 4 intersections — with bordered
  sidewalks, dashed centerlines, and zebra crosswalks at every intersection,
  instead of one ellipse ring.
- Cars and pedestrians move along straight lane segments returned by the grid
  (`grid.carLanes` / `grid.walkLanes`) via `laneSample()` (eased ping-pong), so
  traffic on crossing lanes visually reads as real intersections.
- Pedestrians only ever sit on `walkLanes` (sidewalk-offset segments) — they no
  longer share the road surface with cars.
- `buildPerson` fixed a bug where the whole figure group was offset to
  `y = 0.4` while the legs were modeled with their feet at local `y = 0.19` —
  pedestrians were floating ~0.59 units above the ground. Feet are now built at
  exactly `y = 0` and the figure is scaled about that origin (`PERSON_SCALE =
  0.58` in `actors/person.ts`), so people stay grounded at any scale and are
  sized to match car height instead of towering over the cars.
- `buildCar` (`actors/car.ts`) gained emissive headlight/taillight blocks and a
  brighter, more saturated color palette (no more near-black gray).
- Fog/lighting moved from a near-black `0x111827` fog + dim hemisphere to a
  bright light-blue fog (`0xdcefff`) and stronger hemisphere/sun intensities.
- `sceneUtils.createBaseScene` now sets ACES Filmic tone mapping, sRGB output,
  and a soft PCF shadow map — factory, cars, and trees cast/receive shadows.

Verified visually with a Playwright screenshot at 1400×1400 and at a 390×844
mobile viewport — grid, crosswalks, car lights, and grounded pedestrians all
render correctly with zero console errors.

## Ideas for further improvement (not yet done — pick these up next)

1. **Traffic shouldn't clip through each other at intersections.** Lanes are
   independent ping-pong segments with no timing coordination, so two cars can
   visually overlap at a crossing for a frame or two. A cheap fix: stagger each
   car's `phase` so lanes crossing the same intersection are never at the
   intersection point simultaneously (precompute the two lane progress values
   at which `position` enters the shared intersection box and offset phases to
   avoid overlap), rather than the current fully-random `Math.random() * 2`.
2. **Corner turns.** Right now vehicles reverse in place at the end of a lane
   (eased U-turn) instead of turning onto a cross street. A lane-graph walk
   (pick a new perpendicular lane at the intersection nearest the current end
   point, continue instead of reversing) would look far more like real traffic
   and is the single biggest remaining "fake" tell in this scene.
3. **Building variety.** Only one `buildFactory()` silhouette is used, scaled
   into the center cell. The 8 outer cells only get trees. Adding 2-3 low-poly
   building variants (shop, small office, warehouse) placed in the outer cells
   would sell the "modern city" read much harder than trees alone.
4. **Streetlights / lamp posts** at intersection corners, with a small emissive
   sphere on top, would reinforce the "cars have lights" theme at dusk and add
   visual anchors to the grid corners.
5. **Parallax / depth on scroll** — since the camera is now steep top-down,
   consider a very small camera-height parallax tied to scroll position
   (a few % of `half`) so the hero doesn't feel static once users start
   scrolling past it.
6. **Mobile perf pass** — `isMobile` currently only trims car/tree counts
   (4 cars / 4 people vs 8/8). Re-profile on a real low-end Android device;
   shadow maps are the most likely first thing to disable under `isMobile`.

## Why this doc exists

Per request: each of the 3 landing three.js animations gets its own tracked
task doc describing what changed and what to improve next, even though they
share the `actors/` and `cityGrid.ts` modules. See the sibling docs:
`2026-07-29-ai-capabilities-scene-topdown-crossroads.md` and
`2026-07-29-templates-showcase-scene-topdown-crossroads.md`.
