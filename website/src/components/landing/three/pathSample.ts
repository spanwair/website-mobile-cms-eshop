import * as THREE from "three";

// A lane is a polyline of 2+ points. Straight lanes (cars) use 2 points; bent
// lanes (pedestrians turning a corner instead of crossing a road) use 3+.
export interface Lane {
  points: THREE.Vector3[];
}

export interface Loop {
  points: THREE.Vector3[];
}

// Eased ping-pong along a (possibly bent) lane: walks/drives to the far end,
// eases into a turn, and comes back. Easing is applied to overall distance
// traveled along the whole polyline, so only the two true ends decelerate —
// interior bend points are passed through at whatever speed that maps to,
// reading as a real corner turn rather than a stop. `traveled` is
// world-distance covered so far (typically `elapsed * speedUnitsPerSecond +
// phaseOffset`) — normalizing by the lane's own length here means callers
// pass real speeds/offsets instead of having to know each lane's length.
export function laneSample(lane: Lane, traveled: number): { position: THREE.Vector3; dir: THREE.Vector3 } {
  const pts = lane.points;
  const segLens = pts.slice(1).map((p, i) => p.distanceTo(pts[i]) || 0.0001);
  const total = segLens.reduce((a, b) => a + b, 0) || 1;
  const cycle = 2 * total;
  const pos = ((traveled % cycle) + cycle) % cycle;
  const forward = pos <= total;
  const raw = (forward ? pos : cycle - pos) / total;
  const eased = raw * raw * (3 - 2 * raw);
  let dist = eased * total;
  let i = 0;
  while (i < segLens.length - 1 && dist > segLens[i]) {
    dist -= segLens[i];
    i++;
  }
  const a = pts[i], b = pts[i + 1];
  const t = dist / segLens[i];
  const position = a.clone().lerp(b, t);
  const dir = new THREE.Vector3().subVectors(b, a).normalize();
  if (!forward) dir.negate();
  return { position, dir };
}

// One-way travel along a straight lane: always start→end, wrapping back to
// the start instead of reversing. Real one-way traffic never drives the
// return leg of its own lane — a ping-ponging car would spend half its time
// moving backward while still sitting on the offset reserved for the
// opposite direction, which is exactly the "driving on the left" bug this
// avoids. The wrap point sits at each lane's far end (`roadSpan`, well past
// the visible frame), so it's never seen.
export function wrapLaneSample(lane: Lane, traveled: number): { position: THREE.Vector3; dir: THREE.Vector3 } {
  const pts = lane.points;
  const segLens = pts.slice(1).map((p, i) => p.distanceTo(pts[i]) || 0.0001);
  const total = segLens.reduce((a, b) => a + b, 0) || 1;
  let d = ((traveled % total) + total) % total;
  let i = 0;
  while (i < segLens.length - 1 && d > segLens[i]) {
    d -= segLens[i];
    i++;
  }
  const a = pts[i], b = pts[i + 1];
  const t = d / segLens[i];
  const position = a.clone().lerp(b, t);
  const dir = new THREE.Vector3().subVectors(b, a).normalize();
  return { position, dir };
}

// Continuous walk/drive around a closed loop — turns at every corner instead
// of ever cutting straight across whatever the loop borders.
export function loopSample(loop: Loop, traveled: number): { position: THREE.Vector3; dir: THREE.Vector3 } {
  const pts = loop.points;
  const n = pts.length;
  const segLens = pts.map((p, i) => p.distanceTo(pts[(i + 1) % n]));
  const total = segLens.reduce((a, b) => a + b, 0);
  let d = ((traveled % total) + total) % total;
  for (let i = 0; i < n; i++) {
    if (d <= segLens[i]) {
      const a = pts[i], b = pts[(i + 1) % n];
      const t = segLens[i] === 0 ? 0 : d / segLens[i];
      return { position: a.clone().lerp(b, t), dir: new THREE.Vector3().subVectors(b, a).normalize() };
    }
    d -= segLens[i];
  }
  return { position: pts[0].clone(), dir: new THREE.Vector3(1, 0, 0) };
}

export function orient(group: THREE.Object3D, x: number, y: number, z: number, tx: number, tz: number) {
  group.position.set(x, y, z);
  // Object3D.lookAt (unlike Camera/Light.lookAt) points local +Z at the given
  // target, not -Z — so to make the model's -Z-facing front point along
  // (tx, tz), the target must be *behind* the object relative to travel.
  group.lookAt(x - tx, y, z - tz);
}

interface WheeledActor {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  speed: number;
}

// Shared per-frame update for anything on wheels (car or truck), on either a
// straight lane or a turning loop. `distTraveled` must be actual
// world-distance covered (not raw elapsed time) so wheels stop spinning when
// a car brakes for traffic instead of spinning in place.
export function driveAlong(actor: WheeledActor, position: THREE.Vector3, dir: THREE.Vector3, distTraveled: number) {
  orient(actor.group, position.x, 0, position.z, dir.x, dir.z);
  const spin = distTraveled;
  for (const wheel of actor.wheels) {
    wheel.rotateX(spin - (wheel.userData.lastSpin ?? 0));
    wheel.userData.lastSpin = spin;
  }
}

interface WalkingActor {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  speed: number;
}

// Shared per-frame update for a walking person, on either a sidewalk lane or
// a block's perimeter loop.
export function walkAlong(actor: WalkingActor, position: THREE.Vector3, dir: THREE.Vector3, elapsed: number, phase: number) {
  orient(actor.group, position.x, 0, position.z, dir.x, dir.z);
  const stride = Math.sin(elapsed * actor.speed * 2.4 + phase) * 0.5;
  actor.leftLeg.rotation.x = stride;
  actor.rightLeg.rotation.x = -stride;
  actor.leftArm.rotation.x = -stride * 0.8;
  actor.rightArm.rotation.x = stride * 0.8;
}
