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

  // 입체감 있는 젬 텍스처용 팔레트 (8종 변형)
  COLOR_PALETTE: {
    red:    { base: 0xe74c3c, light: 0xf1948a, lighter: 0xf5b7b1, dark: 0xc0392b, darker: 0x922b21, shine: 0xfadbd8, glow: 0xff6b6b, rim: 0xffeaea },
    blue:   { base: 0x3498db, light: 0x7fb3d8, lighter: 0xaed6f1, dark: 0x2176ae, darker: 0x1a5276, shine: 0xd6eaf8, glow: 0x5dade2, rim: 0xe8f6fd },
    green:  { base: 0x27ae60, light: 0x6fcf97, lighter: 0xa9dfbf, dark: 0x1e8449, darker: 0x145a32, shine: 0xd5f5e3, glow: 0x58d68d, rim: 0xe8f8f0 },
    yellow: { base: 0xf1c40f, light: 0xf7dc6f, lighter: 0xfad7a0, dark: 0xd4ac0d, darker: 0xb7950b, shine: 0xfef9e7, glow: 0xf9e154, rim: 0xfff8dc },
    purple: { base: 0x8e44ad, light: 0xbb8fce, lighter: 0xd2b4de, dark: 0x6c3483, darker: 0x512e5f, shine: 0xe8daef, glow: 0xaf7ac5, rim: 0xf4ecf7 },
    orange: { base: 0xe67e22, light: 0xf0b27a, lighter: 0xf5cba7, dark: 0xca6f1e, darker: 0xa04000, shine: 0xfdebd0, glow: 0xf5a623, rim: 0xfef0e0 },
  },

  ANIM: {
    SWAP_SPEED: 200,
    FALL_SPEED: 100,
    DESTROY_SPEED: 200,
    COMBO_DELAY: 100,
    LAND_BOUNCE: 180,
    SELECT_PULSE: 600,
    SCENE_FADE: 300,
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
