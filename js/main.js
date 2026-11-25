import * as THREE from 'three';
import { GAME_CONFIG, CURRENCY, LEVELING } from './config.js';
import { SoundEngine } from './SoundEngine.js';
import { InputManager } from './InputManager.js';
import { ParticleSystem } from './ParticleSystem.js';
import { ArenaEnvironment } from './ArenaEnvironment.js';
import { PlayerController } from './PlayerController.js';
import { ProjectileManager } from './ProjectileManager.js';
import { EnemyEntity } from './EnemyEntity.js';
import { PowerUpManager } from './PowerUpManager.js';
import { HudController } from './HudController.js';
import { ProgressionManager } from './ProgressionManager.js';

class GameEngine {
  constructor() {
    this.container = document.getElementById('game-container');
    this.sound = new SoundEngine(); this.hud = new HudController();
    this.progression = new ProgressionManager();
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x070913); this.scene.fog = new THREE.FogExp2(0x070913, 0.014);
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight); this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true; this.container.appendChild(this.renderer.domElement);
    this._setupLights(); this.input = new InputManager(this.renderer.domElement);
    this.particles = new ParticleSystem(this.scene); this.arena = new ArenaEnvironment(this.scene);
    this.player = new PlayerController(this.scene, this.sound, this.particles);
    this.projectiles = new ProjectileManager(this.scene, this.particles);
    this.powerups = new PowerUpManager(this.scene, this.particles, this.sound);
    this.raycaster = new THREE.Raycaster(); this.enemies = []; this.wave = 1; this.score = 0;
    this.state = 'MENU'; this.screenShake = 0; this.lastTime = performance.now();
    this._syncProgressionHud();
    this._bindUI(); window.addEventListener('resize', () => this._onResize()); requestAnimationFrame((t) => this._loop(t));
  }
  _setupLights() {
    this.scene.add(new THREE.AmbientLight(0x3a5078, 1.4));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8); dirLight.position.set(22, 38, 20); dirLight.castShadow = true; dirLight.shadow.mapSize.set(1024, 1024); this.scene.add(dirLight);
    const rimLight = new THREE.PointLight(GAME_CONFIG.COLORS.CYAN, 3, 60); rimLight.position.set(0, 12, 0); this.scene.add(rimLight);
  }
  _syncProgressionHud() {
    if (typeof this.hud.updateProgression === 'function') {
      this.hud.updateProgression({
        level: this.progression.level,
        xp: this.progression.xp,
        xpToNext: this.progression.xpToNext,
        credits: this.progression.credits,
      });
    }
  }
  _bindUI() { document.getElementById('start-btn').addEventListener('click', () => { this.sound.init(); this.startNewGame(); }); }
  startNewGame() {
    this.enemies.forEach((e) => e.destroy()); this.enemies.length = 0; this.projectiles.clear(); this.powerups.clear(); this.particles.clear();
    this.player.reset(); this.wave = 1; this.score = 0; this.state = 'PLAYING';
    this._syncProgressionHud();
    document.getElementById('overlay-screen').classList.add('hidden'); document.getElementById('hud').classList.remove('hidden'); this._spawnWave(this.wave);
  }
  _spawnWave(waveNum) {
    this.hud.announceWave(waveNum); const totalEnemies = 4 + waveNum * 2; const scale = 1 + (waveNum - 1) * 0.14;
    for (let i = 0; i < totalEnemies; i++) {
      const angle = (i / totalEnemies) * Math.PI * 2 + Math.random() * 0.4;
      const dist = this.arena.radius - 4; const pos = new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
      let type = 'stalker'; if (waveNum >= 2 && i % 3 === 1) type = 'artillery'; if (waveNum >= 3 && i % 5 === 4) type = 'juggernaut';
      this.enemies.push(new EnemyEntity(this.scene, type, pos, scale));
    }
  }
  _onEnemyKilled(enemy, index) {
    this.sound.explosion(); this.screenShake = Math.min(0.65, this.screenShake + 0.25);
    this.particles.emit(enemy.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), enemy.color, 18, 14);
    const pointsEarned = enemy.scoreValue || 0;
    this.score += pointsEarned;

    const enemyType = enemy.type || 'stalker';
    const creditGain = CURRENCY.ENEMY_REWARD[enemyType] ?? 15;
    const xpGain = Math.max(10, Math.round(pointsEarned * LEVELING.XP_PER_SCORE_FACTOR));
    this.progression.addCredits(creditGain);
    const { leveledUp, level } = this.progression.addXp(xpGain);
    if (leveledUp) {
      this.player.maxHp = 100 + this.progression.getBonusMaxHp();
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
      if (typeof this.hud.showBanner === 'function') {
        this.hud.showBanner(`LEVEL ${String(level).padStart(2, '0')} UNLOCKED`);
      }
    }
    this._syncProgressionHud();

    if (enemy.type === 'juggernaut' || Math.random() < 0.24) this.powerups.spawn(enemy.pos, enemy.type === 'juggernaut' ? 'weapon' : null);
    enemy.destroy(); this.enemies.splice(index, 1);
    if (this.enemies.length === 0) {
      this.progression.addCredits(CURRENCY.WAVE_CLEAR_BONUS);
      this._syncProgressionHud();
      this.wave++;
      this._spawnWave(this.wave);
    }
  }
  _triggerGameOver() {
    this.state = 'GAMEOVER'; this.sound.explosion(); document.getElementById('hud').classList.add('hidden');
    document.getElementById('overlay-screen').classList.remove('hidden'); document.getElementById('panel-subtitle').textContent = 'SYSTEM CRITICAL // HULL BREACHED';
    document.getElementById('panel-title').textContent = 'COMBAT TERMINATED'; document.getElementById('final-stats').classList.remove('hidden');
    document.getElementById('final-score').textContent = this.score; document.getElementById('final-wave').textContent = this.wave;
    document.getElementById('start-btn').textContent = 'REDEPLOY VANGUARD';
  }
  _updateCamera(dt) {
    const camDist = 24; const camHeight = 22;
    const targetX = this.player.pos.x + Math.sin(this.input.camYaw) * camDist;
    const targetZ = this.player.pos.z + Math.cos(this.input.camYaw) * camDist;
    this.camera.position.lerp(new THREE.Vector3(targetX, camHeight, targetZ), 1 - Math.exp(-8 * dt));
    if (this.screenShake > 0) { this.screenShake = Math.max(0, this.screenShake - dt * 1.8); this.camera.position.x += (Math.random() - 0.5) * this.screenShake; this.camera.position.z += (Math.random() - 0.5) * this.screenShake; }
    this.camera.lookAt(this.player.pos.x, 1.0, this.player.pos.z);
  }
  _loop(now) {
    requestAnimationFrame((t) => this._loop(t)); const dt = Math.min(0.05, (now - this.lastTime) / 1000); this.lastTime = now;
    this.arena.update(dt); this.particles.update(dt);
    if (this.state === 'PLAYING') {
      this.player.update(dt, this.input, this.arena, this.raycaster, this.camera, this.enemies, this.projectiles);
      if (this.arena.checkLaserHit(this.player.pos, this.player.pos.y) && this.player.takeDamage(18)) this.screenShake = 0.4;
      for (const e of this.enemies) e.update(dt, this.player, this.arena, this.projectiles, this.sound);
      this.projectiles.update(dt, this.arena, this.player, this.enemies, (enemy, idx) => this._onEnemyKilled(enemy, idx));
      this.powerups.update(dt, this.player); this.hud.update(this.player, this.enemies, this.powerups.items, this.wave, this.score, this.arena.radius);
      if (this.player.hp <= 0) this._triggerGameOver();
    } else this.input.camYaw += 0.15 * dt;
    this._updateCamera(dt); this.renderer.render(this.scene, this.camera);
  }
  _onResize() { this.camera.aspect = window.innerWidth / window.innerHeight; this.camera.updateProjectionMatrix(); this.renderer.setSize(window.innerWidth, window.innerHeight); }
}
window.addEventListener('DOMContentLoaded', () => { new GameEngine(); });
  
