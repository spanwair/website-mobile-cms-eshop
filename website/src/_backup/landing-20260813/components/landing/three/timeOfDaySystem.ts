import * as THREE from "three";
import type { CityGrid } from "./cityGrid";

export interface TimeOfDayState {
  /** 0.0 = Noon, 0.5 = Sunset, 0.75 = Midnight, 1.0 = Sunrise/Noon */
  t: number;
  sunPosition: THREE.Vector3;
  sunIntensity: number;
  ambientIntensity: number;
  skyColor: THREE.Color;
  groundColor: THREE.Color;
  fogColor: THREE.Color;
  emissiveStrength: number; // For windows
  artificialLightStrength: number; // For streetlights/car lights
}

const DAY_DURATION = 3.0;
const NIGHT_DURATION = 1.0;
const CYCLE_LENGTH = DAY_DURATION + NIGHT_DURATION;

// Czech Republic Summer Sun Approximation (Isometric Projection)
// In iso view (x=y=z), we map the sun arc to appear visually correct.
// Real sun rises East (+X approx in our grid alignment?) and sets West (-X).
// Our grid: X/Z are ground plane. Y is up.
// Let's assume +X is roughly South-East, -X is North-West for visual variety.
const SUN_RADIUS = 25;
const SUN_HEIGHT_MAX = 20;
const SUN_HEIGHT_MIN = -5;

const COLOR_DAY_SKY = new THREE.Color(0xdcefff);
const COLOR_DAY_GROUND = new THREE.Color(0xcfe6bd);
const COLOR_SUNSET_SKY = new THREE.Color(0xffdcb4);
const COLOR_SUNSET_GROUND = new THREE.Color(0xe0cda8);
const COLOR_NIGHT_SKY = new THREE.Color(0x0a0a1a);
const COLOR_NIGHT_GROUND = new THREE.Color(0x050510);
const COLOR_FOG_DAY = new THREE.Color(0xdcefff);
const COLOR_FOG_NIGHT = new THREE.Color(0x050510);

export class TimeOfDaySystem {
  private elapsed = 0;
  private state: TimeOfDayState = {
    t: 0,
    sunPosition: new THREE.Vector3(10, 16, 6),
    sunIntensity: 1.4,
    ambientIntensity: 1.1,
    skyColor: COLOR_DAY_SKY.clone(),
    groundColor: COLOR_DAY_GROUND.clone(),
    fogColor: COLOR_FOG_DAY.clone(),
    emissiveStrength: 0,
    artificialLightStrength: 0,
  };

  constructor(private reducedMotion: boolean) {}

  update(dt: number): TimeOfDayState {
    if (this.reducedMotion) return this.state;

    this.elapsed += dt;
    const cyclePos = (this.elapsed % CYCLE_LENGTH) / CYCLE_LENGTH; // 0..1
    
    // Map cyclePos to a smoother day/night transition
    // Day: 0 -> 0.75 (75% of cycle)
    // Night: 0.75 -> 1.0 (25% of cycle)
    
    let t = cyclePos; 
    // We want smooth transitions. 
    // Let's define keyframes:
    // 0.0 - 0.3: Full Day
    // 0.3 - 0.45: Sunset
    // 0.45 - 0.6: Dusk/Night Transition
    // 0.6 - 0.85: Night
    // 0.85 - 1.0: Sunrise
    
    // Simplified parametric approach for "Day is 3x longer than Night"
    // Day Phase: 0.0 to 0.75
    // Night Phase: 0.75 to 1.0
    
    let sunAngle = 0;
    let nightFactor = 0; // 0 = day, 1 = full night

    if (t < 0.6) {
      // Daytime (High sun)
      sunAngle = Math.PI * 0.2 + (t / 0.6) * Math.PI * 0.6; // Arc across sky
      nightFactor = 0;
    } else if (t < 0.75) {
      // Sunset transition
      const p = (t - 0.6) / 0.15;
      sunAngle = Math.PI * 0.8 + p * Math.PI * 0.2;
      nightFactor = p; 
    } else if (t < 0.9) {
      // Night
      sunAngle = Math.PI * 1.0 + ((t - 0.75) / 0.15) * Math.PI * 0.5; // Below horizon mostly
      nightFactor = 1.0;
    } else {
      // Sunrise transition
      const p = (t - 0.9) / 0.1;
      sunAngle = Math.PI * 1.5 + p * Math.PI * 0.5;
      nightFactor = 1.0 - p;
    }

    // Calculate Sun Position
    // Isometric friendly arc: Move in XZ plane while arcing Y
    const x = Math.cos(sunAngle) * SUN_RADIUS;
    const z = Math.sin(sunAngle) * SUN_RADIUS;
    const yRaw = Math.sin(sunAngle * 0.8) * SUN_HEIGHT_MAX; // Flattened arc
    const y = Math.max(SUN_HEIGHT_MIN, yRaw);

    this.state.sunPosition.set(x, y, z);
    
    // Intensities
    const sunYNorm = Math.max(0, y / SUN_HEIGHT_MAX);
    this.state.sunIntensity = THREE.MathUtils.lerp(0.0, 1.4, sunYNorm);
    this.state.ambientIntensity = THREE.MathUtils.lerp(0.15, 1.1, Math.max(0.2, sunYNorm));
    
    // Colors
    if (nightFactor <= 0) {
      this.state.skyColor.copy(COLOR_DAY_SKY);
      this.state.groundColor.copy(COLOR_DAY_GROUND);
      this.state.fogColor.copy(COLOR_FOG_DAY);
    } else if (nightFactor >= 1) {
      this.state.skyColor.copy(COLOR_NIGHT_SKY);
      this.state.groundColor.copy(COLOR_NIGHT_GROUND);
      this.state.fogColor.copy(COLOR_FOG_NIGHT);
    } else {
      this.state.skyColor.copy(COLOR_DAY_SKY).lerp(COLOR_SUNSET_SKY, nightFactor).lerp(COLOR_NIGHT_SKY, Math.max(0, nightFactor - 0.5) * 2);
      this.state.groundColor.copy(COLOR_DAY_GROUND).lerp(COLOR_SUNSET_GROUND, nightFactor).lerp(COLOR_NIGHT_GROUND, Math.max(0, nightFactor - 0.5) * 2);
      this.state.fogColor.copy(COLOR_FOG_DAY).lerp(COLOR_NIGHT_SKY, nightFactor);
    }

    // Artificial Lights & Windows
    // Turn on gradually as night falls
    const lightCurve = THREE.MathUtils.smoothstep(nightFactor, 0.2, 0.6);
    this.state.emissiveStrength = lightCurve * 1.8;
    this.state.artificialLightStrength = lightCurve * 1.5;

    this.state.t = t;
    return this.state;
  }
}

