import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';

export class PowerUpManager {
  constructor(scene, particles, sound) { this.scene = scene; this.particles = particles; this.sound = sound; this.items = []; this.geo = new THREE.OctahedronGeometry(0.65, 0); }
  spawn(pos, forcedType = null) {
    const type = forcedType || (Math.random() < 0.6 ? 'heal' : 'weapon');
    const color = type === 'heal' ? GAME_CONFIG.COLORS.GREEN : GAME_CONFIG.COLORS.AMBER;
    const mat = new THREE.MeshBasicMaterial({ color, wireframe: false });
    const mesh = new THREE.Mesh(this.geo, mat); mesh.position.set(pos.x, 1.0, pos.z); this.scene.add(mesh);
    this.items.push({ mesh, type, color, life: 16 });
  }
  update(dt, player) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i]; item.life -= dt; item.mesh.rotation.y += 2.5 * dt;
      item.mesh.position.y = 1.0 + Math.sin(performance.now() * 0.005 + i) * 0.2;
      const dist = Math.hypot(item.mesh.position.x - player.pos.x, item.mesh.position.z - player.pos.z);
      if (dist < player.radius + 0.9) {
        this.sound.pickup(); this.particles.emit(item.mesh.position, item.color, 14, 9);
        if (item.type === 'heal') player.hp = Math.min(player.maxHp, player.hp + 30);
        else player.weaponLevel = Math.min(3, player.weaponLevel + 1);
        this.scene.remove(item.mesh); this.items.splice(i, 1);
      } else if (item.life <= 0) { this.scene.remove(item.mesh); this.items.splice(i, 1); }
    }
  }
  clear() { for (const item of this.items) this.scene.remove(item.mesh); this.items.length = 0; }
}
