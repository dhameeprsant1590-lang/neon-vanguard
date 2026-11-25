import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.geo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
  }

  emit(pos, colorHex, count = 12, speed = 10) {
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.geo, mat);
      mesh.position.copy(pos);
      const angle = Math.random() * Math.PI * 2;
      const up = (Math.random() - 0.2) * speed;
      const spd = (0.3 + Math.random() * 0.7) * speed;
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(Math.cos(angle) * spd, up, Math.sin(angle) * spd),
        life: 0.45 + Math.random() * 0.3,
        maxLife: 0.75,
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.vel.y -= 18 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += 6 * dt;
      p.mesh.rotation.y += 6 * dt;
      const s = Math.max(0.01, p.life / p.maxLife);
      p.mesh.scale.setScalar(s);
    }
  }

  clear() {
    for (const p of this.particles) this.scene.remove(p.mesh);
    this.particles.length = 0;
  }
}
