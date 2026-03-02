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

  // 색상 hex 코드 (임시 사각형 블록용)
  COLOR_HEX: {
    red:    0xe74c3c,
    blue:   0x3498db,
    green:  0x2ecc71,
    yellow: 0xf1c40f,
    purple: 0x9b59b6,
    orange: 0xe67e22,
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
};
