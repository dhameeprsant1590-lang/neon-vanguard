import * as THREE from 'three';

export class ProjectileManager {
  constructor(scene, particles) { this.scene = scene; this.particles = particles; this.list = []; this.geo = new THREE.SphereGeometry(0.24, 8, 8); }
  spawn(pos, dir, speed, damage, colorHex, isPlayer) {
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    const mesh = new THREE.Mesh(this.geo, mat); mesh.position.copy(pos);
    if (isPlayer) mesh.scale.set(0.8, 0.8, 2.2);
    mesh.lookAt(pos.clone().add(dir)); this.scene.add(mesh);
    this.list.push({ mesh, vel: dir.clone().normalize().multiplyScalar(speed), damage, colorHex, isPlayer, life: 2.0 });
  }
  update(dt, arena, player, enemies, onEnemyKilled) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i]; b.life -= dt; b.mesh.position.addScaledVector(b.vel, dt);
      let remove = b.life <= 0;
      if (!remove) {
        if (Math.hypot(b.mesh.position.x, b.mesh.position.z) >= arena.radius) { remove = true; this.particles.emit(b.mesh.position, b.colorHex, 5, 5); }
        else for (const p of arena.pillars) {
          if (Math.hypot(b.mesh.position.x - p.pos.x, b.mesh.position.z - p.pos.z) < p.radius + 0.2) {
            remove = true; this.particles.emit(b.mesh.position, b.colorHex, 5, 5); break;
          }
        }
      }
      if (!remove && b.isPlayer) {
        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j];
          if (Math.hypot(b.mesh.position.x - e.pos.x, b.mesh.position.z - e.pos.z) < e.radius + 0.35) {
            remove = true; this.particles.emit(b.mesh.position, b.colorHex, 6, 7);
            const killed = e.takeDamage(b.damage); if (killed) onEnemyKilled(e, j); break;
          }
        }
      } else if (!remove && !b.isPlayer) {
        const distToPlayer = Math.hypot(b.mesh.position.x - player.pos.x, b.mesh.position.z - player.pos.z);
        if (distToPlayer < player.radius + 0.25 && player.pos.y < 1.8) { remove = true; player.takeDamage(b.damage); }
      }
      if (remove) { this.scene.remove(b.mesh); this.list.splice(i, 1); }
    }
  }
  clear() { for (const b of this.list) this.scene.remove(b.mesh); this.list.length = 0; }
}
