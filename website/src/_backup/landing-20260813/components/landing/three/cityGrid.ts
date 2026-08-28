import * as THREE from "three";
import type { Lane, Loop } from "./pathSample";

export interface CellBounds {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  cx: number;
  cz: number;
}

export interface InteriorCell extends CellBounds {
  /** Closed sidewalk perimeter around this block — pedestrians walk this loop
   * forever and never set foot on the road. */
  loop: Loop;
  /** Closed *road* perimeter one lane-width outside the block — cars driving
   * this loop turn 90° at each of the block's 4 junctions instead of only
   * ever going straight through. */
  carLoop: Loop;
}

export interface CityGridOptions {
  half: number;
  /** Street centerline positions along each axis — independent, irregular
   * spacing per axis reads as a real (imperfect) city grid rather than a
   * mirrored, uniform lattice. */
  xOffsets: number[];
  zOffsets: number[];
  roadWidth?: number;
  walkWidth?: number;
  laneGap?: number;
  roadColor?: number;
  walkColor?: number;
  /** Physical length the road pavement is drawn to (defaults to `half`). Keep
   * this well beyond the visible frame so traffic exits/re-enters off-screen
   * instead of visibly dead-ending or U-turning in view. */
  roadSpan?: number;
}

export interface CityGrid {
  group: THREE.Group;
  carLanes: Lane[];
  /** Straight sidewalk lanes running the full length of every street — for
   * pedestrians walking roads that aren't part of an interior block's loop. */
  walkLanes: Lane[];
  /** Blocks fully bordered by roads on all 4 sides — these get a building and
   * a pedestrian sidewalk loop. */
  interiorCells: InteriorCell[];
  /** Blocks touching the outer edge of the grid — free for trees, a lake,
   * mountains, anything that isn't gated behind a full road perimeter. */
  outerCells: CellBounds[];
}

