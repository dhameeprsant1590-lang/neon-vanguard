import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';

export class PlayerController {
  constructor(scene, sound, particles) {
    this.scene = scene; this.sound = sound; this.particles = particles;
    this.maxHp = GAME_CONFIG.PLAYER.MAX_HP; this.hp = this.maxHp;
    this.baseSpeed = GAME_CONFIG.PLAYER.BASE_SPEED; this.dashSpeed = GAME_CONFIG.PLAYER.DASH_SPEED;
    this.radius = GAME_CONFIG.PLAYER.COLLISION_RADIUS;
    this.pos = new THREE.Vector3(0, 0, 0); this.velY = 0; this.isGrounded = true;
    this.dashTimer = 0; this.dashCooldown = 0; this.dashMaxCooldown = GAME_CONFIG.PLAYER.DASH_COOLDOWN;
    this.dashDir = new THREE.Vector3(0, 0, -1); this.invulnTimer = 0; this.weaponLevel = 1;
    this.fireTimer = 0; this.aimDir = new THREE.Vector3(0, 0, -1); this._buildMesh();
  }
  _buildMesh() {
    this.mesh = new THREE.Group();
    const bodyGeo = new THREE.ConeGeometry(0.85, 2.2, 6); bodyGeo.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe0f7ff, emissive: 0x004466, roughness: 0.2, metalness: 0.85 });
    this.hull = new THREE.Mesh(bodyGeo, bodyMat); this.hull.position.y = 1.0; this.hull.castShadow = true; this.mesh.add(this.hull);
    const coreGeo = new THREE.BoxGeometry(0.7, 0.35, 1.1);
    const coreMat = new THREE.MeshBasicMaterial({ color: GAME_CONFIG.COLORS.CYAN });
    this.core = new THREE.Mesh(coreGeo, coreMat); this.core.position.set(0, 1.25, 0.25); this.mesh.add(this.core);
    const ringGeo = new THREE.RingGeometry(0.65, 0.9, 24); ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: GAME_CONFIG.COLORS.CYAN, side: THREE.DoubleSide });
    this.underRing = new THREE.Mesh(ringGeo, ringMat); this.underRing.position.y = 0.08; this.mesh.add(this.underRing);
    this.scene.add(this.mesh);
  }
  reset() {
    this.hp = this.maxHp; this.pos.set(0, 0, 8); this.velY = 0; this.isGrounded = true;
    this.dashTimer = 0; this.dashCooldown = 0; this.invulnTimer = 0; this.weaponLevel = 1;
    this.mesh.position.copy(this.pos); this.mesh.visible = true;
  }
  update(dt, input, arena, raycaster, camera, enemies, projectiles) {
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.dashCooldown > 0) this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    if (this.fireTimer > 0) this.fireTimer -= dt;
    const move2D = input.getMoveVector();
    const forward = new THREE.Vector3(-Math.sin(input.camYaw), 0, -Math.cos(input.camYaw));
    const right = new THREE.Vector3(Math.cos(input.camYaw), 0, -Math.sin(input.camYaw));
    const moveDir = new THREE.Vector3().addScaledVector(forward, -move2D.y).addScaledVector(right, move2D.x);
    if (moveDir.lengthSq() > 0.001) moveDir.normalize();
    if (input.consumeJump() && this.isGrounded) {
      this.velY = GAME_CONFIG.PLAYER.JUMP_VELOCITY; this.isGrounded = false; this.sound.jump();
      this.particles.emit(this.pos, GAME_CONFIG.COLORS.CYAN, 8, 6);
    }
    if (input.consumeDash() && this.dashCooldown <= 0 && this.dashTimer <= 0) {
      this.dashTimer = GAME_CONFIG.PLAYER.DASH_DURATION; this.dashCooldown = this.dashMaxCooldown; this.invulnTimer = 0.32;
      this.dashDir.copy(moveDir.lengthSq() > 0.01 ? moveDir : this.aimDir); this.sound.dash();
      this.particles.emit(this.pos.clone().add(new THREE.Vector3(0, 1, 0)), GAME_CONFIG.COLORS.AMBER, 14, 12);
    }
    if (this.dashTimer > 0) { this.dashTimer -= dt; this.pos.addScaledVector(this.dashDir, this.dashSpeed * dt); }
    else this.pos.addScaledVector(moveDir, this.baseSpeed * dt);
    if (!this.isGrounded) {
      this.velY += GAME_CONFIG.GRAVITY * dt; this.pos.y += this.velY * dt;
      if (this.pos.y <= 0) { this.pos.y = 0; this.velY = 0; this.isGrounded = true; }
    }
    arena.resolveCircleCollision(this.pos, this.radius);
    if (input.isTouchDevice) {
      let nearest = null; let minDist = Infinity;
      for (const e of enemies) { const d = e.pos.distanceTo(this.pos); if (d < minDist) { minDist = d; nearest = e; } }
      if (nearest) this.aimDir.subVectors(nearest.pos, this.pos).setY(0).normalize();
      else if (moveDir.lengthSq() > 0.01) this.aimDir.copy(moveDir);
    } else {
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.0);
      raycaster.setFromCamera(input.mouseNDC, camera);
      const hitPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        const toMouse = hitPoint.sub(this.pos).setY(0);
        if (toMouse.lengthSq() > 0.05) this.aimDir.copy(toMouse.normalize());
      }
    }
    this.mesh.position.copy(this.pos); this.hull.position.y = 1.0 + Math.sin(performance.now() * 0.008) * 0.08;
    this.mesh.rotation.y = Math.atan2(this.aimDir.x, this.aimDir.z);
    this.mesh.visible = this.invulnTimer <= 0 || Math.floor(this.invulnTimer * 25) % 2 === 0;
    const weaponStats = GAME_CONFIG.WEAPONS[this.weaponLevel] || GAME_CONFIG.WEAPONS[3];
    if (input.isFiring && this.fireTimer <= 0) {
      this.fireTimer = weaponStats.cooldown; this.sound.shoot(this.weaponLevel);
      const muzzle = this.pos.clone().add(new THREE.Vector3(0, 1.05, 0)).addScaledVector(this.aimDir, 1.2);
      if (this.weaponLevel === 1) projectiles.spawn(muzzle, this.aimDir, 44, 24, GAME_CONFIG.COLORS.CYAN, true);
      else if (this.weaponLevel === 2) {
        const side = new THREE.Vector3(-this.aimDir.z, 0, this.aimDir.x).multiplyScalar(0.35);
        projectiles.spawn(muzzle.clone().add(side), this.aimDir, 46, 22, GAME_CONFIG.COLORS.CYAN, true);
        projectiles.spawn(muzzle.clone().sub(side), this.aimDir, 46, 22, GAME_CONFIG.COLORS.CYAN, true);
      } else for (const offsetAngle of [-weaponStats.spread, 0, weaponStats.spread]) {
        const dir = this.aimDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), offsetAngle);
        projectiles.spawn(muzzle, dir, 48, 20, GAME_CONFIG.COLORS.GREEN, true);
      }
    }
  }
  takeDamage(amount) {
    if (this.invulnTimer > 0 || this.hp <= 0) return false;
    this.hp = Math.max(0, this.hp - amount); this.invulnTimer = 0.65; this.sound.hit();
    this.particles.emit(this.pos.clone().add(new THREE.Vector3(0, 1, 0)), GAME_CONFIG.COLORS.MAGENTA, 14, 10);
    return true;
  }
}
