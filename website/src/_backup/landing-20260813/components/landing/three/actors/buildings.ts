import * as THREE from "three";

// Loosely inspired by a flat-illustration reference: slate-blue walls, warm
// cream roof accents, dark navy ground-mounted solar panels, a tall tower
// with a peaked roof + antenna mast, and a sawtooth clerestory roofline.
export function buildWarehouse(): THREE.Group {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x6b6f9e, roughness: 0.6, flatShading: true });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xf2e2b8, roughness: 0.55, flatShading: true });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x4d5080, roughness: 0.5, flatShading: true });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xffd166, emissiveIntensity: 0.6 });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x232750, roughness: 0.3, metalness: 0.4 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x2f3352, roughness: 0.6 });
  const mastMat = new THREE.MeshStandardMaterial({ color: 0x4d5080, roughness: 0.4 });

  const hall = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.1, 1.8), wallMat);
  hall.position.set(-0.3, 0.55, 0);
  hall.castShadow = hall.receiveShadow = true;
  group.add(hall);
  const hallRoof = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.08, 1.9), roofMat);
  hallRoof.position.set(-0.3, 1.13, 0);
  hallRoof.castShadow = true;
  group.add(hallRoof);

  const teeth = 6;
  for (let i = 0; i < teeth; i++) {
    const tx = -2.05 + i * (3.1 / (teeth - 1));
    const tooth = new THREE.Mesh(new THREE.BoxGeometry((3.1 / teeth) * 0.82, 0.3, 0.55), creamMat);
    tooth.position.set(tx, 1.34, -0.5);
    tooth.rotation.x = -0.35;
    tooth.castShadow = true;
    group.add(tooth);
  }

  const tower = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 1.0), wallMat);
  tower.position.set(1.6, 1.0, 0.2);
  tower.castShadow = tower.receiveShadow = true;
  group.add(tower);
  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.7, 4), creamMat);
  towerRoof.rotation.y = Math.PI / 4;
  towerRoof.position.set(1.6, 2.35, 0.2);
  towerRoof.castShadow = true;
  group.add(towerRoof);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6), mastMat);
  mast.position.set(1.6, 3.3, 0.2);
  group.add(mast);

  for (let r = 0; r < 3; r++) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.02), glowMat);
    win.position.set(1.6, 0.5 + r * 0.5, 0.71);
    group.add(win);
  }

  for (let i = 0; i < 3; i++) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.03), doorMat);
    door.position.set(-1.5 + i * 0.75, 0.35, 0.91);
    group.add(door);
  }

  for (let i = 0; i < 4; i++) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.9), panelMat);
    panel.position.set(-2.4, 0.22, -1.3 + i * 0.55);
    panel.rotation.x = -0.5;
    panel.castShadow = true;
    group.add(panel);
  }

  return group;
}

export function buildOffice(): THREE.Group {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x8a8fc2, roughness: 0.5, flatShading: true });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xbfe0f5, roughness: 0.2, transparent: true, opacity: 0.88 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x5a5e94, roughness: 0.5, flatShading: true });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.3, 1.3), wallMat);
  body.position.y = 1.15;
  body.castShadow = body.receiveShadow = true;
  group.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.08, 1.38), roofMat);
  roof.position.y = 2.34;
  group.add(roof);

  for (let r = 0; r < 5; r++) {
    for (const side of [-0.66, 0.66]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.24, 0.02), glassMat);
      win.position.set(0, 0.35 + r * 0.4, side);
      group.add(win);
      const winSide = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.24, 1.0), glassMat);
      winSide.position.set(side, 0.35 + r * 0.4, 0);
      group.add(winSide);
    }
  }
  return group;
}

export function buildStore(): THREE.Group {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf2e2b8, roughness: 0.7, flatShading: true });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xb5651d, roughness: 0.6, flatShading: true });
  const awningMat = new THREE.MeshStandardMaterial({ color: 0xd9534f, roughness: 0.7 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 0.9), wallMat);
  body.position.y = 0.375;
  body.castShadow = body.receiveShadow = true;
  group.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.1, 1.05), roofMat);
  roof.position.y = 0.8;
  roof.castShadow = true;
  group.add(roof);
  const awning = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.4), awningMat);
  awning.position.set(0, 0.62, 0.62);
  awning.rotation.x = -0.15;
  group.add(awning);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, 0.03), new THREE.MeshStandardMaterial({ color: 0x3a2a1a }));
  door.position.set(0, 0.275, 0.46);
  group.add(door);
  return group;
}
