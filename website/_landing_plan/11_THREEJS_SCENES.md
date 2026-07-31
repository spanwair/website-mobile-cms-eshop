# 11 — Three.js Scenes (vanilla, no React)

## The creative brief (from the founder)

The signature hero visual is a stylized **fulfillment hub**: a glowing, gently
"bubbling" core in the center — like the beating heart of one big shared factory —
with small delivery vehicles arriving from the edges carrying packages, and product
icons orbiting outward, representing every individual seller's store plugged into one
platform. This is deliberately the visual identity of the whole page — distinctive,
animated, and cheap to keep evolving since nothing is a licensed photo or static asset.

## Performance & accessibility budget (applies to every scene below)

- Cap `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))` — never render
  at full 3x retina resolution, it's wasted GPU for a background element.
- Respect `prefers-reduced-motion: reduce` — render exactly one static frame and stop
  the animation loop entirely. Never force motion on a user who's opted out.
- Pause the render loop (via `IntersectionObserver` + `document.visibilitychange`)
  whenever the canvas isn't visible — no wasted frames scrolled off-screen or on a
  backgrounded tab.
- Mobile (`matchMedia("(max-width: 640px)")`): halve object counts. Never fully hide
  the scene — it's core to the brand, just cheaper on small screens.
- Dispose geometries/materials on `astro:before-swap` if Astro view transitions are
  ever enabled later; not needed today since this site doesn't use them, but the
  `dispose()` return value from `createBaseScene` exists for that reason — call it if
  you add view transitions.

## `sceneUtils.ts` — shared scene bootstrap

📁 `website/src/components/landing/three/sceneUtils.ts`

```ts
import * as THREE from "three";

export interface BaseScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  reducedMotion: boolean;
  isMobile: boolean;
  start: (tick: (elapsed: number) => void) => void;
  dispose: () => void;
}

export function createBaseScene(canvas: HTMLCanvasElement): BaseScene {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 640px)").matches;

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  let frameId = 0;
  let visible = true;
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.05 });
  io.observe(canvas);

  const clock = new THREE.Clock();

  function start(tick: (elapsed: number) => void) {
    if (reducedMotion) {
      tick(0);
      renderer.render(scene, camera);
      return;
    }
    function loop() {
      frameId = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      tick(clock.getElapsedTime());
      renderer.render(scene, camera);
    }
    loop();
  }

  function dispose() {
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    io.disconnect();
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.dispose());
      }
    });
    renderer.dispose();
  }

  return { scene, camera, renderer, reducedMotion, isMobile, start, dispose };
}
```

## `fulfillmentScene.ts` — the hero scene

📁 `website/src/components/landing/three/fulfillmentScene.ts`

