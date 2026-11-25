import { GAME_CONFIG } from './config.js';

export class HudController {
  constructor() {
    this.hpBar = document.getElementById('hp-bar');
    this.hpText = document.getElementById('hp-text');
    this.dashBar = document.getElementById('dash-bar');
    this.dashText = document.getElementById('dash-text');
    this.weaponBadge = document.getElementById('weapon-badge');
    this.waveText = document.getElementById('wave-text');
    this.scoreText = document.getElementById('score-text');
    this.waveBanner = document.getElementById('wave-banner');
    this.radarCanvas = document.getElementById('radar-canvas');
    this.radarCtx = this.radarCanvas.getContext('2d');
  }

  announceWave(wave) {
    this.waveBanner.textContent = `WAVE ${String(wave).padStart(2, '0')} INCOMING`;
    this.waveBanner.classList.add('active');
    setTimeout(() => this.waveBanner.classList.remove('active'), 2200);
  }

  update(player, enemies, powerups, wave, score, arenaRadius) {
    const hpPct = (player.hp / player.maxHp) * 100;
    this.hpBar.style.width = `${hpPct}%`;
    this.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;

    const dashReadyRatio = 1 - player.dashCooldown / player.dashMaxCooldown;
    this.dashBar.style.width = `${dashReadyRatio * 100}%`;
    this.dashText.textContent = dashReadyRatio >= 0.99 ? 'READY' : 'RECHARGING';

    const weaponInfo = GAME_CONFIG.WEAPONS[player.weaponLevel] || GAME_CONFIG.WEAPONS[3];
    this.weaponBadge.textContent = `WEAPON: ${weaponInfo.name}`;
    this.waveText.textContent = `WAVE ${String(wave).padStart(2, '0')}`;
    this.scoreText.textContent = String(score).padStart(6, '0');

    this._drawRadar(player, enemies, powerups, arenaRadius);
  }

  _drawRadar(player, enemies, powerups, arenaRadius) {
    const ctx = this.radarCtx;
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = (w * 0.45) / arenaRadius;

    ctx.clearRect(0, 0, w, h);

    // Radar Crosshair & Rings
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.22, 0, Math.PI * 2);
    ctx.arc(cx, cy, w * 0.44, 0, Math.PI * 2);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();

    // Powerups
    for (const p of powerups) {
      ctx.fillStyle = p.type === 'heal' ? '#00ff88' : '#ffbe0b';
      ctx.fillRect(
        cx + p.mesh.position.x * scale - 2.5,
        cy + p.mesh.position.z * scale - 2.5,
        5,
        5
      );
    }

    // Enemies
    for (const e of enemies) {
      ctx.fillStyle = e.type === 'juggernaut' ? '#d946ef' : '#ff007f';
      ctx.beginPath();
      ctx.arc(
        cx + e.pos.x * scale,
        cy + e.pos.z * scale,
        e.type === 'juggernaut' ? 4.5 : 3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Player
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.arc(cx + player.pos.x * scale, cy + player.pos.z * scale, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  }
