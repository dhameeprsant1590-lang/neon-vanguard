export const GAME_CONFIG = {
  ARENA_RADIUS: 42,
  GRAVITY: -38,
  PLAYER: { MAX_HP: 100, BASE_SPEED: 14, DASH_SPEED: 38, JUMP_VELOCITY: 16, DASH_DURATION: 0.22, DASH_COOLDOWN: 2.0, COLLISION_RADIUS: 0.9 },
  WEAPONS: {
    1: { name: 'PULSE RIFLE [LVL 1]', cooldown: 0.16, spread: 0, count: 1 },
    2: { name: 'TWIN BLASTER [LVL 2]', cooldown: 0.14, spread: 0.08, count: 2 },
    3: { name: 'TRIPLE SCATTER [LVL 3]', cooldown: 0.13, spread: 0.11, count: 3 },
  },
  COLORS: { CYAN: 0x00f3ff, MAGENTA: 0xff007f, AMBER: 0xffbe0b, GREEN: 0x00ff88, PURPLE: 0xb5179e },
};
export const CURRENCY = {
  STORAGE_KEY: 'neon_vanguard_credits',
  ENEMY_REWARD: {
    stalker: 15,
    artillery: 25,
    juggernaut: 75,
  },
  WAVE_CLEAR_BONUS: 50,
};

export const LEVELING = {
  STORAGE_KEY: 'neon_vanguard_progression',
  BASE_XP_REQUIRED: 100,
  XP_SCALING: 1.35,
  XP_PER_SCORE_FACTOR: 0.25,
  MAX_LEVEL_HP_BONUS: 5,
};
  
