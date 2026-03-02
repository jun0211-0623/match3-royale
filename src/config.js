export const GAME_CONFIG = {
  WIDTH: 720,
  HEIGHT: 1280,

  BOARD: {
    ROWS: 8,
    COLS: 8,
    GEM_SIZE: 72,
    PADDING: 4,
    CELL_SIZE: 76,    // GEM_SIZE + PADDING
    OFFSET_X: 58,     // (720 - (8 * 76 - 4)) / 2
    OFFSET_Y: 350,
  },

  COLORS: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],

  COLOR_HEX: {
    red:    0xe74c3c,
    blue:   0x3498db,
    green:  0x2ecc71,
    yellow: 0xf1c40f,
    purple: 0x9b59b6,
    orange: 0xe67e22,
  },

  // 입체감 있는 젬 텍스처용 팔레트
  COLOR_PALETTE: {
    red:    { base: 0xe74c3c, light: 0xf1948a, dark: 0xc0392b, shine: 0xfadbd8 },
    blue:   { base: 0x3498db, light: 0x7fb3d8, dark: 0x2176ae, shine: 0xd6eaf8 },
    green:  { base: 0x27ae60, light: 0x6fcf97, dark: 0x1e8449, shine: 0xd5f5e3 },
    yellow: { base: 0xf1c40f, light: 0xf7dc6f, dark: 0xd4ac0d, shine: 0xfef9e7 },
    purple: { base: 0x8e44ad, light: 0xbb8fce, dark: 0x6c3483, shine: 0xe8daef },
    orange: { base: 0xe67e22, light: 0xf0b27a, dark: 0xca6f1e, shine: 0xfdebd0 },
  },

  ANIM: {
    SWAP_SPEED: 200,
    FALL_SPEED: 100,
    DESTROY_SPEED: 200,
    COMBO_DELAY: 100,
  },

  SCORE: {
    MATCH_3: 50,
    MATCH_4: 150,
    MATCH_5: 500,
    COMBO_BASE: 1.5,
  },

  ECONOMY: {
    INITIAL_COINS: 500,
    BOOSTER_HAMMER: 100,
    BOOSTER_SHUFFLE: 80,
    BOOSTER_EXTRA_MOVES: 150,
    EXTRA_MOVES_COUNT: 5,
  },
};
