import { CURRENCY, LEVELING } from './config.js';

export class ProgressionManager {
  constructor() {
    this.credits = this._loadCredits();
    const saved = this._loadProgression();
    this.level = saved.level;
    this.xp = saved.xp;
    this.xpToNext = this._calcXpRequired(this.level);
  }

  _loadCredits() {
    try {
      const raw = localStorage.getItem(CURRENCY.STORAGE_KEY);
      const parsed = Number.parseInt(raw ?? '0', 10);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    } catch {
      return 0;
    }
  }

  _saveCredits() {
    try {
      localStorage.setItem(CURRENCY.STORAGE_KEY, String(this.credits));
    } catch {
      // Ignore storage quota or private-mode errors
    }
  }

  _calcXpRequired(level) {
    return Math.round(
      LEVELING.BASE_XP_REQUIRED * Math.pow(LEVELING.XP_SCALING, level - 1)
    );
  }

  _loadProgression() {
    try {
      const raw = localStorage.getItem(LEVELING.STORAGE_KEY);
      if (!raw) return { level: 1, xp: 0 };
      const data = JSON.parse(raw);
      const level = Math.max(1, Number.parseInt(data.level ?? 1, 10) || 1);
      const xp = Math.max(0, Number.parseInt(data.xp ?? 0, 10) || 0);
      return { level, xp };
    } catch {
      return { level: 1, xp: 0 };
    }
  }

  _saveProgression() {
    try {
      localStorage.setItem(
        LEVELING.STORAGE_KEY,
        JSON.stringify({ level: this.level, xp: this.xp })
      );
    } catch {
      // Ignore storage quota or private-mode errors
    }
  }

  addCredits(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return this.credits;
    this.credits += Math.round(amount);
    this._saveCredits();
    return this.credits;
  }

  spendCredits(amount) {
    if (!Number.isFinite(amount) || amount <= 0 || this.credits < amount) {
      return false;
    }
    this.credits -= Math.round(amount);
    this._saveCredits();
    return true;
  }

  addXp(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { leveledUp: false, level: this.level };
    }

    this.xp += Math.round(amount);
    let leveledUp = false;

    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.xpToNext = this._calcXpRequired(this.level);
      leveledUp = true;
    }

    this._saveProgression();
    return { leveledUp, level: this.level };
  }

  getBonusMaxHp() {
    return (this.level - 1) * LEVELING.MAX_LEVEL_HP_BONUS;
  }
                  }
    
