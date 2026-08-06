import * as THREE from "three";
import { createBaseScene } from "./sceneUtils";
import { buildCar, buildTruck, type Car } from "./actors/car";
import { buildPerson, type Person } from "./actors/person";
import { buildCityGrid } from "./cityGrid";
import { placeCampusAndNature } from "./fulfillmentDecor";
import { laneSample, loopSample, driveAlong, walkAlong, orient, wrapLaneSample, type Lane, type Loop } from "./pathSample";
import { TimeOfDaySystem, createStreetlights, type Streetlight } from "./timeOfDaySystem";

const HALF = 7.5;
// Only the outer 2 streets per axis — no street cuts through the middle of
// the building block itself, so the whole campus reads as one uninterrupted
// site rather than being split by a road.
const X_OFFSETS = [-5.0, 4.2];
const Z_OFFSETS = [-3.2, 2.6];
const ROAD_SPAN = 34;

export function mountFulfillmentScene(canvas: HTMLCanvasElement) {
  const base = createBaseScene(canvas);
  const { scene, camera, isMobile, reducedMotion } = base;

  // True isometric: equal x/y/z camera offset treats every axis the same —
  // no perspective foreshortening, unlike a bird's-eye photo where things
  // shrink toward the horizon.
  camera.position.set(22, 22, 22);
  camera.lookAt(0, 0, 0);
  base.setViewSize(5.5);

  const fog = new THREE.Fog(0xdcefff, 40, 64);
  scene.fog = fog;
  
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcfe6bd, 1.1);
  scene.add(hemiLight);
  
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

  // Initialize Time of Day System
  const todSystem = new TimeOfDaySystem(reducedMotion);
  const streetlights = createStreetlights(grid, scene);

  // Collect all window meshes for night illumination
  const windowMeshes: THREE.Mesh[] = [];
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
      // Identify windows by their emissive color (set in buildings.ts) or specific geometry traits
      // In buildings.ts, glowMat has emissive 0xffd166
      if (obj.material.emissive && obj.material.emissive.getHex() === 0xffd166) {
        windowMeshes.push(obj);
      }
    }
  });

  // Significantly increased speed profile for perceptibly faster traversal
  const CAR_BASE_SPEED = 14.0;
  const CAR_SPEED_VAR = 4.5;
  const TRUCK_SPEED_FACTOR = 0.85;
  
  const carLaneCycle = 2 * ROAD_SPAN;
  const carsPerLane = Math.ceil((isMobile ? 12 : 24) / grid.carLanes.length);
  const laneSlot = new Map<number, number>();
  const carCount = isMobile ? 12 : 24;
  const cars: (Car & { lane: Lane; dist: number; brake: number; id: number })[] = [];
  for (let i = 0; i < carCount; i++) {
    const laneIdx = i % grid.carLanes.length;
    const lane = grid.carLanes[laneIdx];
    const slot = laneSlot.get(laneIdx) ?? 0;
    laneSlot.set(laneIdx, slot + 1);
    const slotSpacing = carLaneCycle / carsPerLane;
    const phase = slot * slotSpacing + Math.random() * slotSpacing * 0.4;
    
    const speed = CAR_BASE_SPEED + Math.random() * CAR_SPEED_VAR;
    const isTruck = i % 3 === 0;
    const car = isTruck ? buildTruck(speed * TRUCK_SPEED_FACTOR, phase) : buildCar(speed, phase);
    cars.push({ ...car, lane, dist: phase, brake: 1, id: i });
    scene.add(car.group);
  }

  // Loop cars also get a major speed bump to match straight-line traffic
  const LOOP_CAR_BASE_SPEED = 12.0;
  const LOOP_CAR_SPEED_VAR = 3.5;
  
  const loopCars: (Car & { loop: Loop; dist: number; brake: number; id: number })[] = [];
  if (block) {
    const loopCarCount = isMobile ? 3 : 6;
    for (let i = 0; i < loopCarCount; i++) {
      const speed = LOOP_CAR_BASE_SPEED + Math.random() * LOOP_CAR_SPEED_VAR;
      const car = i % 2 === 0 ? buildTruck(speed * TRUCK_SPEED_FACTOR, Math.random() * 20) : buildCar(speed, Math.random() * 20);
      loopCars.push({ ...car, loop: block.carLoop, dist: Math.random() * 20, brake: 1, id: 1000 + i });
      scene.add(car.group);
    }
  }

  // Pedestrians on the block's own sidewalk loop
  const people: (Person & { loop: Loop })[] = [];
  for (const b of grid.interiorCells) {
    const peoplePerBlock = isMobile ? 3 : 6;
    for (let i = 0; i < peoplePerBlock; i++) {
      const speed = 0.7 + Math.random() * 0.25;
      const person = buildPerson(speed, i * 3.5 + Math.random() * 2);
      people.push({ ...person, loop: b.loop });
      scene.add(person.group);
    }
  }

  // More pedestrians on the *other* roads
  const roadWalkerCount = isMobile ? 4 : 12;
  const roadWalkers: (Person & { lane: Lane })[] = [];
  for (let i = 0; i < roadWalkerCount; i++) {
    const lane = grid.walkLanes[i % grid.walkLanes.length];
    const speed = 0.7 + Math.random() * 0.25;
    const person = buildPerson(speed, Math.random() * 12);
    roadWalkers.push({ ...person, lane });
    scene.add(person.group);
  }

  // Tightened follow parameters to prevent junction stops:
  // Reduced FOLLOW_RADIUS ensures cars only detect others in immediate vicinity
  // on the SAME path, ignoring cross-traffic entirely.
  const FOLLOW_RADIUS = 4.5;         
  const FOLLOW_SAFE = 2.2;           
  const FOLLOW_STOP = 0.6;           
  const FOLLOW_HARD_MIN = 0.5;       
  
  const relVec = new THREE.Vector3();
  let prevElapsed = 0;

  base.start((elapsed) => {
    const dt = Math.min(0.1, Math.max(0, elapsed - prevElapsed));
    prevElapsed = elapsed;

    // Update Time of Day
    const tod = todSystem.update(dt);
    
    // Apply ToD to Scene
    sun.position.copy(tod.sunPosition);
    sun.intensity = tod.sunIntensity;
    hemiLight.intensity = tod.ambientIntensity;
    hemiLight.color.copy(tod.skyColor);
    hemiLight.groundColor.copy(tod.groundColor);
    fog.color.copy(tod.fogColor);
    scene.background = tod.fogColor; // Match background to fog for seamless blend

    // Update Windows
    for (const win of windowMeshes) {
      const mat = win.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = tod.emissiveStrength;
    }

    // Update Streetlights
    for (const sl of streetlights) {
      sl.light.intensity = tod.artificialLightStrength;
      sl.bulbMat.emissiveIntensity = tod.artificialLightStrength > 0.1 ? 2.0 : 0;
    }

    // Combine straight-lane cars and loop cars into a single simulation list
    type LaneCar = typeof cars[number];
    type LoopCar = typeof loopCars[number];
    type SimCar = LaneCar | LoopCar;
    const allCars: SimCar[] = [...cars, ...loopCars];

    // Safety check: if no cars, skip physics but keep animating other entities
    if (allCars.length === 0) {
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
        return;
    }

    const states = allCars.map((car) => {
      const sample = 'lane' in car 
        ? wrapLaneSample(car.lane, car.dist) 
        : loopSample(car.loop, car.dist);
        
      // Guard against NaN positions breaking the entire scene
      if (!isFinite(sample.position.x) || !isFinite(sample.position.z)) {
         return { car, pos: new THREE.Vector3(), dir: new THREE.Vector3(1,0,0) };
      }
      return { 
        car, 
        pos: sample.position, 
        dir: sample.dir 
      };
    });

    // Phase 1: Compute desired brake factors based ONLY on same-path proximity
    // Cross-traffic is completely ignored to prevent junction stops
    for (let i = 0; i < states.length; i++) {
      const me = states[i];
      let minBrakeDist = Infinity;

      for (let j = 0; j < states.length; j++) {
        if (i === j) continue;
        const other = states[j];
        
        // Strict same-path identity check: prevents braking for cross-traffic at junctions
        const samePath = ('lane' in me.car && 'lane' in other.car && me.car.lane === other.car.lane) ||
                         ('loop' in me.car && 'loop' in other.car && me.car.loop === other.car.loop);
        
        if (!samePath) continue;
        
        relVec.subVectors(other.pos, me.pos);
        const distSq = relVec.lengthSq();
        
        if (distSq <= FOLLOW_RADIUS * FOLLOW_RADIUS) {
          const dist = Math.sqrt(distSq);
          const ahead = relVec.dot(me.dir);
          
          // Only brake for cars actually in front of us
          if (ahead > 0) {
            const gap = Math.max(0, ahead - 0.4); 
            if (gap < minBrakeDist) {
              minBrakeDist = gap;
            }
          }
        }
      }
      
      // Smooth braking response with faster gain for tighter packing
      let target = 1;
      if (minBrakeDist < FOLLOW_SAFE) {
         if (minBrakeDist <= FOLLOW_STOP) target = 0;
         else target = (minBrakeDist - FOLLOW_STOP) / (FOLLOW_SAFE - FOLLOW_STOP);
      }
      
      // Fast gain for responsive braking, preventing overlap buildup
      const gain = dt * 20; 
      me.car.brake += (target - me.car.brake) * Math.min(1, gain);
    }

    // Phase 2: Integrate positions
    for (const state of states) {
      state.car.dist += dt * state.car.speed * state.car.brake;
    }

    // Phase 3: Strict non-overlap enforcement via positional clamping
    // Prevents tunneling or overlapping after integration within the same lane
    for (let pass = 0; pass < 3; pass++) {
      const postStates = states.map((s) => {
         const sample = 'lane' in s.car
           ? wrapLaneSample(s.car.lane, s.car.dist)
           : loopSample(s.car.loop, s.car.dist);
         return { ...s, postPos: sample.position, postDir: sample.dir };
      });
      
      // Sort by distance traveled so we process front-to-back per lane/group
      const sortedIndices = postStates
        .map((_, i) => i)
        .sort((a, b) => postStates[b].car.dist - postStates[a].car.dist);
      
      for (const idx of sortedIndices) {
        const me = postStates[idx];
        for (const otherIdx of sortedIndices) {
          if (idx === otherIdx) continue;
          const other = postStates[otherIdx];
          
          const sameLane = 'lane' in me.car && 'lane' in other.car && me.car.lane === other.car.lane;
          const sameLoop = 'loop' in me.car && 'loop' in other.car && me.car.loop === other.car.loop;
          
          if (!sameLane && !sameLoop) continue;
          
          relVec.subVectors(me.postPos, other.postPos);
          const dist = relVec.length();
          const ahead = relVec.dot(other.postDir);
          
          // If I'm behind another car and too close, push myself back
          if (ahead > 0 && dist < FOLLOW_HARD_MIN) {
            const pushBack = FOLLOW_HARD_MIN - dist;
            me.car.dist -= pushBack;
            // Re-sample after adjustment for next iteration
            const corrected = 'lane' in me.car
              ? wrapLaneSample(me.car.lane, me.car.dist)
              : loopSample(me.car.loop, me.car.dist);
            me.postPos.copy(corrected.position);
            me.postDir.copy(corrected.dir);
          }
        }
      }
    }

    // Phase 4: Apply final transforms & Lighting Updates
    for (const state of states) {
      const final = 'lane' in state.car
        ? wrapLaneSample(state.car.lane, state.car.dist)
        : loopSample(state.car.loop, state.car.dist);
      driveAlong(state.car, final.position, final.dir, state.car.dist);
      
      // Update Vehicle Lights
      const headInt = tod.artificialLightStrength > 0.1 ? 2.0 : 0;
      const tailInt = tod.artificialLightStrength > 0.1 ? 1.5 : 0;
      
      // Note: brake lights could be brighter when braking, but request specified "active during night"
      // Adding brake logic: if brake < 0.5, tails brighter
      const braking = state.car.brake < 0.8;
      const finalTailInt = braking ? Math.max(tailInt, 2.5) : tailInt;

      for (const hl of state.car.headlights) {
        (hl.material as THREE.MeshStandardMaterial).emissiveIntensity = headInt;
      }
      for (const tl of state.car.taillights) {
        (tl.material as THREE.MeshStandardMaterial).emissiveIntensity = finalTailInt;
      }
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
