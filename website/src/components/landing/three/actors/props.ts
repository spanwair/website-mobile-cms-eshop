import * as THREE from "three";

export function buildTree(): THREE.Group {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.07, 0.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.95 }),
  );
  trunk.position.y = 0.2;
  trunk.castShadow = true;
  group.add(trunk);

  // Mix in warm rust/amber trees alongside green ones for an autumnal look
  // instead of a uniform mono-green tree line.
  const foliagePalette = [0x3f9142, 0x2e7d32, 0x4c8c3c, 0xd97706, 0xb45309, 0xc2410c];
  const foliageColor = foliagePalette[Math.floor(Math.random() * foliagePalette.length)];
  const foliageMat = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.85, flatShading: true });
  for (let i = 0; i < 3; i++) {
    const scale = 0.26 - i * 0.05;
    const foliage = new THREE.Mesh(new THREE.SphereGeometry(scale, 8, 7), foliageMat);
    foliage.position.y = 0.42 + i * 0.16;
    foliage.castShadow = true;
    group.add(foliage);
  }
  return group;
}

export function buildGround(size: number, color: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({ color, roughness: 1 }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

