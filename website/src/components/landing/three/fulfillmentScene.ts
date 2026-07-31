import * as THREE from "three";
import { createBaseScene } from "./sceneUtils";
import { buildCar, buildTruck, type Car } from "./actors/car";
import { buildPerson, type Person } from "./actors/person";
import { buildCityGrid } from "./cityGrid";
import { placeCampusAndNature } from "./fulfillmentDecor";
import { laneSample, loopSample, driveAlong, walkAlong, orient, wrapLaneSample, type Lane, type Loop } from "./pathSample";

const HALF = 7.5;
// Only the outer 2 streets per axis — no street cuts through the middle of
// the building block itself, so the whole campus reads as one uninterrupted
// site rather than being split by a road.
const X_OFFSETS = [-5.0, 4.2];
const Z_OFFSETS = [-3.2, 2.6];
const ROAD_SPAN = 34;

export function mountFulfillmentScene(canvas: HTMLCanvasElement) {
  const base = createBaseScene(canvas);
  const { scene, camera, isMobile } = base;

  // True isometric: equal x/y/z camera offset treats every axis the same —
  // no perspective foreshortening, unlike a bird's-eye photo where things
  // shrink toward the horizon.
  camera.position.set(22, 22, 22);
  camera.lookAt(0, 0, 0);
  base.setViewSize(5.5);

  scene.fog = new THREE.Fog(0xdcefff, 40, 64);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfe6bd, 1.1));
  const sun = new THREE.DirectionalLight(0xfff7e0, 1.4);
  sun.position.set(10, 16, 6);
  sun.castShadow = true;
  sun.shadow.camera.left = -HALF - 1;
  sun.shadow.camera.right = HALF + 1;
  sun.shadow.camera.top = HALF + 1;
  sun.shadow.camera.bottom = -HALF - 1;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  const grid = buildCityGrid({ half: HALF, xOffsets: X_OFFSETS, zOffsets: Z_OFFSETS, roadSpan: ROAD_SPAN });
  scene.add(grid.group);

  // Ground and road pavement both reach far past the visible frame — no
  // edge, void, or dead-end is ever supposed to enter view. Builds the
  // merged campus block (warehouse/store/offices) plus the mountain+cabin,
  // lake+boats, and trees in the outer cells; returns the block for the
  // traffic/pedestrians set up below.
  const { block, boats } = placeCampusAndNature(scene, grid, HALF, 2 * ROAD_SPAN + 20, isMobile);

  // `dist` is each car's own accumulated travel distance (advanced each frame
  // by speed × brake, not by raw elapsed time) so a braking car actually
  // slows down instead of just sampling a different point on a time curve.
  // `id` is used below for junction right-of-way ordering.
  // Cars sharing the same lane (i % laneCount collisions, unavoidable once
  // carCount > lane count) must not start at nearly the same phase — with
  // near-zero initial separation, "who's ahead" is numerically ambiguous and
  // the follow-braking below can't establish a stable gap. Spacing each
  // lane's cars evenly around its own one-way wrap cycle (lane length, since
  // cars never reverse — see wrapLaneSample) guarantees a safe starting gap
  // regardless of the random jitter added on top.
  const carLaneCycle = 2 * ROAD_SPAN;
  const carsPerLane = Math.ceil((isMobile ? 10 : 20) / grid.carLanes.length);
  const laneSlot = new Map<number, number>();
  const carCount = isMobile ? 10 : 20;
  const cars: (Car & { lane: Lane; dist: number; brake: number; id: number })[] = [];
  for (let i = 0; i < carCount; i++) {
    const laneIdx = i % grid.carLanes.length;
    const lane = grid.carLanes[laneIdx];
    const slot = laneSlot.get(laneIdx) ?? 0;
    laneSlot.set(laneIdx, slot + 1);
    const slotSpacing = carLaneCycle / carsPerLane;
    const phase = slot * slotSpacing + Math.random() * slotSpacing * 0.4;
    const speed = 1.7 + Math.random() * 0.6;
    const isTruck = i % 3 === 0;
    const car = isTruck ? buildTruck(speed * 0.85, phase) : buildCar(speed, phase);
    cars.push({ ...car, lane, dist: phase, brake: 1, id: i });
    scene.add(car.group);
  }

  // A few vehicles loop the block's perimeter roads instead of a straight
  // lane, so traffic visibly turns 90° at junctions rather than only ever
  // driving straight through.
  const loopCarCount = isMobile ? 2 : 5;
  const loopCars: (Car & { loop: Loop })[] = [];
  for (let i = 0; i < loopCarCount; i++) {
    const speed = 1.3 + Math.random() * 0.4;
    const car = i % 2 === 0 ? buildTruck(speed * 0.85, Math.random() * 20) : buildCar(speed, Math.random() * 20);
    loopCars.push({ ...car, loop: block.carLoop });
    scene.add(car.group);
  }

  // Pedestrians on the block's own sidewalk loop — they turn at every corner
  // and never set foot on the road.
  const peoplePerBlock = isMobile ? 3 : 6;
  const people: (Person & { loop: Loop })[] = [];
  for (const b of grid.interiorCells) {
    for (let i = 0; i < peoplePerBlock; i++) {
      const speed = 0.7 + Math.random() * 0.25;
      const person = buildPerson(speed, i * 3.5 + Math.random() * 2);
      people.push({ ...person, loop: b.loop });
      scene.add(person.group);
    }
  }

  // More pedestrians on the *other* roads (not just around the central
  // block) — straight sidewalk lanes that stop short of every cross street.
  const roadWalkerCount = isMobile ? 4 : 12;
  const roadWalkers: (Person & { lane: Lane })[] = [];
  for (let i = 0; i < roadWalkerCount; i++) {
    const lane = grid.walkLanes[i % grid.walkLanes.length];
    const speed = 0.7 + Math.random() * 0.25;
    const person = buildPerson(speed, Math.random() * 12);
    roadWalkers.push({ ...person, lane });
    scene.add(person.group);
  }

  // Basic traffic physics, two rules, most-restrictive wins:
  //  1. Same-lane following — purely geometric (whoever is behind yields to
  //     whoever is ahead, within a tight forward+lateral check), so it's
  //     naturally deadlock-free without needing any priority order.
  //  2. Junction right-of-way — distance-to-intersection-point is angle
  //     independent, so it catches perpendicular cross-traffic converging on
  //     a junction that a forward-facing cone alone can miss. Crossing
  //     traffic has no natural "ahead" relationship, so this rule uses a
  //     fixed per-car priority (`id` — a car only yields to a lower-id one)
  //     to guarantee exactly one car proceeds instead of both waiting forever.
  const FOLLOW_RADIUS = 1.15;
  const FOLLOW_SAFE = 1.0;
  const FOLLOW_STOP = 0.35;
  const FOLLOW_LATERAL_MAX = 0.28;
  const JUNCTION_RADIUS = 1.3;
  const JUNCTION_STOP = 0.45;
  const junctions: THREE.Vector2[] = [];
  for (const jx of X_OFFSETS) for (const jz of Z_OFFSETS) junctions.push(new THREE.Vector2(jx, jz));

  function nearestJunctionDist(x: number, z: number): number {
    let best = Infinity;
    for (const j of junctions) best = Math.min(best, Math.hypot(x - j.x, z - j.y));
    return best;
  }
  function brakeFactor(minDist: number, safe: number, stop: number): number {
    if (minDist > safe) return 1;
    if (minDist < stop) return 0.05;
    return 0.05 + ((minDist - stop) / (safe - stop)) * 0.95;
  }

  const relVec = new THREE.Vector3();
  let prevElapsed = 0;

  base.start((elapsed) => {
    const dt = Math.min(0.1, Math.max(0, elapsed - prevElapsed));
    prevElapsed = elapsed;

    const states = cars.map((car) => {
      const s = wrapLaneSample(car.lane, car.dist);
      return { car, pos: s.position, dir: s.dir, junctionDist: nearestJunctionDist(s.position.x, s.position.z) };
    });

    for (let i = 0; i < states.length; i++) {
      const me = states[i];
      let followMinDist = Infinity;
      let junctionMinDist = Infinity;
      const iAmInJunction = me.junctionDist < JUNCTION_RADIUS;
      for (let j = 0; j < states.length; j++) {
        if (i === j) continue;
        const other = states[j];
        relVec.subVectors(other.pos, me.pos);
        const dist = relVec.length();
        // Junction right-of-way needs the fixed id-priority order (crossing
        // traffic has no natural "ahead" relationship, so without a total
        // order two cars could wait on each other forever). Following does
        // NOT use id at all — it's purely geometric: whoever is behind
        // yields to whoever is ahead. Using id here instead would let a
        // lower-id car rear-end a higher-id one it's catching up to, since
        // it would never consider that car a reason to slow down.
        if (iAmInJunction && other.car.id < me.car.id && other.junctionDist < JUNCTION_RADIUS && dist < junctionMinDist) {
          junctionMinDist = dist;
        }
        if (dist <= FOLLOW_RADIUS) {
          const ahead = relVec.dot(me.dir);
          if (ahead > 0) {
            const lateral = Math.sqrt(Math.max(0, dist * dist - ahead * ahead));
            if (lateral <= FOLLOW_LATERAL_MAX && dist < followMinDist) followMinDist = dist;
          }
        }
      }
      const followTarget = brakeFactor(followMinDist, FOLLOW_SAFE, FOLLOW_STOP);
      const junctionTarget = iAmInJunction ? brakeFactor(junctionMinDist, JUNCTION_RADIUS, JUNCTION_STOP) : 1;
      const target = Math.min(followTarget, junctionTarget);
      // Braking reacts fast (real cars brake quickly); resuming speed eases
      // back in gradually — prevents a suddenly-close conflict from
      // overlapping before the brake value can catch up.
      const gain = target < me.car.brake ? dt * 22 : dt * 3;
      me.car.brake += (target - me.car.brake) * Math.min(1, gain);
      me.car.dist += dt * me.car.speed * me.car.brake;
      driveAlong(me.car, me.pos, me.dir, me.car.dist);
    }
    for (const car of loopCars) {
      const traveled = elapsed * car.speed + car.phase;
      const s = loopSample(car.loop, traveled);
      driveAlong(car, s.position, s.dir, traveled);
    }
    for (const person of people) {
      const s = loopSample(person.loop, elapsed * person.speed + person.phase);
      walkAlong(person, s.position, s.dir, elapsed, person.phase);
    }
    for (const person of roadWalkers) {
      const s = laneSample(person.lane, elapsed * person.speed + person.phase);
      walkAlong(person, s.position, s.dir, elapsed, person.phase);
    }
    for (const boat of boats) {
      const angle = elapsed * boat.angSpeed + boat.phase;
      const x = boat.center.x + Math.cos(angle) * boat.radiusX;
      const z = boat.center.z + Math.sin(angle) * boat.radiusZ;
      const tx = -Math.sin(angle) * boat.radiusX;
      const tz = Math.cos(angle) * boat.radiusZ;
      orient(boat.group, x, boat.center.y, z, tx, tz);
    }
  });
}
