import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { Board } from '../objects/Board.js';
import { Match3Engine } from '../objects/Match3Engine.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.level = data.level || 1;
  }

  create() {
    const cx = GAME_CONFIG.WIDTH / 2;
    const { ROWS, COLS, CELL_SIZE, OFFSET_X, OFFSET_Y, PADDING } = GAME_CONFIG.BOARD;
    this.boardConfig = { ROWS, COLS, CELL_SIZE, OFFSET_X, OFFSET_Y };

    // ─── 상단 UI ────────────────────────────────

    this.add.text(30, 20, '< 뒤로', {
      fontSize: '22px',
      color: '#ffffff',
    }).setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        if (this.engine) this.engine.isProcessing = true; // 입력 차단
        this.scene.start('LevelSelect');
      });

    this.add.text(cx, 20, `레벨 ${this.level}`, {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5, 0);

    // 점수
    this.scoreText = this.add.text(cx, 70, '점수: 0', {
      fontSize: '24px',
      color: '#f1c40f',
    }).setOrigin(0.5, 0);

    // 콤보
    this.comboText = this.add.text(cx, 110, '', {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#e74c3c',
    }).setOrigin(0.5, 0).setAlpha(0);

    // 이동 횟수
    this.movesLeft = 20; // TODO: 레벨 데이터에서 로드
    this.movesText = this.add.text(cx, 150, `남은 이동: ${this.movesLeft}`, {
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5, 0);

    // ─── 보드 배경 ──────────────────────────────

    const boardWidth = COLS * CELL_SIZE - PADDING;
    const boardHeight = ROWS * CELL_SIZE - PADDING;
    this.add.rectangle(
      OFFSET_X + boardWidth / 2,
      OFFSET_Y + boardHeight / 2,
      boardWidth + 16,
      boardHeight + 16,
      0x16213e,
      0.8
    ).setStrokeStyle(2, 0x0f3460);

    // ─── 보드 & 엔진 생성 ───────────────────────

    const numColors = Math.min(4 + Math.floor(this.level / 3), 6);
    this.board = new Board(this, numColors);
    this.engine = new Match3Engine(this, this.board);

    // 콜백 등록
    this.engine.onScoreUpdate = (score, combo) => {
      this.scoreText.setText(`점수: ${score}`);
      if (combo >= 2) {
        this.showCombo(combo);
      }
    };

    this.engine.onMoveUsed = () => {
      this.movesLeft--;
      this.movesText.setText(`남은 이동: ${this.movesLeft}`);
      if (this.movesLeft <= 3) {
        this.movesText.setColor('#e74c3c');
      }
    };

    this.engine.onMatchFound = (matches, combo) => {
      // 플로팅 점수 텍스트
      if (matches.length > 0) {
        const { row, col } = matches[0];
        const pos = this.gridToPixel(row, col);
        this.showFloatingScore(pos.x, pos.y, matches.length, combo);
      }
    };

    // ─── 입력 처리 ──────────────────────────────

    this.selectedGem = null;
    this.dragStartX = 0;
    this.dragStartY = 0;

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointerup', this.onPointerUp, this);

    // ─── 연쇄 종료 후 게임 오버 체크 ────

    const originalCheckCascade = this.engine.checkCascade.bind(this.engine);
    this.engine.checkCascade = () => {
      this.engine.lastSwapPos = null;
      const groups = this.engine.findMatchGroups();
      if (groups.length > 0) {
        this.engine.processMatchGroups(groups);
      } else {
        this.engine.comboCount = 0;
        this.engine.isProcessing = false;

        // 이동 횟수 소진 → 결과 화면
        if (this.movesLeft <= 0) {
          this.time.delayedCall(500, () => {
            this.scene.start('Result', {
              level: this.level,
              cleared: false,
              stars: 0,
              score: this.engine.score,
            });
          });
          return;
        }

        if (!this.engine.hasValidMoves()) {
          this.engine.shuffleBoard();
        }
      }
    };
  }

  // ─── 입력 핸들러 ──────────────────────────────

  /** 화면 좌표 → 격자 좌표 */
  pixelToGrid(x, y) {
    const { CELL_SIZE, OFFSET_X, OFFSET_Y } = this.boardConfig;
    const col = Math.floor((x - OFFSET_X) / CELL_SIZE);
    const row = Math.floor((y - OFFSET_Y) / CELL_SIZE);
    return { row, col };
  }

  /** 격자 좌표 → 화면 좌표 (중심점) */
  gridToPixel(row, col) {
    const { CELL_SIZE, OFFSET_X, OFFSET_Y } = this.boardConfig;
    const { GEM_SIZE } = GAME_CONFIG.BOARD;
    return {
      x: OFFSET_X + col * CELL_SIZE + GEM_SIZE / 2,
      y: OFFSET_Y + row * CELL_SIZE + GEM_SIZE / 2,
    };
  }

  /** 격자 범위 확인 */
  isValidCell(row, col) {
    const { ROWS, COLS } = this.boardConfig;
    return row >= 0 && row < ROWS && col >= 0 && col < COLS;
  }

  onPointerDown(pointer) {
    if (this.engine.isProcessing) return;

    const { row, col } = this.pixelToGrid(pointer.x, pointer.y);
    if (!this.isValidCell(row, col)) return;

    // 이전 선택 해제
    if (this.selectedGem) {
      const prevGem = this.board.getGem(this.selectedGem.row, this.selectedGem.col);
      if (prevGem) prevGem.setSelected(false);
    }

    this.selectedGem = { row, col };
    this.dragStartX = pointer.x;
    this.dragStartY = pointer.y;

    const gem = this.board.getGem(row, col);
    if (gem) gem.setSelected(true);
  }

  onPointerUp(pointer) {
    if (!this.selectedGem) return;
    if (this.engine.isProcessing) return;

    const dx = pointer.x - this.dragStartX;
    const dy = pointer.y - this.dragStartY;
    const threshold = 20;

    // 선택 해제
    const selGem = this.board.getGem(this.selectedGem.row, this.selectedGem.col);
    if (selGem) selGem.setSelected(false);

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      // 스와이프
      let targetRow = this.selectedGem.row;
      let targetCol = this.selectedGem.col;

      if (Math.abs(dx) > Math.abs(dy)) {
        targetCol += dx > 0 ? 1 : -1;
      } else {
        targetRow += dy > 0 ? 1 : -1;
      }

      if (this.isValidCell(targetRow, targetCol)) {
        this.engine.swapGems(this.selectedGem, { row: targetRow, col: targetCol });
      }
    } else {
      // 탭 (두 번째 탭으로 교환)
      const { row, col } = this.pixelToGrid(pointer.x, pointer.y);
      if (this.prevTap && (Math.abs(this.prevTap.row - row) + Math.abs(this.prevTap.col - col) === 1)) {
        this.engine.swapGems(this.prevTap, { row, col });
        this.prevTap = null;
      } else {
        this.prevTap = { row, col };
        const gem = this.board.getGem(row, col);
        if (gem) gem.setSelected(true);
      }
    }

    this.selectedGem = null;
  }

  // ─── UI 이펙트 ────────────────────────────────

  showCombo(combo) {
    const labels = ['', '', 'GREAT!', 'AMAZING!', 'INCREDIBLE!', 'UNBELIEVABLE!'];
    const label = labels[Math.min(combo, labels.length - 1)] || `${combo}x COMBO!`;

    this.comboText.setText(label);
    this.comboText.setAlpha(1).setScale(0.5);

    this.tweens.add({
      targets: this.comboText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 400,
      onComplete: () => {
        this.tweens.add({
          targets: this.comboText,
          alpha: 0,
          duration: 300,
        });
      },
    });

    // 카메라 셰이크 (콤보 3 이상)
    if (combo >= 3) {
      this.cameras.main.shake(200, 0.005 * combo);
    }
  }

  showFloatingScore(x, y, matchSize, combo) {
    const baseScore = this.engine.calculateScore(matchSize);
    const multiplier = Math.pow(GAME_CONFIG.SCORE.COMBO_BASE, combo - 1);
    const points = Math.round(baseScore * multiplier);

    const text = this.add.text(x, y, `+${points}`, {
      fontSize: '22px',
      fontStyle: 'bold',
      color: combo >= 2 ? '#e74c3c' : '#f1c40f',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }
}
