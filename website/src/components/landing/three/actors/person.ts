import * as THREE from "three";

const SHIRT_COLORS = [0x4f46e5, 0xef4444, 0xf59e0b, 0x10b981, 0x3b82f6, 0xec4899];
const HAIR_COLORS = [0x3a2a1a, 0x6b4226, 0x1a1a1a, 0xd6a35c, 0x8a5a3a];
const SKIN_TONE = 0xf0c29b;
const PANT_COLOR = 0x475569;

// Every person is built at this fixed scale so all pedestrians read as the same
// height, and sized down to roughly match car height (buildCar ~0.36 tall) —
// people must not tower over traffic.
const PERSON_SCALE = 0.58;

export interface Person {
  group: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  speed: number;
  phase: number;
}

function limb(length: number, thickness: number, color: number): { pivot: THREE.Group; mesh: THREE.Mesh } {
  const pivot = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(thickness, length, thickness),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
  );
  mesh.position.y = -length / 2;
  mesh.castShadow = true;
  pivot.add(mesh);
  return { pivot, mesh };
}

// Legs are built so their bottom edge sits exactly at y=0 (feet on the ground) —
// the figure is then scaled about the origin, which keeps the feet grounded at
// any scale instead of floating above the pavement.
export function buildPerson(speed: number, phase: number): Person {
  const figure = new THREE.Group();
  const shirt = SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)];
  const hair = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];

  const legLength = 0.3;
  const hipY = legLength;

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.26, 0.11),
    new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.8 }),
  );
  torso.position.y = hipY + 0.13;
  torso.castShadow = true;
  figure.add(torso);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 10),
    new THREE.MeshStandardMaterial({ color: SKIN_TONE, roughness: 0.6 }),
  );
  head.position.y = hipY + 0.34;
  head.castShadow = true;
  figure.add(head);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshStandardMaterial({ color: hair, roughness: 0.9 }),
  );
  hairCap.position.y = hipY + 0.37;
  figure.add(hairCap);

  const leftArm = limb(0.26, 0.05, shirt);
  leftArm.pivot.position.set(-0.11, hipY + 0.25, 0);
  figure.add(leftArm.pivot);

  const rightArm = limb(0.26, 0.05, shirt);
  rightArm.pivot.position.set(0.11, hipY + 0.25, 0);
  figure.add(rightArm.pivot);

  const leftLeg = limb(legLength, 0.06, PANT_COLOR);
  leftLeg.pivot.position.set(-0.05, hipY, 0);
  figure.add(leftLeg.pivot);

  const rightLeg = limb(legLength, 0.06, PANT_COLOR);
  rightLeg.pivot.position.set(0.05, hipY, 0);
  figure.add(rightLeg.pivot);

  const group = new THREE.Group();
  group.add(figure);
  group.scale.setScalar(PERSON_SCALE);

  return { group, leftArm: leftArm.pivot, rightArm: rightArm.pivot, leftLeg: leftLeg.pivot, rightLeg: rightLeg.pivot, speed, phase };
}