export interface Streetlight {
  group: THREE.Group;
  light: THREE.PointLight;
  bulbMat: THREE.MeshStandardMaterial;
}

/**
 * Creates streetlights along pavement edges.
 * Height ~ 3x Person (Person ~0.58 units scaled? No, PERSON_SCALE=0.58 applied to group. Raw person height ~0.6. Scaled ~0.35? 
 * Actually buildPerson returns group scaled by 0.58. Raw geometry height ~0.6. So visual height ~0.35.
 * Wait, building heights are ~1-2 units. Person is tiny. 
 * Requirement: "Height <= building height, approx 3x Person".
 * If Person visual height is ~0.35, 3x is ~1.05. Buildings are >1.0. So ~1.0-1.2 is safe.
 */
export function createStreetlights(grid: CityGrid, scene: THREE.Scene): Streetlight[] {
  const lights: Streetlight[] = [];
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
  
  // Helper to place a single light
  const placeLight = (x: number, z: number, rotY: number) => {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    // Pole
    const poleH = 1.1;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, poleH, 6), poleMat);
    pole.position.y = poleH / 2;
    pole.castShadow = true;
    group.add(pole);

    // Arm
    const armLen = 0.3;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, armLen), poleMat);
    arm.position.set(0, poleH - 0.05, armLen / 2);
    group.add(arm);

    // Bulb Housing
    const bulbMat = new THREE.MeshStandardMaterial({ 
      color: 0xfff5e0, 
      emissive: 0xfff5e0, 
      emissiveIntensity: 0,
      roughness: 0.3 
    });
    const housing = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.1, 8), bulbMat);
    housing.rotation.x = Math.PI; // Point down
    housing.position.set(0, poleH - 0.1, armLen);
    group.add(housing);

    // Actual Light Source
    const pl = new THREE.PointLight(0xffeebb, 0, 6, 2);
    pl.position.set(0, poleH - 0.15, armLen);
    pl.castShadow = false; // Too expensive for many lights
    group.add(pl);

    scene.add(group);
    lights.push({ group, light: pl, bulbMat });
  };

  // Place along walk lanes but offset slightly towards edge
  // Walk lanes are defined in cityGrid. They run along roads.
  // We can sample points along them or just use grid offsets.
  // Simplest robust placement: Iterate road offsets and place at intervals.
  
  const spacing = 3.5;
  const half = 7.5; // From fulfillmentScene constants, ideally passed in
  
  // Along Z-oriented streets (run along X axis)
  for (const zOff of [-3.2, 2.6]) { // Hardcoded from fulfillmentScene for now, or derive from grid bounds
     // Pavement is at zOff +/- (roadWidth/2 + walkWidth/2)
     // roadWidth=0.5, walkWidth=0.22. Offset = 0.36
     const paveZ_N = zOff + 0.36;
     const paveZ_S = zOff - 0.36;
     
     for (let x = -half + 1; x < half; x += spacing) {
        // North side, facing South (+Z rotation? No, arm extends +Z local. If we want it over pavement...)
        // Pavement is AT paveZ. Road is center.
        // If placing ON pavement edge near road:
        // North pavement: place at paveZ_N, arm should reach towards road? Or away?
        // Usually streetlights are on sidewalk edge shining on road/sidewalk.
        // Let's orient arm towards road center (zOff).
        
        placeLight(x, paveZ_N, Math.PI); // Face -Z (towards road)
        placeLight(x, paveZ_S, 0);      // Face +Z (towards road)
     }
  }

  // Along X-oriented streets (run along Z axis)
  for (const xOff of [-5.0, 4.2]) {
     const paveX_E = xOff + 0.36;
     const paveX_W = xOff - 0.36;
     
     for (let z = -half + 1; z < half; z += spacing) {
        placeLight(paveX_E, z, -Math.PI / 2); // Face -X
        placeLight(paveX_W, z, Math.PI / 2);  // Face +X
     }
  }

  return lights;
}
