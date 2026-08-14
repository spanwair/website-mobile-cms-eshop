import * as THREE from "three";

// Max unscaled distance from the group's origin to any peak's outer edge —
// callers use this (× their scale factor) to keep the whole cluster clear of
// roads instead of only accounting for the central peak's own radius.
export const MOUNTAIN_FOOTPRINT = 1.45;

export function buildMountain(): THREE.Group {
  const group = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x8e8ea8, roughness: 0.9, flatShading: true });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf5f3ee, roughness: 0.8, flatShading: true });

  const peaks = [
    { x: 0, z: 0, r: 1.3, h: 2.7 },
    { x: 0.65, z: 0.22, r: 0.75, h: 1.8 },
    { x: -0.55, z: -0.18, r: 0.8, h: 1.95 },
  ];
  for (const p of peaks) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(p.r, p.h, 6), rockMat);
    cone.position.set(p.x, p.h / 2, p.z);
    cone.castShadow = true;
    group.add(cone);

    const capH = p.h * 0.3;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(p.r * 0.42, capH, 6), snowMat);
    cap.position.set(p.x, p.h - capH * 0.5, p.z);
    group.add(cap);
  }
  return group;
}

export function buildCabin(): THREE.Group {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xb5651d, roughness: 0.8, flatShading: true });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.7, flatShading: true });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.4), wallMat);
  body.position.y = 0.16;
  body.castShadow = body.receiveShadow = true;
  group.add(body);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.28, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 0.32 + 0.14;
  roof.castShadow = true;
  group.add(roof);

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.06), new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.9 }));
  chimney.position.set(0.14, 0.5, 0.05);
  group.add(chimney);

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.02), new THREE.MeshStandardMaterial({ color: 0x3a2a1a }));
  door.position.set(0, 0.1, 0.21);
  group.add(door);

  return group;
}

// Irregular (hand-drawn-feeling) shoreline instead of a perfect circle.
export function buildLake(radiusX: number, radiusZ: number): THREE.Mesh {
  const shape = new THREE.Shape();
  const segments = 28;
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const jitter = 1 + Math.sin(t * 3) * 0.07 + Math.sin(t * 5 + 1) * 0.04;
    const x = Math.cos(t) * radiusX * jitter;
    const z = Math.sin(t) * radiusZ * jitter;
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  }
  const mesh = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshStandardMaterial({ color: 0x5fa8d3, roughness: 0.25, metalness: 0.05 }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02;
  mesh.receiveShadow = true;
  return mesh;
}

const HULL_COLORS = [0xffffff, 0xd94f4f, 0x2f4f8f, 0xf2b134];

// A pointed bow + tapered stern instead of a plain box — reads as an actual
// boat hull from the isometric view rather than a floating brick.
function hullShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0.17);
  s.quadraticCurveTo(0.065, 0.11, 0.07, 0.02);
  s.lineTo(0.07, -0.09);
  s.quadraticCurveTo(0.07, -0.14, 0, -0.15);
  s.quadraticCurveTo(-0.07, -0.14, -0.07, -0.09);
  s.lineTo(-0.07, 0.02);
  s.quadraticCurveTo(-0.065, 0.11, 0, 0.17);
  return s;
}

export function buildBoat(): THREE.Group {
  const group = new THREE.Group();
  const hullColor = HULL_COLORS[Math.floor(Math.random() * HULL_COLORS.length)];

  const hullGeom = new THREE.ExtrudeGeometry(hullShape(), { depth: 0.06, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1 });
  const hull = new THREE.Mesh(hullGeom, new THREE.MeshStandardMaterial({ color: hullColor, roughness: 0.5 }));
  hull.rotation.x = -Math.PI / 2;
  hull.position.y = 0.02;
  hull.castShadow = true;
  group.add(hull);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 6), new THREE.MeshStandardMaterial({ color: 0x6b4423 }));
  mast.position.y = 0.17;
  group.add(mast);

  const sail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 3), new THREE.MeshStandardMaterial({ color: 0xfaf7f0, side: THREE.DoubleSide }));
  sail.scale.z = 0.1;
  sail.position.set(0.02, 0.2, 0);
  group.add(sail);

  return group;
}
