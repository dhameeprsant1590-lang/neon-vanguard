import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';

export class ArenaEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.radius = GAME_CONFIG.ARENA_RADIUS;
    this.pillars = [];
    this.laserSweepers = [];
    this._build();
  }

  _build() {
    // Ground Plane
    const floorGeo = new THREE.CircleGeometry(this.radius, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0b1021,
      roughness: 0.35,
      metalness: 0.65,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Neon Grid Helper
    const grid = new THREE.GridHelper(this.radius * 2, 42, 0x00f3ff, 0x162244);
    grid.position.y = 0.02;
    this.scene.add(grid);

    // Outer Energy Perimeter Ring
    const ringGeo = new THREE.TorusGeometry(this.radius, 0.35, 16, 80);
    const ringMat = new THREE.MeshBasicMaterial({ color: GAME_CONFIG.COLORS.CYAN });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.35;
    this.scene.add(ring);

    // Tactical Cover Pillars
    const pillarPositions = [
      new THREE.Vector3(-15, 0, -15),
      new THREE.Vector3(15, 0, -15),
      new THREE.Vector3(-15, 0, 15),
      new THREE.Vector3(15, 0, 15),
      new THREE.Vector3(0, 0, -24),
      new THREE.Vector3(0, 0, 24),
    ];

    const pillarGeo = new THREE.CylinderGeometry(1.7, 1.9, 5.5, 8);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x151e38,
      emissive: 0x06162d,
      roughness: 0.3,
      metalness: 0.8,
    });
    const trimGeo = new THREE.CylinderGeometry(1.95, 1.95, 0.25, 8);
    const trimMat = new THREE.MeshBasicMaterial({ color: GAME_CONFIG.COLORS.CYAN });

    pillarPositions.forEach((pos) => {
      const group = new THREE.Group();
      group.position.copy(pos);

      const body = new THREE.Mesh(pillarGeo, pillarMat);
      body.position.y = 2.75;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      const trimBottom = new THREE.Mesh(trimGeo, trimMat);
      trimBottom.position.y = 0.15;
      group.add(trimBottom);

      const trimTop = new THREE.Mesh(trimGeo, trimMat);
      trimTop.position.y = 5.4;
      group.add(trimTop);

      this.scene.add(group);
      this.pillars.push({ pos, radius: 1.9 });
    });

    // Rotating Hazard Laser Sweepers (Jumpable Obstacle Runner Mechanic)
    const sweeperConfigs = [
      { radius: 22, speed: 0.65, angle: 0 },
      { radius: 34, speed: -0.45, angle: Math.PI },
    ];

    sweeperConfigs.forEach((cfg) => {
      const pivot = new THREE.Group();
      const beamGeo = new THREE.BoxGeometry(cfg.radius, 0.22, 0.22);
      const beamMat = new THREE.MeshBasicMaterial({ color: GAME_CONFIG.COLORS.MAGENTA });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(cfg.radius / 2, 0.65, 0);
      pivot.add(beam);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.4, 1.4, 16),
        new THREE.MeshStandardMaterial({ color: 0x222942, emissive: 0x33001b })
      );
      hub.position.y = 0.7;
      pivot.add(hub);

      pivot.rotation.y = cfg.angle;
      this.scene.add(pivot);
      this.laserSweepers.push({ pivot, length: cfg.radius, speed: cfg.speed });
    });
  }

  update(dt) {
    for (const s of this.laserSweepers) {
      s.pivot.rotation.y += s.speed * dt;
    }
  }

  resolveCircleCollision(pos, entityRadius) {
    // Keep inside arena wall
    const distFromCenter = Math.hypot(pos.x, pos.z);
    const maxDist = this.radius - entityRadius;
    if (distFromCenter > maxDist) {
      const scale = maxDist / distFromCenter;
      pos.x *= scale;
      pos.z *= scale;
    }

    // Push out of pillars
    for (const p of this.pillars) {
      const dx = pos.x - p.pos.x;
      const dz = pos.z - p.pos.z;
      const d = Math.hypot(dx, dz);
      const minD = p.radius + entityRadius;
      if (d < minD && d > 0.0001) {
        const push = (minD - d) / d;
        pos.x += dx * push;
        pos.z += dz * push;
      }
    }
  }

  checkLaserHit(playerPos, playerY) {
    if (playerY > 1.05) return false; // Player jumped over the low-altitude laser
    for (const s of this.laserSweepers) {
      const angle = s.pivot.rotation.y;
      const dirX = Math.cos(angle);
      const dirZ = -Math.sin(angle);
      const proj = playerPos.x * dirX + playerPos.z * dirZ;
      if (proj > 1.2 && proj < s.length) {
        const perp = Math.abs(-playerPos.x * dirZ + playerPos.z * dirX);
        if (perp < 0.75) return true;
      }
    }
    return false;
  }
  }
      