export function buildCityGrid(opts: CityGridOptions): CityGrid {
  const {
    half, xOffsets, zOffsets,
    roadWidth = 0.5, walkWidth = 0.22, laneGap = 0.17,
    roadColor = 0xdcd6c6, walkColor = 0xf3efe4, roadSpan = half,
  } = opts;

  const group = new THREE.Group();
  const roadMat = new THREE.MeshStandardMaterial({ color: roadColor, roughness: 0.92 });
  const walkMat = new THREE.MeshStandardMaterial({ color: walkColor, roughness: 0.95 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });

  const span = roadSpan * 2;
  const carLanes: Lane[] = [];
  const walkLanes: Lane[] = [];
  // Straight sidewalk lanes only span the *outer* stretch of a street, up to
  // the nearest cross street — a full-length lane would run the pedestrian
  // straight across every perpendicular road it passes, which is exactly the
  // "walks into traffic" look this whole loop system exists to avoid. (Only
  // correct in the current 2-offsets-per-axis / single-block layout.)
  const xMin = Math.min(...xOffsets), xMax = Math.max(...xOffsets);
  const zMin = Math.min(...zOffsets), zMax = Math.max(...zOffsets);
  // Distance from a street's centerline to the outer edge of its own
  // sidewalk — the point where a perpendicular sidewalk actually starts.
  // Pedestrians on the outer straight lanes must stop here, not at the
  // street's centerline (which would put them standing in the road).
  const walkInset = roadWidth / 2 + walkWidth / 2;
  // Once stopped at that corner, they turn 90° and continue a short way down
  // the cross street's own sidewalk before ping-ponging back — a real corner
  // turn instead of a dead stop or a jaywalk across the road.
  const turnLen = 0.7;

  function strip(length: number, width: number, cx: number, cz: number, horizontal: boolean, mat: THREE.Material, y: number) {
    const geom = new THREE.PlaneGeometry(horizontal ? length : width, horizontal ? width : length);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(cx, y, cz);
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  function dashedCenterline(cx: number, cz: number, horizontal: boolean) {
    const dashLen = 0.22;
    const gap = 0.16;
    const count = Math.floor(span / (dashLen + gap));
    for (let i = 0; i < count; i++) {
      const offset = -roadSpan + i * (dashLen + gap) + dashLen / 2;
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(horizontal ? dashLen : 0.03, horizontal ? 0.03 : dashLen), stripeMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(horizontal ? cx + offset : cx, 0.011, horizontal ? cz : cz + offset);
      group.add(dash);
    }
  }

  for (const s of zOffsets) {
    strip(span, roadWidth, 0, s, true, roadMat, 0.01);
    strip(span, walkWidth, 0, s - roadWidth / 2 - walkWidth / 2, true, walkMat, 0.009);
    strip(span, walkWidth, 0, s + roadWidth / 2 + walkWidth / 2, true, walkMat, 0.009);
    dashedCenterline(0, s, true);
    // EU right-hand traffic: with `right = heading × up`, a car heading +x
    // must keep to the +z side of centerline, and -x keeps to -z — the
    // vertical streets below already follow this; these were swapped
    // (left-hand) before.
    carLanes.push({ points: [new THREE.Vector3(-roadSpan, 0, s + laneGap), new THREE.Vector3(roadSpan, 0, s + laneGap)] });
    carLanes.push({ points: [new THREE.Vector3(roadSpan, 0, s - laneGap), new THREE.Vector3(-roadSpan, 0, s - laneGap)] });
    const zWalk = roadWidth / 2 + walkWidth / 2;
    const southZ = s - zWalk;
    const northZ = s + zWalk;
    walkLanes.push({ points: [
      new THREE.Vector3(-half, 0, southZ),
      new THREE.Vector3(xMin - walkInset, 0, southZ),
      new THREE.Vector3(xMin - walkInset, 0, southZ - turnLen),
    ] });
    walkLanes.push({ points: [
      new THREE.Vector3(half, 0, southZ),
      new THREE.Vector3(xMax + walkInset, 0, southZ),
      new THREE.Vector3(xMax + walkInset, 0, southZ - turnLen),
    ] });
    walkLanes.push({ points: [
      new THREE.Vector3(half, 0, northZ),
      new THREE.Vector3(xMax + walkInset, 0, northZ),
      new THREE.Vector3(xMax + walkInset, 0, northZ + turnLen),
    ] });
    walkLanes.push({ points: [
      new THREE.Vector3(-half, 0, northZ),
      new THREE.Vector3(xMin - walkInset, 0, northZ),
      new THREE.Vector3(xMin - walkInset, 0, northZ + turnLen),
    ] });
  }

  for (const s of xOffsets) {
    strip(span, roadWidth, s, 0, false, roadMat, 0.01);
    strip(span, walkWidth, s - roadWidth / 2 - walkWidth / 2, 0, false, walkMat, 0.009);
    strip(span, walkWidth, s + roadWidth / 2 + walkWidth / 2, 0, false, walkMat, 0.009);
    dashedCenterline(s, 0, false);
    carLanes.push({ points: [new THREE.Vector3(s - laneGap, 0, -roadSpan), new THREE.Vector3(s - laneGap, 0, roadSpan)] });
    carLanes.push({ points: [new THREE.Vector3(s + laneGap, 0, roadSpan), new THREE.Vector3(s + laneGap, 0, -roadSpan)] });
    const xWalk = roadWidth / 2 + walkWidth / 2;
    const westX = s - xWalk;
    const eastX = s + xWalk;
    walkLanes.push({ points: [
      new THREE.Vector3(westX, 0, -half),
      new THREE.Vector3(westX, 0, zMin - walkInset),
      new THREE.Vector3(westX - turnLen, 0, zMin - walkInset),
    ] });
    walkLanes.push({ points: [
      new THREE.Vector3(westX, 0, half),
      new THREE.Vector3(westX, 0, zMax + walkInset),
      new THREE.Vector3(westX - turnLen, 0, zMax + walkInset),
    ] });
    walkLanes.push({ points: [
      new THREE.Vector3(eastX, 0, half),
      new THREE.Vector3(eastX, 0, zMax + walkInset),
      new THREE.Vector3(eastX + turnLen, 0, zMax + walkInset),
    ] });
    walkLanes.push({ points: [
      new THREE.Vector3(eastX, 0, -half),
      new THREE.Vector3(eastX, 0, zMin - walkInset),
      new THREE.Vector3(eastX + turnLen, 0, zMin - walkInset),
    ] });
  }

  // No zebra crosswalks: pedestrians here never cross a road (they only ever
  // walk a block's sidewalk perimeter), so painting crossings would just
  // visually contradict that and tempt the eye into reading a jaywalk.

  const xBounds = [-half, ...xOffsets, half];
  const zBounds = [-half, ...zOffsets, half];
  const inset = roadWidth / 2 + walkWidth / 2;

  const interiorCells: InteriorCell[] = [];
  const outerCells: CellBounds[] = [];
  for (let i = 0; i < xBounds.length - 1; i++) {
    for (let j = 0; j < zBounds.length - 1; j++) {
      const x0 = xBounds[i], x1 = xBounds[i + 1], z0 = zBounds[j], z1 = zBounds[j + 1];
      const cell: CellBounds = { x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 };
      const isInterior = i > 0 && i < xBounds.length - 2 && j > 0 && j < zBounds.length - 2;
      if (isInterior) {
        const points = [
          new THREE.Vector3(x0 + inset, 0, z0 + inset),
          new THREE.Vector3(x1 - inset, 0, z0 + inset),
          new THREE.Vector3(x1 - inset, 0, z1 - inset),
          new THREE.Vector3(x0 + inset, 0, z1 - inset),
        ];
        // Same 4 outward corners as before, walked in the reverse order —
        // this flips every edge's direction of travel, which is what keeps
        // this one-way perimeter loop on the correct (right-hand) side of
        // each shared street now that the straight lanes above were fixed.
        const carPoints = [
          new THREE.Vector3(x0 - laneGap, 0, z0 - laneGap),
          new THREE.Vector3(x0 - laneGap, 0, z1 + laneGap),
          new THREE.Vector3(x1 + laneGap, 0, z1 + laneGap),
          new THREE.Vector3(x1 + laneGap, 0, z0 - laneGap),
        ];
        interiorCells.push({ ...cell, loop: { points }, carLoop: { points: carPoints } });
      } else {
        outerCells.push(cell);
      }
    }
  }

  return { group, carLanes, walkLanes, interiorCells, outerCells };
}
