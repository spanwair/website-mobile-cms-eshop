import * as THREE from "three";

const CAR_COLORS = [0xef4444, 0xf8fafc, 0x6366f1, 0xfacc15, 0x22d3ee, 0xf97316];

export interface Car {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  speed: number;
  phase: number;
}

// Model faces local -Z ("front" = cabin/windows offset toward -Z) so a plain
// group.lookAt(position + tangent) orients it correctly — Object3D.lookAt points
// local -Z at its target, matching the direction-of-travel convention used by callers.
export function buildCar(speed: number, phase: number): Car {
  const group = new THREE.Group();
  const color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.35 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.42), bodyMat);
  body.position.y = 0.16;
  body.castShadow = true;
  group.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.24), bodyMat);
  cabin.position.set(0, 0.29, -0.02);
  cabin.castShadow = true;
  group.add(cabin);

  const windows = new THREE.Mesh(
    new THREE.BoxGeometry(0.205, 0.09, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.15, transparent: true, opacity: 0.85 }),
  );
  windows.position.set(0, 0.3, -0.02);
  group.add(windows);

  const headlightMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb, emissive: 0xfff3b0, emissiveIntensity: 1.6 });
  const taillightMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b, emissive: 0xff1f3d, emissiveIntensity: 1.4 });
  const lightGeom = new THREE.BoxGeometry(0.045, 0.04, 0.02);
  for (const x of [-0.075, 0.075]) {
    const headlight = new THREE.Mesh(lightGeom, headlightMat);
    headlight.position.set(x, 0.15, -0.21);
    group.add(headlight);

    const taillight = new THREE.Mesh(lightGeom, taillightMat);
    taillight.position.set(x, 0.15, 0.21);
    group.add(taillight);
  }

  const wheelGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 14);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
  const wheels: THREE.Mesh[] = [];
  const positions: [number, number][] = [[-0.09, 0.14], [0.09, 0.14], [-0.09, -0.14], [0.09, -0.14]];
  for (const [x, z] of positions) {
    const wheel = new THREE.Mesh(wheelGeom, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.06, z);
    wheel.castShadow = true;
    group.add(wheel);
    wheels.push(wheel);
  }

  return { group, wheels, speed, phase };
}

const CAB_COLORS = [0xef4444, 0x2563eb, 0xf8fafc, 0x475569];
const CARGO_COLORS = [0xf8fafc, 0xffffff, 0xfacc15];

// Cab up front + a separate cargo box behind it, on a 3-axle wheelbase — a
// distinct silhouette from the sedan so traffic reads as mixed, not cloned.
export function buildTruck(speed: number, phase: number): Car {
  const group = new THREE.Group();
  const cabMat = new THREE.MeshStandardMaterial({ color: CAB_COLORS[Math.floor(Math.random() * CAB_COLORS.length)], roughness: 0.4, metalness: 0.3 });
  const cargoMat = new THREE.MeshStandardMaterial({ color: CARGO_COLORS[Math.floor(Math.random() * CARGO_COLORS.length)], roughness: 0.55 });

  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.22), cabMat);
  cab.position.set(0, 0.19, -0.32);
  cab.castShadow = true;
  group.add(cab);

  const windows = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.1, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.15, transparent: true, opacity: 0.85 }),
  );
  windows.position.set(0, 0.23, -0.42);
  group.add(windows);

  const cargo = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.55), cargoMat);
  cargo.position.set(0, 0.27, 0.05);
  cargo.castShadow = true;
  cargo.receiveShadow = true;
  group.add(cargo);

  const headlightMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb, emissive: 0xfff3b0, emissiveIntensity: 1.6 });
  const taillightMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b, emissive: 0xff1f3d, emissiveIntensity: 1.4 });
  const lightGeom = new THREE.BoxGeometry(0.05, 0.045, 0.02);
  for (const x of [-0.09, 0.09]) {
    const headlight = new THREE.Mesh(lightGeom, headlightMat);
    headlight.position.set(x, 0.14, -0.43);
    group.add(headlight);

    const taillight = new THREE.Mesh(lightGeom, taillightMat);
    taillight.position.set(x, 0.16, 0.325);
    group.add(taillight);
  }

  const wheelGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.055, 14);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
  const wheels: THREE.Mesh[] = [];
  const positions: [number, number][] = [[-0.1, -0.32], [0.1, -0.32], [-0.11, 0], [0.11, 0], [-0.11, 0.28], [0.11, 0.28]];
  for (const [x, z] of positions) {
    const wheel = new THREE.Mesh(wheelGeom, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.065, z);
    wheel.castShadow = true;
    group.add(wheel);
    wheels.push(wheel);
  }

  return { group, wheels, speed, phase };
}