```ts
import * as THREE from "three";
import { createBaseScene } from "./sceneUtils";

const ACCENT = 0x4f46e5;
const SUCCESS = 0x10b981;

function buildCore(): THREE.Group {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.1, 2),
    new THREE.MeshStandardMaterial({ color: ACCENT, emissive: ACCENT, emissiveIntensity: 0.5, roughness: 0.3 }),
  );
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.6, 1),
    new THREE.MeshBasicMaterial({ color: ACCENT, wireframe: true, transparent: true, opacity: 0.25 }),
  );
  group.add(core, shell);
  group.userData = { core, shell };
  return group;
}

function buildOrbiters(count: number): THREE.Group {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const radius = 2.6 + Math.random() * 1.8;
    const size = 0.12 + Math.random() * 0.1;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshStandardMaterial({ color: i % 3 === 0 ? SUCCESS : 0xffffff, roughness: 0.5 }),
    );
    mesh.userData = {
      radius,
      speed: 0.15 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      tilt: (Math.random() - 0.5) * 1.2,
      bob: Math.random() * Math.PI * 2,
    };
    group.add(mesh);
  }
  return group;
}

function buildVans(count: number): THREE.Group {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.14, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 }),
    );
    mesh.userData = { t: Math.random(), speed: 0.08 + Math.random() * 0.06, angle: Math.random() * Math.PI * 2 };
    group.add(mesh);
  }
  return group;
}

export function mountFulfillmentScene(canvas: HTMLCanvasElement) {
  const base = createBaseScene(canvas);
  const { scene, isMobile, reducedMotion } = base;

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const point = new THREE.PointLight(ACCENT, 2, 20);
  point.position.set(0, 0, 3);
  scene.add(point);

  const core = buildCore();
  const orbiterCount = isMobile ? 12 : 24;
  const vanCount = isMobile ? 4 : 8;
  const orbiters = buildOrbiters(orbiterCount);
  const vans = buildVans(vanCount);
  scene.add(core, orbiters, vans);

  base.start((elapsed) => {
    const { core: coreMesh, shell } = core.userData as { core: THREE.Mesh; shell: THREE.Mesh };
    const pulse = 1 + Math.sin(elapsed * 1.6) * 0.06;
    coreMesh.scale.setScalar(pulse);
    shell.rotation.y = elapsed * 0.15;
    shell.rotation.x = elapsed * 0.08;

    orbiters.children.forEach((mesh) => {
      const { radius, speed, phase, tilt, bob } = mesh.userData;
      const a = elapsed * speed + phase;
      mesh.position.set(Math.cos(a) * radius, Math.sin(a * 0.7 + bob) * 0.4 + tilt, Math.sin(a) * radius);
      mesh.rotation.set(a, a * 0.5, 0);
    });

    vans.children.forEach((mesh) => {
      const data = mesh.userData as { t: number; speed: number; angle: number };
      data.t = (data.t + speed_factor(reducedMotion) * data.speed * 0.01) % 1;
      const edgeRadius = 6;
      const startX = Math.cos(data.angle) * edgeRadius;
      const startZ = Math.sin(data.angle) * edgeRadius;
      const inbound = data.t < 0.5;
      const progress = inbound ? data.t * 2 : (1 - data.t) * 2;
      mesh.position.set(startX * progress, 0, startZ * progress);
      mesh.lookAt(0, 0, 0);
    });
  });
}

function speed_factor(reducedMotion: boolean) {
  return reducedMotion ? 0 : 1;
}
```

`reducedMotion` is already handled at the `createBaseScene.start` level (a
`prefers-reduced-motion` user never enters the loop at all), so `speed_factor` here is
belt-and-suspenders only for the rare case this function gets reused outside `start`
— keep it, it's one line.

## `aiScene.ts` — lighter reusable accent scene

Used by both `TemplatesShowcase.astro` and `AICapabilities.astro`
(`08_TEMPLATES_AND_AI_SHOWCASE.md`), parameterized by accent color so the two
sections don't look identical.

📁 `website/src/components/landing/three/aiScene.ts`

```ts
import * as THREE from "three";
import { createBaseScene } from "./sceneUtils";

export function mountAccentScene(canvas: HTMLCanvasElement, opts: { accent: number }) {
  const base = createBaseScene(canvas);
  const { scene, camera } = base;
  camera.position.set(0, 0, 5);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const light = new THREE.PointLight(opts.accent, 2, 15);
  light.position.set(2, 2, 4);
  scene.add(light);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.3, 1),
    new THREE.MeshStandardMaterial({ color: opts.accent, emissive: opts.accent, emissiveIntensity: 0.3, roughness: 0.4, wireframe: false }),
  );
  scene.add(core);

  const satellites: THREE.Mesh[] = [];
  for (let i = 0; i < (base.isMobile ? 4 : 8); i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
    );
    mesh.userData = { radius: 2 + Math.random(), speed: 0.2 + Math.random() * 0.3, phase: Math.random() * Math.PI * 2 };
    satellites.push(mesh);
    scene.add(mesh);
  }

  base.start((elapsed) => {
    core.rotation.y = elapsed * 0.25;
    core.rotation.x = elapsed * 0.1;
    satellites.forEach((mesh) => {
      const { radius, speed, phase } = mesh.userData;
      const a = elapsed * speed + phase;
      mesh.position.set(Math.cos(a) * radius, Math.sin(a * 1.3) * 0.6, Math.sin(a) * radius);
    });
  });
}
```

## Wiring reminder

`Hero.astro` (`06`) imports `mountFulfillmentScene` — replace any temporary stub with
the real import once this file is implemented. `TemplatesShowcase.astro` and
`AICapabilities.astro` (`08`) both import `mountAccentScene` with different `accent`
values (`0x4f46e5` indigo, `0x10b981` green) — that's the entire visual differentiation
between those two sections' canvases.
