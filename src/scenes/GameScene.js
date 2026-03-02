import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.level = data.level || 1;
  }

  create() {
    const cx = GAME_CONFIG.WIDTH / 2;
    const { ROWS, COLS, GEM_SIZE, CELL_SIZE, OFFSET_X, OFFSET_Y } = GAME_CONFIG.BOARD;

    // 상단 UI
    this.add.text(30, 20, '< 뒤로', {
      fontSize: '22px',
      color: '#ffffff',
    }).setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.start('LevelSelect'));

    this.add.text(cx, 20, `레벨 ${this.level}`, {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5, 0);

    // 임시: 보드 배경
    const boardWidth = COLS * CELL_SIZE - GAME_CONFIG.BOARD.PADDING;
    const boardHeight = ROWS * CELL_SIZE - GAME_CONFIG.BOARD.PADDING;
    this.add.rectangle(
      OFFSET_X + boardWidth / 2,
      OFFSET_Y + boardHeight / 2,
      boardWidth + 16,
      boardHeight + 16,
      0x16213e,
      0.8
    ).setStrokeStyle(2, 0x0f3460);

    // 임시: 색상 사각형 블록으로 보드 생성
    this.grid = [];
    const colors = GAME_CONFIG.COLORS.slice(0, 4); // 레벨1은 4색

    for (let row = 0; row < ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < COLS; col++) {
        const colorName = colors[Math.floor(Math.random() * colors.length)];
        const hex = GAME_CONFIG.COLOR_HEX[colorName];
        const x = OFFSET_X + col * CELL_SIZE + GEM_SIZE / 2;
        const y = OFFSET_Y + row * CELL_SIZE + GEM_SIZE / 2;

        const gem = this.add.rectangle(x, y, GEM_SIZE - 4, GEM_SIZE - 4, hex, 1)
          .setStrokeStyle(2, 0xffffff, 0.3);

        this.grid[row][col] = { gem, color: colorName, row, col };
      }
    }

    // 하단 안내 텍스트
    this.add.text(cx, GAME_CONFIG.HEIGHT - 60, 'Phase 2에서 매치3 엔진 구현 예정', {
      fontSize: '20px',
      color: '#888888',
    }).setOrigin(0.5);
  }
}
