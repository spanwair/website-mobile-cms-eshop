import * as THREE from "three";

export interface BaseScene {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  reducedMotion: boolean;
  isMobile: boolean;
  setViewSize: (halfHeight: number) => void;
  start: (tick: (elapsed: number) => void) => void;
  dispose: () => void;
}

// Orthographic on purpose: paired with a true-isometric camera position
// (equal x/y/z offset) this keeps every side of the grid at the same scale —
// no perspective foreshortening — instead of things shrinking toward the
// horizon like a bird's-eye photo would.
export function createBaseScene(canvas: HTMLCanvasElement): BaseScene {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.set(7, 7, 7);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 640px)").matches;

  let viewSize = 6;
  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.left = -viewSize * aspect;
    camera.right = viewSize * aspect;
    camera.top = viewSize;
    camera.bottom = -viewSize;
    camera.updateProjectionMatrix();
  }
  function setViewSize(halfHeight: number) {
    viewSize = halfHeight;
    resize();
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

  return { scene, camera, renderer, reducedMotion, isMobile, setViewSize, start, dispose };
}
