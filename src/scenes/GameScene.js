import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { Board } from '../objects/Board.js';
import { Match3Engine } from '../objects/Match3Engine.js';
import { LevelManager } from '../managers/LevelManager.js';
import { GoalManager } from '../managers/GoalManager.js';
import { SaveManager } from '../managers/SaveManager.js';
import { BoosterManager, BOOSTERS } from '../managers/BoosterManager.js';
import { audioManager } from '../managers/AudioManager.js';
import { HintManager } from '../managers/HintManager.js';
import { fadeToScene, fadeIn } from '../utils/SceneTransitions.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.level = data.level || 1;
    this.activeBooster = null;
    this.isDaily = !!data.dailyLevel;
    this.dailyLevel = data.dailyLevel || null;
    this.dailyDate = data.dailyDate || null;
  }

  create() {
    fadeIn(this);
    const cx = GAME_CONFIG.WIDTH / 2;
    const { ROWS, COLS, CELL_SIZE, OFFSET_X, OFFSET_Y, PADDING } = GAME_CONFIG.BOARD;
    this.boardConfig = { ROWS, COLS, CELL_SIZE, OFFSET_X, OFFSET_Y };
    const UI = GAME_CONFIG.UI;

    // ─── 배경 ────────────────────────────────────
    this.add.image(cx, GAME_CONFIG.HEIGHT / 2, 'bg_gradient');

    // ─── 레벨 데이터 로드 ──────────────────────
    const levelData = this.isDaily ? this.dailyLevel : LevelManager.getLevel(this.level);
    if (!levelData) {
      fadeToScene(this, 'LevelSelect');
      return;
    }

    this.goalManager = new GoalManager(levelData);

    // ─── 상단 HUD (JSX 스타일) ─────────────────

    // 뒤로가기 (glass rounded button)
    const backBg = this.add.graphics();
    backBg.fillStyle(0xffffff, 0.1);
    backBg.fillRoundedRect(14, 14, 44, 40, 12);
    this.add.text(36, 34, '✕', {
      fontSize: '18px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.showExitConfirm());

    // 레벨 표시 (pill badge)
    const levelPill = this.add.graphics();
    levelPill.fillStyle(0x000000, 0.4);
    levelPill.fillRoundedRect(cx - 75, 16, 150, 36, 20);
    levelPill.lineStyle(1, UI.GOLD, 0.2);
    levelPill.strokeRoundedRect(cx - 75, 16, 150, 36, 20);
    this.add.text(cx - 10, 34, this.isDaily ? '일일 도전 🔥' : `LEVEL ${this.level}`, {
      fontSize: '14px', fontStyle: 'bold', color: '#FFD54F',
    }).setOrigin(0.5);
    this.add.text(cx - 55, 34, '⭐', { fontSize: '16px' }).setOrigin(0.5);

    // 코인 (pill)
    const coinPill = this.add.graphics();
    coinPill.fillStyle(0x000000, 0.4);
    coinPill.fillRoundedRect(GAME_CONFIG.WIDTH - 130, 16, 116, 36, 20);
    coinPill.lineStyle(1, UI.GOLD, 0.15);
    coinPill.strokeRoundedRect(GAME_CONFIG.WIDTH - 130, 16, 116, 36, 20);
    this.add.text(GAME_CONFIG.WIDTH - 112, 34, '🪙', { fontSize: '16px' }).setOrigin(0.5);
    this.coinText = this.add.text(GAME_CONFIG.WIDTH - 72, 34, `${SaveManager.getCoins()}`, {
      fontSize: '14px', fontStyle: 'bold', color: '#FFD54F',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // 일시정지 (hidden, back button doubles as exit)
    // No separate pause button; we use the back button for exit confirm

    // ─── 이동/점수 패널 (JSX glass style) ──────

    const panelY = 66;
    const panelW = 140;
    const panelH = 62;
    const panelGap = 16;

    // 이동 횟수 패널
    const movesPanelX = cx - panelW - panelGap / 2;
    const movesPanelG = this.add.graphics();
    movesPanelG.fillStyle(0xffffff, 0.06);
    movesPanelG.fillRoundedRect(movesPanelX, panelY, panelW, panelH, 16);
    movesPanelG.lineStyle(1, 0xffffff, 0.08);
    movesPanelG.strokeRoundedRect(movesPanelX, panelY, panelW, panelH, 16);

    this.add.text(movesPanelX + panelW / 2, panelY + 14, '남은 횟수', {
      fontSize: '11px', fontStyle: 'bold', color: 'rgba(255,255,255,0.5)',
    }).setOrigin(0.5);

    this.movesText = this.add.text(movesPanelX + panelW / 2, panelY + 42, `${this.goalManager.movesLeft}`, {
      fontSize: '32px', fontStyle: 'bold', color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // 점수 패널
    const scorePanelX = cx + panelGap / 2;
    const scorePanelG = this.add.graphics();
    scorePanelG.fillStyle(0xffffff, 0.06);
    scorePanelG.fillRoundedRect(scorePanelX, panelY, panelW, panelH, 16);
    scorePanelG.lineStyle(1, 0xffffff, 0.08);
    scorePanelG.strokeRoundedRect(scorePanelX, panelY, panelW, panelH, 16);

    this.add.text(scorePanelX + panelW / 2, panelY + 14, '점수', {
      fontSize: '11px', fontStyle: 'bold', color: 'rgba(255,255,255,0.5)',
    }).setOrigin(0.5);

    this.scoreText = this.add.text(scorePanelX + panelW / 2, panelY + 42, '0', {
      fontSize: '32px', fontStyle: 'bold', color: '#FFD54F',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // ─── 목표 UI (JSX target display) ──────────

    const goalY = 142;
    this.goalTexts = [];
    const goalColors = GAME_CONFIG.COLOR_HEX;
    const obstacleIcons = { ice: '🧊', chain: '⛓', wood: '📦' };

    // 목표 pill 배경
    const goalCount = this.goalManager.goals.length;
    const goalPillW = Math.max(200, goalCount * 90 + 40);
    const goalPillG = this.add.graphics();
    goalPillG.fillStyle(0x000000, 0.3);
    goalPillG.fillRoundedRect(cx - goalPillW / 2, goalY, goalPillW, 44, 14);
    goalPillG.lineStyle(1, 0xffffff, 0.06);
    goalPillG.strokeRoundedRect(cx - goalPillW / 2, goalY, goalPillW, 44, 14);

    const goalSpacing = goalPillW / (goalCount + 1);
    this.goalManager.goals.forEach((goal, i) => {
      const gx = cx - goalPillW / 2 + goalSpacing * (i + 1);

      if (goal.type === 'collect') {
        const hex = goalColors[goal.color] || 0xffffff;
        // Mini gem thumbnail (28x28 rounded)
        const thumb = this.add.graphics();
        thumb.fillStyle(hex, 1);
        thumb.fillRoundedRect(gx - 36, goalY + 8, 28, 28, 8);
        // Shine on thumbnail
        thumb.fillStyle(0xffffff, 0.3);
        thumb.fillCircle(gx - 26, goalY + 16, 5);

        const text = this.add.text(gx, goalY + 22, `${goal.current || 0}/${goal.count}`, {
          fontSize: '15px', fontStyle: 'bold', color: 'rgba(255,255,255,0.8)',
          fontFamily: 'monospace',
        }).setOrigin(0, 0.5);
        this.goalTexts.push(text);
      } else if (goal.type === 'destroy_obstacle') {
        this.add.text(gx - 36, goalY + 22, obstacleIcons[goal.obstacleType] || '?', {
          fontSize: '22px',
        }).setOrigin(0, 0.5);
        const text = this.add.text(gx, goalY + 22, `${goal.current || 0}/${goal.count}`, {
          fontSize: '15px', fontStyle: 'bold', color: 'rgba(255,255,255,0.8)',
          fontFamily: 'monospace',
        }).setOrigin(0, 0.5);
        this.goalTexts.push(text);
      }
    });

    this.goalManager.onGoalUpdate = (goals) => {
      goals.forEach((goal, i) => {
        if (this.goalTexts[i]) {
          const done = goal.current >= goal.count;
          this.goalTexts[i].setText(`${goal.current}/${goal.count}`);
          this.goalTexts[i].setColor(done ? '#00E676' : 'rgba(255,255,255,0.8)');
        }
      });
      if (this.goalManager.isAllGoalsComplete()) {
        this.onLevelClear();
      }
    };

    // 콤보 텍스트
    this.comboText = this.add.text(cx, 210, '', {
      fontSize: '48px', fontStyle: 'bold', color: '#FFD54F',
    }).setOrigin(0.5).setAlpha(0).setDepth(20);
    this.comboSubText = this.add.text(cx, 250, '', {
      fontSize: '16px', fontStyle: 'bold', color: '#FF8F00',
    }).setOrigin(0.5).setAlpha(0).setDepth(20);

    // ─── 보드 배경 (JSX glass-morphism) ─────────

    const boardWidth = COLS * CELL_SIZE - PADDING;
    const boardHeight = ROWS * CELL_SIZE - PADDING;
    const bx = OFFSET_X + boardWidth / 2;
    const by = OFFSET_Y + boardHeight / 2;

    // Glass board container
    const boardBg = this.add.graphics();
    // Gradient-like glass effect
    boardBg.fillStyle(0xffffff, 0.06);
    boardBg.fillRoundedRect(bx - boardWidth / 2 - 10, by - boardHeight / 2 - 10, boardWidth + 20, boardHeight + 20, 20);
    boardBg.lineStyle(1, 0xffffff, 0.08);
    boardBg.strokeRoundedRect(bx - boardWidth / 2 - 10, by - boardHeight / 2 - 10, boardWidth + 20, boardHeight + 20, 20);
    // Inner top highlight
    boardBg.fillStyle(0xffffff, 0.03);
    boardBg.fillRoundedRect(bx - boardWidth / 2 - 8, by - boardHeight / 2 - 8, boardWidth + 16, 4, 2);

    // ─── 보드 & 엔진 생성 ───────────────────────

    this.board = new Board(this, levelData.colors, levelData);
    this.engine = new Match3Engine(this, this.board);

    // 콜백 등록
    this.engine.onScoreUpdate = (score, combo) => {
      this.scoreText.setText(`${score}`);
      if (combo >= 2) {
        this.showCombo(combo);
      }
    };

    this.engine.onMoveUsed = () => {
      this.goalManager.useMove();
      this.movesText.setText(`${this.goalManager.movesLeft}`);
      if (this.goalManager.movesLeft <= 5) {
        this.movesText.setColor('#FF5252');
      }
    };

    this.engine.onMatchFound = (matches, combo) => {
      audioManager.playMatch(combo);
      if (matches.length > 0) {
        const { row, col } = matches[0];
        const pos = this.gridToPixel(row, col);
        this.showFloatingScore(pos.x, pos.y, matches.length, combo);
      }
    };

    this.engine.onGemDestroyed = (colorName) => {
      this.goalManager.onGemDestroyed(colorName);
    };

    this.engine.onInvalidSwap = () => {
      audioManager.playInvalidSwap();
      this.cameras.main.shake(100, 0.003);
    };

    this.engine.onSpecialCreated = () => {
      audioManager.playSpecialCreate();
    };

    this.engine.onSpecialExploded = () => {
      audioManager.playSpecialExplode();
    };

    this.engine.onObstacleDestroyed = (obstacleType) => {
      this.goalManager.onObstacleDestroyed(obstacleType);
      if (obstacleType === 'ice') audioManager.playIceCrack();
      else if (obstacleType === 'chain') audioManager.playChainBreak();
      else if (obstacleType === 'wood') audioManager.playWoodSmash();
    };

    // ─── 힌트 시스템 ───────────────────────────

    this.hintManager = new HintManager(this, this.engine);

    // ─── 부스터 UI (JSX power-up cards) ─────────

    const boosterY = OFFSET_Y + boardHeight + 35;
    this.boosterButtons = {};
    const boosterList = ['hammer', 'shuffle', 'extraMoves'];
    const boosterIcons = { hammer: '🔨', shuffle: '🔄', extraMoves: '⚡' };
    const boosterLabels = { hammer: '망치', shuffle: '셔플', extraMoves: '+5' };

    boosterList.forEach((id, i) => {
      const bx2 = cx - 100 + i * 100;
      const booster = BOOSTERS[id];

      // Glass card background
      const cardG = this.add.graphics();
      cardG.fillStyle(0xffffff, 0.06);
      cardG.fillRoundedRect(bx2 - 28, boosterY - 28, 56, 56, 14);
      cardG.lineStyle(1, 0xffffff, 0.1);
      cardG.strokeRoundedRect(bx2 - 28, boosterY - 28, 56, 56, 14);

      // Icon
      this.add.text(bx2, boosterY, boosterIcons[id], { fontSize: '26px' }).setOrigin(0.5);

      // Count badge
      const badgeG = this.add.graphics();
      badgeG.fillStyle(0x2196F3, 1);
      badgeG.fillCircle(bx2 + 22, boosterY - 22, 10);
      this.add.text(bx2 + 22, boosterY - 22, `${booster.cost}`, {
        fontSize: '9px', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5);

      // Label
      this.add.text(bx2, boosterY + 36, boosterLabels[id], {
        fontSize: '10px', fontStyle: 'bold', color: 'rgba(255,255,255,0.4)',
      }).setOrigin(0.5);

      // Hit area
      const hitArea = this.add.rectangle(bx2, boosterY, 56, 56, 0xffffff, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => this.onBoosterClick(id));

      this.boosterButtons[id] = { cardG, hitArea };
    });

    // ─── 입력 처리 ──────────────────────────────

    this.selectedGem = null;
    this.dragStartX = 0;
    this.dragStartY = 0;

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointerup', this.onPointerUp, this);

    // ─── 연쇄 종료 후 게임 오버 체크 ────

    this.engine.checkCascade = () => {
      this.engine.lastSwapPos = null;
      const groups = this.engine.findMatchGroups();
      if (groups.length > 0) {
        this.engine.processMatchGroups(groups);
      } else {
        this.engine.comboCount = 0;
        this.engine.isProcessing = false;

        if (this.hintManager) this.hintManager.resetTimer();

        if (this.goalManager.isAllGoalsComplete()) {
          this.onLevelClear();
          return;
        }

        if (this.goalManager.movesLeft <= 0) {
          this.time.delayedCall(500, () => {
            fadeToScene(this, 'Result', {
              level: this.level,
              cleared: false,
              isDaily: this.isDaily,
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

    // ─── 백그라운드 전환 시 자동 일시정지 ────

    this.game.events.on('blur', () => {
      if (!this.engine.isProcessing) {
        this.showPauseMenu();
      }
    });

    // ─── 튜토리얼 (레벨 1 첫 플레이) ────────

    if (this.level === 1 && !SaveManager.isTutorialDone()) {
      this.time.delayedCall(500, () => this.showTutorial());
    }

    // ─── 레벨 시작 목표 팝업 ────────────────

    if (this.isDaily || this.level > 1 || SaveManager.isTutorialDone()) {
      this.showGoalPopup();
    }

    // ─── 앰비언트 파티클 ──────────────────────────
    this.add.particles(cx, GAME_CONFIG.HEIGHT + 10, 'particle_glow', {
      x: { min: -cx, max: cx },
      speed: { min: 10, max: 25 },
      angle: { min: 260, max: 280 },
      scale: { start: 0.3, end: 0.08 },
      alpha: { start: 0.12, end: 0 },
      tint: [0xA78BFA, 0x60A5FA, 0x4ECDC4],
      lifespan: { min: 4000, max: 8000 },
      frequency: 900,
      quantity: 1,
    }).setDepth(-1);
  }

  // ─── 레벨 클리어 ──────────────────────────────

  onLevelClear() {
    if (this._cleared) return;
    this._cleared = true;

    this.engine.isProcessing = true;

    const stars = this.goalManager.calculateStars();
    const coins = this.goalManager.getRewardCoins(stars);

    if (this.isDaily) {
      SaveManager.completeDailyChallenge(this.dailyDate);
      SaveManager.addCoins(coins);

      this.time.delayedCall(800, () => {
        fadeToScene(this, 'Result', {
          level: -1,
          isDaily: true,
          cleared: true,
          stars,
          score: this.engine.score,
          coins,
        });
      });
    } else {
      SaveManager.saveLevelResult(this.level, stars, this.engine.score);
      SaveManager.addCoins(coins);

      this.time.delayedCall(800, () => {
        fadeToScene(this, 'Result', {
          level: this.level,
          cleared: true,
          stars,
          score: this.engine.score,
          coins,
        });
      });
    }
  }

  // ─── 입력 핸들러 ──────────────────────────────

  pixelToGrid(x, y) {
    const { CELL_SIZE, OFFSET_X, OFFSET_Y } = this.boardConfig;
    const col = Math.floor((x - OFFSET_X) / CELL_SIZE);
    const row = Math.floor((y - OFFSET_Y) / CELL_SIZE);
    return { row, col };
  }

  gridToPixel(row, col) {
    const { CELL_SIZE, OFFSET_X, OFFSET_Y } = this.boardConfig;
    const { GEM_SIZE } = GAME_CONFIG.BOARD;
    return {
      x: OFFSET_X + col * CELL_SIZE + GEM_SIZE / 2,
      y: OFFSET_Y + row * CELL_SIZE + GEM_SIZE / 2,
    };
  }

  isValidCell(row, col) {
    const { ROWS, COLS } = this.boardConfig;
    return row >= 0 && row < ROWS && col >= 0 && col < COLS;
  }

  onPointerDown(pointer) {
    audioManager.unlock();
    if (this.engine.isProcessing) return;
    if (this._paused) return;

    if (this.hintManager) this.hintManager.resetTimer();

    const { row, col } = this.pixelToGrid(pointer.x, pointer.y);
    if (!this.isValidCell(row, col)) return;

    if (this.activeBooster === 'hammer') {
      this.useHammer(row, col);
      return;
    }

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
    if (this._paused) return;

    const dx = pointer.x - this.dragStartX;
    const dy = pointer.y - this.dragStartY;
    const threshold = 20;

    const selGem = this.board.getGem(this.selectedGem.row, this.selectedGem.col);
    if (selGem) selGem.setSelected(false);

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      let targetRow = this.selectedGem.row;
      let targetCol = this.selectedGem.col;

      if (Math.abs(dx) > Math.abs(dy)) {
        targetCol += dx > 0 ? 1 : -1;
      } else {
        targetRow += dy > 0 ? 1 : -1;
      }

      if (this.isValidCell(targetRow, targetCol)) {
        audioManager.playSwipe();
        this.engine.swapGems(this.selectedGem, { row: targetRow, col: targetCol });
      }
    } else {
      const { row, col } = this.pixelToGrid(pointer.x, pointer.y);
      if (this.prevTap && (Math.abs(this.prevTap.row - row) + Math.abs(this.prevTap.col - col) === 1)) {
        audioManager.playSwipe();
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

  // ─── 부스터 ────────────────────────────────────

  onBoosterClick(boosterId) {
    if (this.engine.isProcessing) return;
    if (this._paused) return;

    if (!BoosterManager.canAfford(boosterId)) {
      this.showMessage('코인이 부족합니다!');
      return;
    }

    if (boosterId === 'hammer') {
      this.activeBooster = 'hammer';
      this.showMessage('제거할 블록을 선택하세요');
    } else if (boosterId === 'shuffle') {
      if (BoosterManager.purchase('shuffle')) {
        this.updateCoinDisplay();
        this.engine.shuffleBoard();
      }
    } else if (boosterId === 'extraMoves') {
      if (BoosterManager.purchase('extraMoves')) {
        this.updateCoinDisplay();
        this.goalManager.addMoves(GAME_CONFIG.ECONOMY.EXTRA_MOVES_COUNT);
        this.movesText.setText(`${this.goalManager.movesLeft}`);
        this.movesText.setColor('#ffffff');
        this.showMessage(`+${GAME_CONFIG.ECONOMY.EXTRA_MOVES_COUNT} 이동!`);
      }
    }
  }

  useHammer(row, col) {
    if (!BoosterManager.purchase('hammer')) return;
    this.updateCoinDisplay();
    this.activeBooster = null;

    const gem = this.board.getGem(row, col);
    if (!gem) return;

    if (gem.obstacle) {
      const type = gem.obstacle.type;
      const stillExists = gem.damageObstacle();
      this.engine.effects.obstacleDamage(row, col, type, !stillExists);
      if (!stillExists) {
        if (this.engine.onObstacleDestroyed) this.engine.onObstacleDestroyed(type);
        if (type === 'wood') {
          gem.destroyImmediate();
          this.board.grid[row][col] = null;
          this.engine.isProcessing = true;
          this.time.delayedCall(300, () => this.engine.applyGravity());
        }
      }
      return;
    }

    if (this.engine.onGemDestroyed && gem.color) {
      this.engine.onGemDestroyed(gem.color);
    }

    const hex = gem.color ? GAME_CONFIG.COLOR_HEX[gem.color] : 0xffffff;
    this.engine.effects.gemDestroy(row, col, hex);
    gem.destroy();
    this.board.grid[row][col] = null;

    this.engine.isProcessing = true;
    this.time.delayedCall(300, () => this.engine.applyGravity());
  }

  updateCoinDisplay() {
    this.coinText.setText(`${SaveManager.getCoins()}`);
  }

  // ─── 일시정지 / 나가기 (DOM overlay) ──────

  showPauseMenu() {
    if (this._paused) return;
    this._paused = true;
    this.engine.isProcessing = true;

    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;

    const container = document.createElement('div');
    container.style.cssText = `
      width:${WIDTH}px;height:${HEIGHT}px;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);
      font-family:'Segoe UI',system-ui,sans-serif;
    `;

    container.innerHTML = `
      <style>
        @keyframes m3p-card-enter{from{opacity:0;transform:scale(0.9);}to{opacity:1;transform:scale(1);}}
        .m3p-btn{transition:transform 0.15s ease,filter 0.15s ease;}
        .m3p-btn:hover{transform:translateY(-2px);filter:brightness(1.1);}
        .m3p-btn:active{transform:translateY(3px) scale(0.98)!important;filter:brightness(0.95)!important;}
        .m3p-btn-flat{transition:all 0.2s ease;}
        .m3p-btn-flat:hover{background:rgba(255,255,255,0.14)!important;color:rgba(255,255,255,0.9)!important;transform:translateY(-1px);}
        .m3p-btn-flat:active{transform:translateY(2px) scale(0.98);}
      </style>
      <div style="background:linear-gradient(180deg,#1E1452 0%,#2D1B69 100%);border-radius:28px;padding:36px 32px;text-align:center;max-width:300px;width:90%;border:1px solid rgba(255,215,0,0.2);box-shadow:0 20px 60px rgba(0,0,0,0.5);animation:m3p-card-enter 0.25s ease-out;">
        <h2 style="color:#FFD54F;font-size:28px;font-weight:900;margin:0 0 30px;">⏸ 일시정지</h2>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <button id="m3p-resume" class="m3p-btn" style="width:100%;padding:16px;font-size:20px;font-weight:900;color:white;border:none;border-radius:14px;cursor:pointer;font-family:'Segoe UI',system-ui,sans-serif;position:relative;overflow:hidden;transition:transform 0.1s;background:linear-gradient(180deg,#66BB6A 0%,#43A047 40%,#2E7D32 100%);box-shadow:0 5px 0 #1B5E20,0 7px 16px rgba(46,125,50,0.4);">
            <div style="position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(180deg,rgba(255,255,255,0.15) 0%,transparent 100%);border-radius:14px 14px 0 0;pointer-events:none;"></div>
            계속하기
          </button>
          <button id="m3p-restart" class="m3p-btn" style="width:100%;padding:16px;font-size:18px;font-weight:900;color:white;border:none;border-radius:14px;cursor:pointer;font-family:'Segoe UI',system-ui,sans-serif;position:relative;overflow:hidden;transition:transform 0.1s;background:linear-gradient(180deg,#42A5F5 0%,#1E88E5 40%,#1565C0 100%);box-shadow:0 5px 0 #0D47A1,0 7px 16px rgba(21,101,192,0.4);">
            <div style="position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(180deg,rgba(255,255,255,0.15) 0%,transparent 100%);border-radius:14px 14px 0 0;pointer-events:none;"></div>
            재시작
          </button>
          <button id="m3p-exit" class="m3p-btn-flat" style="width:100%;padding:14px;font-size:16px;font-weight:700;color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:14px;cursor:pointer;font-family:'Segoe UI',system-ui,sans-serif;">
            ${this.isDaily ? '일일 도전' : '레벨 선택'}
          </button>
        </div>
      </div>
    `;

    const domEl = this.add.dom(cx, cy, container).setDepth(100);
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.2s ease';
    this.time.delayedCall(16, () => { container.style.opacity = '1'; });

    const cleanup = (cb) => {
      container.style.opacity = '0';
      this.time.delayedCall(250, () => { domEl.destroy(); if (cb) cb(); });
    };

    container.querySelector('#m3p-resume').addEventListener('pointerup', () => {
      audioManager.playClick();
      cleanup(() => { this._paused = false; this.engine.isProcessing = false; });
    });
    container.querySelector('#m3p-restart').addEventListener('pointerup', () => {
      audioManager.playClick();
      cleanup(() => {
        if (this.isDaily) this.scene.start('Game', { level: -1, dailyLevel: this.dailyLevel, dailyDate: this.dailyDate });
        else this.scene.start('Game', { level: this.level });
      });
    });
    container.querySelector('#m3p-exit').addEventListener('pointerup', () => {
      audioManager.playClick();
      cleanup(() => this.scene.start(this.isDaily ? 'DailyChallenge' : 'LevelSelect'));
    });
  }

  showExitConfirm() {
    if (this._paused) return;
    this._paused = true;
    this.engine.isProcessing = true;

    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;

    const container = document.createElement('div');
    container.style.cssText = `
      width:${WIDTH}px;height:${HEIGHT}px;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);
      font-family:'Segoe UI',system-ui,sans-serif;
    `;

    container.innerHTML = `
      <style>
        @keyframes m3e-card-enter{from{opacity:0;transform:scale(0.9);}to{opacity:1;transform:scale(1);}}
        .m3e-btn{transition:transform 0.15s ease,filter 0.15s ease;}
        .m3e-btn:hover{transform:translateY(-1px);filter:brightness(1.1);}
        .m3e-btn:active{transform:translateY(2px) scale(0.98)!important;filter:brightness(0.9)!important;}
      </style>
      <div style="background:linear-gradient(180deg,#1E1452 0%,#2D1B69 100%);border-radius:28px;padding:32px 28px;text-align:center;max-width:320px;width:90%;border:1px solid rgba(255,82,82,0.3);box-shadow:0 20px 60px rgba(0,0,0,0.5);animation:m3e-card-enter 0.25s ease-out;">
        <div style="font-size:40px;margin-bottom:12px;">⚠️</div>
        <h3 style="color:white;font-size:22px;font-weight:900;margin:0 0 8px;">나가시겠습니까?</h3>
        <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0 0 24px;">진행 상황이 저장되지 않습니다</p>
        <div style="display:flex;gap:10px;">
          <button id="m3e-exit" class="m3e-btn" style="flex:1;padding:14px;font-size:16px;font-weight:800;color:white;background:linear-gradient(180deg,#EF5350,#C62828);border:none;border-radius:14px;cursor:pointer;box-shadow:0 4px 0 #B71C1C,0 6px 12px rgba(198,40,40,0.3);font-family:'Segoe UI',system-ui,sans-serif;">나가기</button>
          <button id="m3e-stay" class="m3e-btn" style="flex:1;padding:14px;font-size:16px;font-weight:800;color:white;background:linear-gradient(180deg,#66BB6A,#2E7D32);border:none;border-radius:14px;cursor:pointer;box-shadow:0 4px 0 #1B5E20,0 6px 12px rgba(46,125,50,0.3);font-family:'Segoe UI',system-ui,sans-serif;">계속하기</button>
        </div>
      </div>
    `;

    const domEl = this.add.dom(cx, cy, container).setDepth(100);
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.2s ease';
    this.time.delayedCall(16, () => { container.style.opacity = '1'; });

    const cleanup = (cb) => {
      container.style.opacity = '0';
      this.time.delayedCall(250, () => { domEl.destroy(); if (cb) cb(); });
    };

    container.querySelector('#m3e-exit').addEventListener('pointerup', () => {
      audioManager.playClick();
      cleanup(() => this.scene.start(this.isDaily ? 'DailyChallenge' : 'LevelSelect'));
    });
    container.querySelector('#m3e-stay').addEventListener('pointerup', () => {
      audioManager.playClick();
      cleanup(() => { this._paused = false; this.engine.isProcessing = false; });
    });
  }

  // ─── 목표 팝업 (레벨 시작, DOM overlay) ──────

  showGoalPopup() {
    this.engine.isProcessing = true;
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    const goalColors = GAME_CONFIG.COLOR_HEX;
    const obstacleIcons = { ice: '🧊', chain: '⛓', wood: '📦' };

    let goalsHTML = '';
    this.goalManager.goals.forEach(goal => {
      if (goal.type === 'collect') {
        const hex = goalColors[goal.color] || 0xffffff;
        const cssColor = '#' + hex.toString(16).padStart(6, '0');
        goalsHTML += `
          <div style="display:flex;align-items:center;gap:12px;padding:8px 0;">
            <div style="width:28px;height:28px;border-radius:8px;background:${cssColor};box-shadow:0 2px 6px ${cssColor}40;position:relative;">
              <div style="position:absolute;top:3px;left:4px;width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.4);filter:blur(1px);"></div>
            </div>
            <span style="color:white;font-weight:700;font-size:16px;">${goal.color} x ${goal.count}</span>
          </div>
        `;
      } else if (goal.type === 'destroy_obstacle') {
        goalsHTML += `
          <div style="display:flex;align-items:center;gap:12px;padding:8px 0;">
            <span style="font-size:24px;">${obstacleIcons[goal.obstacleType] || '?'}</span>
            <span style="color:white;font-weight:700;font-size:16px;">${goal.obstacleType} x ${goal.count}</span>
          </div>
        `;
      }
    });

    const container = document.createElement('div');
    container.style.cssText = `
      width:${WIDTH}px;height:${HEIGHT}px;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);
      font-family:'Segoe UI',system-ui,sans-serif;
    `;

    container.innerHTML = `
      <style>
        @keyframes m3g-slide-up{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
        .m3g-start-btn{transition:transform 0.15s ease,filter 0.15s ease;}
        .m3g-start-btn:hover{transform:translateY(-2px);filter:brightness(1.1);}
        .m3g-start-btn:active{transform:translateY(3px) scale(0.98)!important;filter:brightness(0.95)!important;}
      </style>
      <div style="background:linear-gradient(180deg,#1E1452 0%,#2D1B69 100%);border-radius:28px;padding:32px;text-align:center;max-width:320px;width:90%;border:1px solid rgba(255,215,0,0.3);box-shadow:0 20px 60px rgba(0,0,0,0.5);animation:m3g-slide-up 0.4s ease-out;">
        <h2 style="color:#FFD54F;font-size:28px;font-weight:900;margin:0 0 8px;">${this.isDaily ? '일일 도전 🔥' : `LEVEL ${this.level}`}</h2>
        <p style="color:rgba(255,255,255,0.6);font-size:16px;margin:0 0 20px;">이동 ${this.goalManager.moves}회</p>
        <div style="display:flex;flex-direction:column;padding:0 20px;margin-bottom:24px;">
          ${goalsHTML}
        </div>
        <button id="m3g-start" class="m3g-start-btn" style="width:100%;padding:16px;font-size:22px;font-weight:900;color:white;background:linear-gradient(180deg,#66BB6A 0%,#43A047 40%,#2E7D32 100%);border:none;border-radius:14px;cursor:pointer;box-shadow:0 5px 0 #1B5E20,0 7px 16px rgba(46,125,50,0.4);font-family:'Segoe UI',system-ui,sans-serif;position:relative;overflow:hidden;">
          <div style="position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(180deg,rgba(255,255,255,0.15) 0%,transparent 100%);border-radius:14px 14px 0 0;pointer-events:none;"></div>
          시작!
        </button>
      </div>
    `;

    const domEl = this.add.dom(cx, cy, container).setDepth(100);
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.2s ease';
    this.time.delayedCall(16, () => { container.style.opacity = '1'; });

    container.querySelector('#m3g-start').addEventListener('pointerup', () => {
      audioManager.playClick();
      container.style.opacity = '0';
      this.time.delayedCall(250, () => {
        domEl.destroy();
        this.engine.isProcessing = false;
      });
    });
  }

  // ─── 튜토리얼 (DOM overlay) ─────────────────

  showTutorial() {
    this.engine.isProcessing = true;
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;

    const steps = [
      { text: '블록을 스와이프해서\n같은 색 3개를 맞추세요!', icon: '👆' },
      { text: '4개 매치 → 🚀 로켓\n5개 매치 → 🌈 무지개', icon: '✨' },
      { text: '목표를 달성하면\n레벨 클리어!', icon: '🎯' },
    ];

    let stepIndex = 0;

    const container = document.createElement('div');
    container.style.cssText = `
      width:${WIDTH}px;height:${HEIGHT}px;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);
      font-family:'Segoe UI',system-ui,sans-serif;
    `;

    container.innerHTML = `
      <style>
        @keyframes m3t-card-enter{from{opacity:0;transform:scale(0.92);}to{opacity:1;transform:scale(1);}}
        .m3t-btn{transition:transform 0.15s ease,filter 0.15s ease;}
        .m3t-btn:hover{transform:translateY(-2px);filter:brightness(1.1);}
        .m3t-btn:active{transform:translateY(3px) scale(0.98)!important;filter:brightness(0.95)!important;}
      </style>
      <div style="background:linear-gradient(180deg,#1E1452 0%,#2D1B69 100%);border-radius:28px;padding:36px 32px;text-align:center;max-width:320px;width:90%;border:1px solid rgba(76,175,80,0.3);box-shadow:0 20px 60px rgba(0,0,0,0.5);animation:m3t-card-enter 0.3s ease-out;">
        <div id="m3t-icon" style="font-size:48px;margin-bottom:12px;">${steps[0].icon}</div>
        <p id="m3t-text" style="color:white;font-size:18px;line-height:1.6;margin:0 0 24px;white-space:pre-line;">${steps[0].text}</p>
        <button id="m3t-next" class="m3t-btn" style="width:180px;padding:14px;font-size:20px;font-weight:900;color:white;background:linear-gradient(180deg,#66BB6A 0%,#43A047 40%,#2E7D32 100%);border:none;border-radius:14px;cursor:pointer;box-shadow:0 5px 0 #1B5E20,0 7px 16px rgba(46,125,50,0.4);font-family:'Segoe UI',system-ui,sans-serif;position:relative;overflow:hidden;">
          <div style="position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(180deg,rgba(255,255,255,0.15) 0%,transparent 100%);border-radius:14px 14px 0 0;pointer-events:none;"></div>
          다음
        </button>
      </div>
    `;

    const domEl = this.add.dom(cx, cy, container).setDepth(100);
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.2s ease';
    this.time.delayedCall(16, () => { container.style.opacity = '1'; });

    const iconEl = container.querySelector('#m3t-icon');
    const textEl = container.querySelector('#m3t-text');
    const nextBtn = container.querySelector('#m3t-next');

    nextBtn.addEventListener('pointerup', () => {
      audioManager.playClick();
      stepIndex++;
      if (stepIndex >= steps.length) {
        container.style.opacity = '0';
        this.time.delayedCall(250, () => {
          domEl.destroy();
          SaveManager.setTutorialDone();
          this.showGoalPopup();
        });
      } else {
        iconEl.textContent = steps[stepIndex].icon;
        textEl.textContent = steps[stepIndex].text;
        if (stepIndex === steps.length - 1) {
          nextBtn.childNodes[1].textContent = '시작!';
        }
      }
    });
  }

  // ─── 메시지 표시 ──────────────────────────────

  showMessage(msg) {
    const cx = GAME_CONFIG.WIDTH / 2;
    // Glass pill message
    const msgBg = this.add.graphics().setDepth(30);
    msgBg.fillStyle(0x1E1452, 0.95);
    msgBg.fillRoundedRect(cx - 140, GAME_CONFIG.BOARD.OFFSET_Y - 50, 280, 36, 18);
    msgBg.lineStyle(1, 0xFFD54F, 0.2);
    msgBg.strokeRoundedRect(cx - 140, GAME_CONFIG.BOARD.OFFSET_Y - 50, 280, 36, 18);

    const text = this.add.text(cx, GAME_CONFIG.BOARD.OFFSET_Y - 32, msg, {
      fontSize: '16px', fontStyle: 'bold', color: '#FFD54F',
    }).setOrigin(0.5).setDepth(31);

    this.tweens.add({
      targets: [text, msgBg],
      alpha: 0,
      y: '-=30',
      duration: 1200,
      delay: 800,
      onComplete: () => { text.destroy(); msgBg.destroy(); },
    });
  }

  // ─── UI 이펙트 ────────────────────────────────

  showCombo(combo) {
    // JSX style combo: gold "x{combo}" + "COMBO!" sub
    this.comboText.setText(`x${combo}`);
    this.comboText.setAlpha(1).setScale(0.3);
    this.comboSubText.setText('COMBO!');
    this.comboSubText.setAlpha(1).setScale(0.5);

    this.tweens.add({
      targets: this.comboText,
      scaleX: 1.3, scaleY: 1.3,
      duration: 200,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 400,
      onComplete: () => {
        this.tweens.add({
          targets: [this.comboText, this.comboSubText],
          alpha: 0,
          duration: 300,
        });
      },
    });

    this.tweens.add({
      targets: this.comboSubText,
      scaleX: 1, scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });

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
      color: combo >= 2 ? '#FF5252' : '#FFD54F',
      fontFamily: 'monospace',
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
