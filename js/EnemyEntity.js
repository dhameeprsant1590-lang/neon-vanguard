import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';

export class EnemyEntity {
  constructor(scene, type, pos, waveScale = 1) {
    this.scene = scene;
    this.type = type; // 'stalker' | 'artillery' | 'juggernaut'
    this.pos = pos.clone();

    if (type === 'stalker') {
      this.hp = Math.round(45 * waveScale);
      this.speed = 9.2 + Math.min(4, waveScale * 0.4);
      this.radius = 0.85;
      this.scoreValue = 100;
      this.color = GAME_CONFIG.COLORS.MAGENTA;
    } else if (type === 'artillery') {
      this.hp = Math.round(65 * waveScale);
      this.speed = 5.4;
      this.radius = 1.0;
      this.scoreValue = 175;
      this.color = GAME_CONFIG.COLORS.AMBER;
    } else {
      this.hp = Math.round(180 * waveScale);
      this.speed = 4.0;
      this.radius = 1.55;
      this.scoreValue = 350;
      this.color = GAME_CONFIG.COLORS.PURPLE;
    }

    this.maxHp = this.hp;
    this.attackTimer = 1.0 + Math.random();
    this._buildMesh();
  }

  _buildMesh() {
    this.mesh = new THREE.Group();
    let geo;
    if (this.type === 'stalker') {
      geo = new THREE.OctahedronGeometry(0.95, 0);
    } else if (this.type === 'artillery') {
      geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    } else {
      geo = new THREE.DodecahedronGeometry(1.65, 0);
    }

    this.mat = new THREE.MeshStandardMaterial({
      color: 0x1a1428,
      emissive: this.color,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.8,
    });

    this.body = new THREE.Mesh(geo, this.mat);
    this.body.position.y = this.radius + 0.2;
    this.body.castShadow = true;
    this.mesh.add(this.body);

    this.mesh.position.copy(this.pos);
    this.scene.add(this.mesh);
  }

  update(dt, player, arena, projectiles, sound) {
    const toPlayer = new THREE.Vector3().subVectors(player.pos, this.pos).setY(0);
    const dist = toPlayer.length();
    const dir = dist > 0.001 ? toPlayer.clone().divideScalar(dist) : new THREE.Vector3(0, 0, 1);

    if (this.type === 'artillery') {
      if (dist > 18) {
        this.pos.addScaledVector(dir, this.speed * dt);
      } else if (dist < 11) {
        this.pos.addScaledVector(dir, -this.speed * 0.7 * dt);
      } else {
        const strafe = new THREE.Vector3(-dir.z, 0, dir.x);
        this.pos.addScaledVector(strafe, this.speed * 0.6 * dt);
      }

      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.attackTimer = 2.1;
        sound.enemyShoot();
        const origin = this.pos.clone().add(new THREE.Vector3(0, 1.2, 0));
        projectiles.spawn(origin, dir, 22, 14, this.color, false);
      }
    } else {
      this.pos.addScaledVector(dir, this.speed * dt);
      if (dist < this.radius + player.radius + 0.2 && player.pos.y < 1.6) {
        player.takeDamage(this.type === 'juggernaut' ? 22 : 12);
      }
    }

    arena.resolveCircleCollision(this.pos, this.radius);
    this.mesh.position.copy(this.pos);
    this.body.rotation.y += 2.2 * dt;
    if (this.type === 'stalker') this.body.rotation.x += 1.8 * dt;
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    this.mat.emissiveIntensity = 1.6;
    setTimeout(() => {
      if (this.mat) this.mat.emissiveIntensity = 0.65;
    }, 60);
    return this.hp <= 0;
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
      }
      
