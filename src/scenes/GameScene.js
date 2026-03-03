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
import { UIButton } from '../ui/UIButton.js';
import { fadeToScene, fadeIn } from '../utils/SceneTransitions.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.level = data.level || 1;
    this.activeBooster = null; // 'hammer' 등 사용 대기 중인 부스터
    this.isDaily = !!data.dailyLevel;
    this.dailyLevel = data.dailyLevel || null;
    this.dailyDate = data.dailyDate || null;
  }

  create() {
    fadeIn(this);
    const cx = GAME_CONFIG.WIDTH / 2;
    const { ROWS, COLS, CELL_SIZE, OFFSET_X, OFFSET_Y, PADDING } = GAME_CONFIG.BOARD;
    this.boardConfig = { ROWS, COLS, CELL_SIZE, OFFSET_X, OFFSET_Y };

    // ─── 배경 ────────────────────────────────────
    this.add.image(cx, GAME_CONFIG.HEIGHT / 2, 'bg_gradient');

    // ─── 레벨 데이터 로드 ──────────────────────
    const levelData = this.isDaily ? this.dailyLevel : LevelManager.getLevel(this.level);
    if (!levelData) {
      fadeToScene(this, 'LevelSelect');
      return;
    }

    this.goalManager = new GoalManager(levelData);

    // ─── 상단 UI ────────────────────────────────

    // 뒤로가기
    this.add.text(30, 20, '< 뒤로', {
      fontSize: '22px',
      color: '#ffffff',
    }).setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.showExitConfirm());

    // 레벨 표시
    this.add.text(cx, 20, this.isDaily ? '일일 도전 🔥' : `레벨 ${this.level}`, {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5, 0);

    // 일시정지 버튼
    this.add.text(GAME_CONFIG.WIDTH - 30, 20, '⏸', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.showPauseMenu());

    // ─── 목표 UI ────────────────────────────────

    this.goalTexts = [];
    const goalStartY = 65;
    const goalColors = GAME_CONFIG.COLOR_HEX;

    const obstacleIcons = { ice: '🧊', chain: '⛓', wood: '📦' };
    this.goalManager.goals.forEach((goal, i) => {
      let hex, label;
      if (goal.type === 'collect') {
        hex = goalColors[goal.color] || 0xffffff;
        label = `${goal.color}: 0/${goal.count}`;
      } else if (goal.type === 'destroy_obstacle') {
        hex = 0xaaaaaa;
        label = `${obstacleIcons[goal.obstacleType] || '?'} ${goal.obstacleType}: 0/${goal.count}`;
      }
      const colorDot = this.add.circle(cx - 100, goalStartY + i * 30, 8, hex);
      const text = this.add.text(cx - 80, goalStartY + i * 30, label, {
        fontSize: '20px',
        color: '#ffffff',
      }).setOrigin(0, 0.5);
      this.goalTexts.push(text);
    });

    this.goalManager.onGoalUpdate = (goals) => {
      goals.forEach((goal, i) => {
        if (this.goalTexts[i]) {
          const done = goal.current >= goal.count;
          let label;
          if (goal.type === 'collect') {
            label = `${goal.color}: ${goal.current}/${goal.count}`;
          } else if (goal.type === 'destroy_obstacle') {
            label = `${obstacleIcons[goal.obstacleType] || '?'} ${goal.obstacleType}: ${goal.current}/${goal.count}`;
          }
          this.goalTexts[i].setText(label);
          this.goalTexts[i].setColor(done ? '#2ecc71' : '#ffffff');
        }
      });

      // 목표 달성 체크
      if (this.goalManager.isAllGoalsComplete()) {
        this.onLevelClear();
      }
    };

    // 이동 횟수
    const goalsHeight = this.goalManager.goals.length * 30;
    this.movesText = this.add.text(cx, goalStartY + goalsHeight + 10, `남은 이동: ${this.goalManager.movesLeft}`, {
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5, 0);

    // 점수
    this.scoreText = this.add.text(cx, goalStartY + goalsHeight + 40, '점수: 0', {
      fontSize: '22px',
      color: '#f1c40f',
    }).setOrigin(0.5, 0);

    // 코인 표시
    this.coinText = this.add.text(GAME_CONFIG.WIDTH - 20, goalStartY + goalsHeight + 40, `💰 ${SaveManager.getCoins()}`, {
      fontSize: '18px',
      color: '#f1c40f',
    }).setOrigin(1, 0);

    // 콤보
    this.comboText = this.add.text(cx, goalStartY + goalsHeight + 70, '', {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#e74c3c',
    }).setOrigin(0.5, 0).setAlpha(0);

    // ─── 보드 배경 (글로우 + 그리드) ──────────────

    const boardWidth = COLS * CELL_SIZE - PADDING;
    const boardHeight = ROWS * CELL_SIZE - PADDING;
    const bx = OFFSET_X + boardWidth / 2;
    const by = OFFSET_Y + boardHeight / 2;

    // 아우터 글로우
    const outerGlow = this.add.rectangle(bx, by, boardWidth + 28, boardHeight + 28, 0x1a3a5c, 0.25);
    if (outerGlow.preFX) {
      outerGlow.preFX.addGlow(0x3498db, 5, 0, false, 0.04, 12);
    }

    // 메인 보드 bg
    this.add.rectangle(bx, by, boardWidth + 16, boardHeight + 16, 0x0d1b2a, 0.9)
      .setStrokeStyle(2, 0x1a4a6e, 0.6);

    // 인너 섀도
    this.add.rectangle(bx, OFFSET_Y - 2, boardWidth + 12, 6, 0x000000, 0.15);
    this.add.rectangle(OFFSET_X - 2, by, 6, boardHeight + 12, 0x000000, 0.1);

    // 미세 그리드 라인
    const gridLines = this.add.graphics();
    gridLines.lineStyle(1, 0xffffff, 0.025);
    for (let r = 1; r < ROWS; r++) {
      const ly = OFFSET_Y + r * CELL_SIZE - PADDING / 2;
      gridLines.lineBetween(OFFSET_X, ly, OFFSET_X + boardWidth, ly);
    }
    for (let c = 1; c < COLS; c++) {
      const lx = OFFSET_X + c * CELL_SIZE - PADDING / 2;
      gridLines.lineBetween(lx, OFFSET_Y, lx, OFFSET_Y + boardHeight);
    }

    // ─── 보드 & 엔진 생성 ───────────────────────

    this.board = new Board(this, levelData.colors, levelData);
    this.engine = new Match3Engine(this, this.board);

    // 콜백 등록
    this.engine.onScoreUpdate = (score, combo) => {
      this.scoreText.setText(`점수: ${score}`);
      if (combo >= 2) {
        this.showCombo(combo);
      }
    };

    this.engine.onMoveUsed = () => {
      this.goalManager.useMove();
      this.movesText.setText(`남은 이동: ${this.goalManager.movesLeft}`);
      if (this.goalManager.movesLeft <= 3) {
        this.movesText.setColor('#e74c3c');
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
      // 카메라 살짝 흔들기
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
      // 장애물 파괴 사운드
      if (obstacleType === 'ice') audioManager.playIceCrack();
      else if (obstacleType === 'chain') audioManager.playChainBreak();
      else if (obstacleType === 'wood') audioManager.playWoodSmash();
    };

    // ─── 힌트 시스템 ───────────────────────────

    this.hintManager = new HintManager(this, this.engine);

    // ─── 부스터 UI (보드 아래) ─────────────────

    const boosterY = OFFSET_Y + boardHeight + 40;
    this.boosterButtons = {};
    const boosterList = ['hammer', 'shuffle', 'extraMoves'];
    const boosterStartX = cx - (boosterList.length - 1) * 90;

    boosterList.forEach((id, i) => {
      const bx = boosterStartX + i * 180;
      const booster = BOOSTERS[id];

      const btn = new UIButton(this, bx, boosterY, 160, 48, {
        text: `${booster.icon} ${booster.cost}💰`,
        fontSize: '18px',
        bgColor: 0x2c3e50,
        radius: 10,
        shadowOffset: 3,
        onClick: () => this.onBoosterClick(id),
      });

      this.boosterButtons[id] = btn;
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

        // 힌트 타이머 재시작
        if (this.hintManager) this.hintManager.resetTimer();

        // 목표 달성 (이미 onGoalUpdate에서 처리하지만 이중 체크)
        if (this.goalManager.isAllGoalsComplete()) {
          this.onLevelClear();
          return;
        }

        // 이동 횟수 소진 → 실패
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
      tint: [0x3498db, 0x9b59b6, 0x2ecc71],
      lifespan: { min: 4000, max: 8000 },
      frequency: 900,
      quantity: 1,
    }).setDepth(-1);
  }

  // ─── 레벨 클리어 ──────────────────────────────

  onLevelClear() {
    if (this._cleared) return; // 중복 방지
    this._cleared = true;

    this.engine.isProcessing = true;

    const stars = this.goalManager.calculateStars();
    const coins = this.goalManager.getRewardCoins(stars);

    if (this.isDaily) {
      // 일일 도전 클리어
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
      // 일반 레벨 클리어
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
    audioManager.unlock(); // 모바일 오디오 unlock
    if (this.engine.isProcessing) return;
    if (this._paused) return;

    // 힌트 리셋
    if (this.hintManager) this.hintManager.resetTimer();

    const { row, col } = this.pixelToGrid(pointer.x, pointer.y);
    if (!this.isValidCell(row, col)) return;

    // 망치 부스터 모드
    if (this.activeBooster === 'hammer') {
      this.useHammer(row, col);
      return;
    }

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
      this.boosterButtons.hammer.setColor(0xe74c3c);
    } else if (boosterId === 'shuffle') {
      if (BoosterManager.purchase('shuffle')) {
        this.updateCoinDisplay();
        this.engine.shuffleBoard();
      }
    } else if (boosterId === 'extraMoves') {
      if (BoosterManager.purchase('extraMoves')) {
        this.updateCoinDisplay();
        this.goalManager.addMoves(GAME_CONFIG.ECONOMY.EXTRA_MOVES_COUNT);
        this.movesText.setText(`남은 이동: ${this.goalManager.movesLeft}`);
        this.movesText.setColor('#ffffff');
        this.showMessage(`+${GAME_CONFIG.ECONOMY.EXTRA_MOVES_COUNT} 이동!`);
      }
    }
  }

  useHammer(row, col) {
    if (!BoosterManager.purchase('hammer')) return;
    this.updateCoinDisplay();
    this.activeBooster = null;
    this.boosterButtons.hammer.setColor(0x2c3e50);

    const gem = this.board.getGem(row, col);
    if (!gem) return;

    // 장애물이 있으면 장애물 우선 처리
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
    this.coinText.setText(`💰 ${SaveManager.getCoins()}`);
  }

  // ─── 일시정지 / 나가기 ────────────────────────

  showPauseMenu() {
    if (this._paused) return;
    this._paused = true;
    this.engine.isProcessing = true;

    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const elements = [];

    const overlay = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.7)
      .setDepth(50).setInteractive();
    elements.push(overlay);

    const panel = this.add.graphics().setDepth(51);
    panel.fillStyle(0x1a1a2e, 0.95);
    panel.fillRoundedRect(WIDTH / 2 - 200, HEIGHT / 2 - 175, 400, 350, 20);
    panel.lineStyle(3, 0x3498db, 1);
    panel.strokeRoundedRect(WIDTH / 2 - 200, HEIGHT / 2 - 175, 400, 350, 20);
    elements.push(panel);

    const titleTxt = this.add.text(WIDTH / 2, HEIGHT / 2 - 120, '일시정지', {
      fontSize: '36px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setDepth(52);
    elements.push(titleTxt);

    const cleanup = () => { elements.forEach(el => el.destroy()); };

    const btnData = [
      { y: -40, text: '계속하기', color: 0x2ecc71, action: 'resume' },
      { y: 30, text: '재시작', color: 0x3498db, action: 'restart' },
      { y: 100, text: this.isDaily ? '일일 도전' : '레벨 선택', color: 0x7f8c8d, action: 'exit' },
    ];

    btnData.forEach(({ y, text, color, action }) => {
      const btn = new UIButton(this, WIDTH / 2, HEIGHT / 2 + y, 260, 55, {
        text, bgColor: color, fontSize: '26px', depth: 52,
        onClick: () => {
          cleanup();
          if (action === 'resume') {
            this._paused = false;
            this.engine.isProcessing = false;
          } else if (action === 'restart') {
            if (this.isDaily) {
              fadeToScene(this, 'Game', { level: -1, dailyLevel: this.dailyLevel, dailyDate: this.dailyDate });
            } else {
              fadeToScene(this, 'Game', { level: this.level });
            }
          } else if (action === 'exit') {
            fadeToScene(this, this.isDaily ? 'DailyChallenge' : 'LevelSelect');
          }
        },
      });
      elements.push(btn.shadow, btn.bg, btn.hitArea, btn.label);
    });
  }

  showExitConfirm() {
    if (this._paused) return;
    this._paused = true;
    this.engine.isProcessing = true;

    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const elements = [];

    const overlay = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.7)
      .setDepth(50).setInteractive();
    elements.push(overlay);

    const panel = this.add.graphics().setDepth(51);
    panel.fillStyle(0x1a1a2e, 0.95);
    panel.fillRoundedRect(WIDTH / 2 - 200, HEIGHT / 2 - 110, 400, 220, 20);
    panel.lineStyle(3, 0xe74c3c, 1);
    panel.strokeRoundedRect(WIDTH / 2 - 200, HEIGHT / 2 - 110, 400, 220, 20);
    elements.push(panel);

    const title = this.add.text(WIDTH / 2, HEIGHT / 2 - 60, '나가시겠습니까?', {
      fontSize: '28px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setDepth(52);
    const subtitle = this.add.text(WIDTH / 2, HEIGHT / 2 - 25, '진행 상황이 저장되지 않습니다', {
      fontSize: '18px', color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(52);
    elements.push(title, subtitle);

    const cleanup = () => { elements.forEach(el => el.destroy()); };

    const exitBtn = new UIButton(this, WIDTH / 2 - 80, HEIGHT / 2 + 40, 140, 50, {
      text: '나가기', bgColor: 0xe74c3c, fontSize: '22px', depth: 52,
      onClick: () => fadeToScene(this, this.isDaily ? 'DailyChallenge' : 'LevelSelect'),
    });
    elements.push(exitBtn.shadow, exitBtn.bg, exitBtn.hitArea, exitBtn.label);

    const stayBtn = new UIButton(this, WIDTH / 2 + 80, HEIGHT / 2 + 40, 140, 50, {
      text: '계속하기', bgColor: 0x2ecc71, fontSize: '22px', depth: 52,
      onClick: () => {
        cleanup();
        this._paused = false;
        this.engine.isProcessing = false;
      },
    });
    elements.push(stayBtn.shadow, stayBtn.bg, stayBtn.hitArea, stayBtn.label);
  }

  // ─── 목표 팝업 (레벨 시작) ──────────────────

  showGoalPopup() {
    this.engine.isProcessing = true;
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    const overlay = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.6)
      .setDepth(50).setInteractive();

    const panelH = 180 + this.goalManager.goals.length * 35;
    const panel = this.add.graphics().setDepth(51);
    panel.fillStyle(0x1a1a2e, 0.95);
    panel.fillRoundedRect(WIDTH / 2 - 190, HEIGHT / 2 - panelH / 2, 380, panelH, 20);
    panel.lineStyle(3, 0xf1c40f, 1);
    panel.strokeRoundedRect(WIDTH / 2 - 190, HEIGHT / 2 - panelH / 2, 380, panelH, 20);

    const title = this.add.text(WIDTH / 2, HEIGHT / 2 - panelH / 2 + 30,
      this.isDaily ? '일일 도전 🔥' : `레벨 ${this.level}`, {
      fontSize: '32px', fontStyle: 'bold', color: this.isDaily ? '#e67e22' : '#f1c40f',
    }).setOrigin(0.5).setDepth(52);

    const movesLabel = this.add.text(WIDTH / 2, HEIGHT / 2 - panelH / 2 + 65, `이동 ${this.goalManager.moves}회`, {
      fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(52);

    const elements = [overlay, panel, title, movesLabel];

    this.goalManager.goals.forEach((goal, i) => {
      const y = HEIGHT / 2 - panelH / 2 + 100 + i * 35;
      let hex, labelText;
      if (goal.type === 'collect') {
        hex = GAME_CONFIG.COLOR_HEX[goal.color] || 0xffffff;
        labelText = `${goal.color} × ${goal.count}`;
      } else if (goal.type === 'destroy_obstacle') {
        const icons = { ice: '🧊', chain: '⛓', wood: '📦' };
        hex = 0xaaaaaa;
        labelText = `${icons[goal.obstacleType] || '?'} ${goal.obstacleType} × ${goal.count}`;
      }
      const dot = this.add.circle(WIDTH / 2 - 80, y, 8, hex).setDepth(52);
      const label = this.add.text(WIDTH / 2 - 60, y, labelText, {
        fontSize: '20px', color: '#ffffff',
      }).setOrigin(0, 0.5).setDepth(52);
      elements.push(dot, label);
    });

    const startBtn = new UIButton(this, WIDTH / 2, HEIGHT / 2 + panelH / 2 - 40, 200, 50, {
      text: '시작!', bgColor: 0x2ecc71, fontSize: '26px', depth: 52,
      onClick: () => {
        elements.forEach(el => el.destroy());
        startBtn.destroy();
        this.engine.isProcessing = false;
      },
    });
    elements.push(startBtn.shadow, startBtn.bg, startBtn.hitArea, startBtn.label);
  }

  // ─── 튜토리얼 ────────────────────────────────

  showTutorial() {
    this.engine.isProcessing = true;
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    const steps = [
      { text: '블록을 스와이프해서\n같은 색 3개를 맞추세요!', icon: '👆' },
      { text: '4개 매치 → 🚀 로켓\n5개 매치 → 🌈 무지개', icon: '✨' },
      { text: '목표를 달성하면\n레벨 클리어!', icon: '🎯' },
    ];

    let stepIndex = 0;

    const overlay = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.7)
      .setDepth(60).setInteractive();
    const panel = this.add.graphics().setDepth(61);
    panel.fillStyle(0x1a1a2e, 0.95);
    panel.fillRoundedRect(WIDTH / 2 - 200, HEIGHT / 2 - 130, 400, 260, 20);
    panel.lineStyle(3, 0x2ecc71, 1);
    panel.strokeRoundedRect(WIDTH / 2 - 200, HEIGHT / 2 - 130, 400, 260, 20);

    const iconText = this.add.text(WIDTH / 2, HEIGHT / 2 - 60, steps[0].icon, {
      fontSize: '48px',
    }).setOrigin(0.5).setDepth(62);
    const bodyText = this.add.text(WIDTH / 2, HEIGHT / 2 + 10, steps[0].text, {
      fontSize: '22px', color: '#ffffff', align: 'center',
    }).setOrigin(0.5).setDepth(62);

    const nextBtnUI = new UIButton(this, WIDTH / 2, HEIGHT / 2 + 85, 160, 45, {
      text: '다음', bgColor: 0x2ecc71, fontSize: '22px', depth: 62,
      onClick: () => { onNext(); },
    });

    const elements = [overlay, panel, iconText, bodyText, nextBtnUI.shadow, nextBtnUI.bg, nextBtnUI.hitArea, nextBtnUI.label];

    const onNext = () => {
      stepIndex++;
      if (stepIndex >= steps.length) {
        elements.forEach(el => el.destroy());
        SaveManager.setTutorialDone();
        this.showGoalPopup();
      } else {
        iconText.setText(steps[stepIndex].icon);
        bodyText.setText(steps[stepIndex].text);
        if (stepIndex === steps.length - 1) {
          nextBtnUI.setText('시작!');
        }
      }
    };
  }

  // ─── 메시지 표시 ──────────────────────────────

  showMessage(msg) {
    const cx = GAME_CONFIG.WIDTH / 2;
    const text = this.add.text(cx, GAME_CONFIG.BOARD.OFFSET_Y - 30, msg, {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#2c3e50',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 40,
      duration: 1500,
      delay: 800,
      onComplete: () => text.destroy(),
    });
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
