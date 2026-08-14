import * as THREE from "three";
import { createBaseScene } from "./sceneUtils";
import { buildCar, buildTruck, type Car } from "./actors/car";
import { buildPerson, type Person } from "./actors/person";
import { buildTree, buildGround } from "./actors/props";
import { buildStore } from "./actors/buildings";
import { buildCityGrid } from "./cityGrid";
import { laneSample, loopSample, driveAlong, walkAlong, type Lane, type Loop } from "./pathSample";

const HALF = 2.5;
const X_OFFSETS = [-1.1, 0.9];
const Z_OFFSETS = [-0.9, 1.0];
const ROAD_SPAN = 7;

const ROAD_CLEAR = 0.32;
const isOpenEdge = (v: number) => Math.abs(Math.abs(v) - HALF) < 0.01;

// Insets a cell's bounds away from any real road edge so trees never land
// inside the road + sidewalk strip.
function safeBounds(cell: { x0: number; x1: number; z0: number; z1: number }) {
  return {
    x0: cell.x0 + (isOpenEdge(cell.x0) ? 0 : ROAD_CLEAR),
    x1: cell.x1 - (isOpenEdge(cell.x1) ? 0 : ROAD_CLEAR),
    z0: cell.z0 + (isOpenEdge(cell.z0) ? 0 : ROAD_CLEAR),
    z1: cell.z1 - (isOpenEdge(cell.z1) ? 0 : ROAD_CLEAR),
  };
}

// A compact single-block diorama, true isometric, shared by the AI
// capabilities and templates showcase cards. `accent` tints the sun and one
// car so each card keeps its brand color without falling back to a dark,
// moody palette. Pedestrians only ever walk a sidewalk (block loop or
// straight lane) — they never cross the road.
export function mountAccentScene(canvas: HTMLCanvasElement, opts: { accent: number }) {
  const base = createBaseScene(canvas);
  const { scene, camera } = base;

  camera.position.set(6, 6, 6);
  camera.lookAt(0, 0, 0);
  base.setViewSize(3.4);

  scene.fog = new THREE.Fog(0xeaf6ff, 9, 16);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfe6bd, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(2.5, 4, 1.8);
  scene.add(sun);
  const accentLight = new THREE.PointLight(opts.accent, 1.4, 6);
  accentLight.position.set(0, 1.8, 0);
  scene.add(accentLight);

  // Ground/road pavement reach far past the visible frame — no edge or
  // dead-end ever enters view.
  scene.add(buildGround(2 * ROAD_SPAN + 6, 0x8fbf8a));

  const grid = buildCityGrid({
    half: HALF, xOffsets: X_OFFSETS, zOffsets: Z_OFFSETS,
    roadWidth: 0.32, walkWidth: 0.14, laneGap: 0.1, roadSpan: ROAD_SPAN,
  });
  scene.add(grid.group);

  const block = grid.interiorCells[0];
  const store = buildStore();
  store.scale.setScalar(0.95);
  store.position.set(block.cx, 0, block.cz);
  scene.add(store);

  for (const cell of grid.outerCells) {
    const sb = safeBounds(cell);
    const tree = buildTree();
    tree.scale.setScalar(0.32 + Math.random() * 0.14);
    tree.position.set(sb.x0 + Math.random() * Math.max(0.01, sb.x1 - sb.x0), 0, sb.z0 + Math.random() * Math.max(0.01, sb.z1 - sb.z0));
    scene.add(tree);
  }

  const cars: (Car & { lane: Lane })[] = [];
  for (let i = 0; i < 5; i++) {
    const lane = grid.carLanes[i % grid.carLanes.length];
    const speed = 1.7 + Math.random() * 0.5;
    const car = i === 3 ? buildTruck(speed * 0.85, Math.random() * 8) : buildCar(speed, Math.random() * 8);
    if (i === 0) car.group.traverse((o) => { if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial && o.material.metalness > 0) o.material.color.set(opts.accent); });
    cars.push({ ...car, lane });
    scene.add(car.group);
  }

  // One vehicle loops the block's perimeter roads, turning at each junction.
  const loopCar = buildCar(1.3, Math.random() * 6);
  const loopCarLane = { ...loopCar, loop: block.carLoop };
  scene.add(loopCar.group);

  const people: (Person & { loop: Loop })[] = [];
  for (let i = 0; i < 3; i++) {
    const person = buildPerson(0.7 + Math.random() * 0.2, i * 1.2 + Math.random());
    people.push({ ...person, loop: block.loop });
    scene.add(person.group);
  }

  const roadWalkers: (Person & { lane: Lane })[] = [];
  for (let i = 0; i < 3; i++) {
    const lane = grid.walkLanes[i % grid.walkLanes.length];
    const person = buildPerson(0.7 + Math.random() * 0.2, Math.random() * 6);
    roadWalkers.push({ ...person, lane });
    scene.add(person.group);
  }

  base.start((elapsed) => {
    for (const car of cars) {
      const traveled = elapsed * car.speed + car.phase;
      const s = laneSample(car.lane, traveled);
      driveAlong(car, s.position, s.dir, traveled);
    }
    const loopTraveled = elapsed * loopCarLane.speed + loopCarLane.phase;
    const s = loopSample(loopCarLane.loop, loopTraveled);
    driveAlong(loopCarLane, s.position, s.dir, loopTraveled);
    for (const person of people) {
      const ps = loopSample(person.loop, elapsed * person.speed + person.phase);
      walkAlong(person, ps.position, ps.dir, elapsed, person.phase);
    }
    for (const person of roadWalkers) {
      const ps = laneSample(person.lane, elapsed * person.speed + person.phase);
      walkAlong(person, ps.position, ps.dir, elapsed, person.phase);
    }
  });
}
