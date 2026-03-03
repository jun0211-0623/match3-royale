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

  // Material Design 고채도 색상
  COLOR_HEX: {
    red:    0xFF1744,
    blue:   0x2979FF,
    green:  0x00E676,
    yellow: 0xFFC400,
    purple: 0xD500F9,
    orange: 0xFF6D00,
  },

  COLOR_PALETTE: {
    red:    { base: 0xFF1744, light: 0xFF5252, lighter: 0xFF8A80, dark: 0xD50000, darker: 0xB71C1C, shine: 0xFFCDD2, glow: 0xFF5252, rim: 0xFFEBEE },
    blue:   { base: 0x2979FF, light: 0x448AFF, lighter: 0x82B1FF, dark: 0x2962FF, darker: 0x1A237E, shine: 0xBBDEFB, glow: 0x448AFF, rim: 0xE3F2FD },
    green:  { base: 0x00E676, light: 0x69F0AE, lighter: 0xB9F6CA, dark: 0x00C853, darker: 0x1B5E20, shine: 0xC8E6C9, glow: 0x69F0AE, rim: 0xE8F5E9 },
    yellow: { base: 0xFFC400, light: 0xFFD740, lighter: 0xFFE57F, dark: 0xFFAB00, darker: 0xFF8F00, shine: 0xFFF8E1, glow: 0xFFD740, rim: 0xFFF8E1 },
    purple: { base: 0xD500F9, light: 0xEA80FC, lighter: 0xF3C4FB, dark: 0xAA00FF, darker: 0x6A1B9A, shine: 0xE1BEE7, glow: 0xEA80FC, rim: 0xF3E5F5 },
    orange: { base: 0xFF6D00, light: 0xFFA040, lighter: 0xFFCC80, dark: 0xE65100, darker: 0xBF360C, shine: 0xFFE0B2, glow: 0xFFA040, rim: 0xFFF3E0 },
  },

  // UI 테마 색상
  UI: {
    GOLD: 0xFFD54F,
    GOLD_DARK: 0xFF8F00,
    GOLD_LIGHT: 0xFFE082,
    BG_TOP: 0x0A0E27,
    BG_MID: 0x1A1145,
    BG_BOTTOM: 0x2D1B69,
    PANEL_BG: 0x1E1452,
    PANEL_BORDER: 0xFFD54F,
    GLASS: 0xffffff,     // used with low alpha
    GLASS_ALPHA: 0.06,
    TEXT_PRIMARY: '#ffffff',
    TEXT_GOLD: '#FFD54F',
    TEXT_DIM: 'rgba(255,255,255,0.5)',
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

  OBSTACLES: {
    ice: {
      maxLayers: 2,
      colors: {
        base: 0xadd8e6, light: 0xd4eef7, crack: 0x87ceeb,
        border: 0x5fb3d4, shine: 0xf0f8ff, frost: 0xe0f0ff,
      },
    },
    chain: {
      maxLayers: 1,
      colors: {
        base: 0x888888, link: 0xaaaaaa, dark: 0x555555,
        shine: 0xcccccc, border: 0x666666,
      },
    },
    wood: {
      maxLayers: 2,
      colors: {
        base: 0x8b6914, light: 0xb8860b, dark: 0x654321,
        grain: 0xa0752e, border: 0x5c3a1e, nail: 0x999999,
      },
    },
  },
};
