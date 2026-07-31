import * as THREE from "three";
import { buildTree, buildGround } from "./actors/props";
import { buildWarehouse, buildOffice, buildStore } from "./actors/buildings";
import { buildMountain, buildCabin, buildLake, buildBoat, MOUNTAIN_FOOTPRINT } from "./actors/nature";
import type { CityGrid, InteriorCell } from "./cityGrid";

// A boat orbiting the lake on its own fixed-radius ellipse. Different boats
// get different radii (concentric rings) so their paths can never cross,
// regardless of speed or phase.
export interface BoatOrbit {
  group: THREE.Group;
  center: THREE.Vector3;
  radiusX: number;
  radiusZ: number;
  angSpeed: number;
  phase: number;
}

const ROAD_CLEAR = 0.65;

// Insets a cell's bounds away from any *real* road edge (not the open edges
// that just border unrestricted background) so trees/lake/mountain placement
// never lands inside the road + sidewalk strip.
function safeBounds(cell: { x0: number; x1: number; z0: number; z1: number }, half: number) {
  const isOpenEdge = (v: number) => Math.abs(Math.abs(v) - half) < 0.01;
  return {
    x0: cell.x0 + (isOpenEdge(cell.x0) ? 0 : ROAD_CLEAR),
    x1: cell.x1 - (isOpenEdge(cell.x1) ? 0 : ROAD_CLEAR),
    z0: cell.z0 + (isOpenEdge(cell.z0) ? 0 : ROAD_CLEAR),
    z1: cell.z1 - (isOpenEdge(cell.z1) ? 0 : ROAD_CLEAR),
  };
}

// Builds the campus (warehouse/store/offices in the merged block) plus the
// background landmarks (mountain+cabin, lake+boats, trees) in the outer
// cells, and returns the block so the caller can add traffic/pedestrians.
export function placeCampusAndNature(scene: THREE.Scene, grid: CityGrid, half: number, groundSize: number, isMobile: boolean): { block: InteriorCell; boats: BoatOrbit[] } {
  scene.add(buildGround(groundSize, 0x8fbf8a));

  const [block] = grid.interiorCells;

  const warehouse = buildWarehouse();
  warehouse.scale.setScalar(0.75);
  warehouse.position.set(block.cx - 2.2, 0, block.cz + 0.6);
  scene.add(warehouse);

  const store = buildStore();
  store.scale.setScalar(1.1);
  store.position.set(block.cx - 0.8, 0, block.cz - 1.7);
  scene.add(store);

  const office = buildOffice();
  office.scale.setScalar(1.35);
  office.position.set(block.cx + 2.0, 0, block.cz - 0.4);
  scene.add(office);

  const office2 = buildOffice();
  office2.scale.setScalar(0.9);
  office2.position.set(block.cx + 3.2, 0, block.cz + 1.4);
  scene.add(office2);

  // Outer (non-interior) cells: give the lake+boats and the mountains+cabin
  // the most screen-visible outer cells (highest x-z), the rest get trees.
  const outerByScreenX = [...grid.outerCells].sort((a, b) => (b.cx - b.cz) - (a.cx - a.cz));
  const mountainCell = outerByScreenX.shift()!;
  const lakeIdx = outerByScreenX.findIndex((c) => c.z0 !== mountainCell.z0);
  const lakeCell = outerByScreenX.splice(lakeIdx >= 0 ? lakeIdx : 0, 1)[0];
  const outer = outerByScreenX;

  // Bigger, and pushed further back/away from its cell's road edges (which
  // also reads as "further up" on screen) instead of sitting dead-center.
  // Clearance uses the mountain's *real* multi-peak footprint (off-center
  // peaks reach further than the central one alone) so it never overlaps
  // either road bordering this corner cell.
  const mountainScale = 1.65;
  const reach = MOUNTAIN_FOOTPRINT * mountainScale;
  const mx = mountainCell.x0 + ROAD_CLEAR + reach + 0.05;
  const mz = mountainCell.z1 - ROAD_CLEAR - reach - 0.05;
  const mountains = buildMountain();
  mountains.scale.setScalar(mountainScale);
  mountains.position.set(mx, 0, mz);
  scene.add(mountains);
  const cabin = buildCabin();
  cabin.scale.setScalar(1.6);
  cabin.position.set(mx + 1.6, 0, mz + 1.8);
  scene.add(cabin);

  const lakeSafe = safeBounds(lakeCell, half);
  const lakeCx = (lakeSafe.x0 + lakeSafe.x1) / 2;
  const lakeCz = (lakeSafe.z0 + lakeSafe.z1) / 2;
  const lakeRx = Math.max(0.5, (lakeSafe.x1 - lakeSafe.x0) / 2 - 0.15);
  const lakeRz = Math.max(0.4, (lakeSafe.z1 - lakeSafe.z0) / 2 - 0.15);
  const lakeShoreX = Math.min(1.5, lakeRx);
  const lakeShoreZ = Math.min(1.2, lakeRz);
  const lake = buildLake(lakeShoreX, lakeShoreZ);
  lake.position.x = lakeCx;
  lake.position.z = lakeCz;
  scene.add(lake);

  // Concentric rings, well inside the shoreline — different radius per boat
  // means their orbits geometrically cannot cross, no matter the speed/phase.
  const boats: BoatOrbit[] = [];
  const ringFactors = [0.35, 0.6, 0.85];
  for (let i = 0; i < ringFactors.length; i++) {
    const boat = buildBoat();
    const radiusX = lakeShoreX * ringFactors[i];
    const radiusZ = lakeShoreZ * ringFactors[i];
    const angSpeed = 0.1 + i * 0.02;
    const phase = Math.random() * Math.PI * 2;
    boat.position.set(lakeCx + radiusX, 0.03, lakeCz);
    scene.add(boat);
    boats.push({ group: boat, center: new THREE.Vector3(lakeCx, 0.03, lakeCz), radiusX, radiusZ, angSpeed, phase });
  }

  for (const cell of outer) {
    const sb = safeBounds(cell, half);
    const treeCount = isMobile ? 2 : 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < treeCount; i++) {
      const tree = buildTree();
      tree.scale.setScalar(0.55 + Math.random() * 0.4);
      const tx = sb.x0 + Math.random() * Math.max(0.01, sb.x1 - sb.x0);
      const tz = sb.z0 + Math.random() * Math.max(0.01, sb.z1 - sb.z0);
      tree.position.set(tx, 0, tz);
      scene.add(tree);
    }
  }

  return { block, boats };
}
