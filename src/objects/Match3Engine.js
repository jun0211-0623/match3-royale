import { GAME_CONFIG } from '../config.js';
import { Gem } from './Gem.js';
import { Effects } from '../effects/Effects.js';

export class Match3Engine {
  constructor(scene, board) {
    this.scene = scene;
    this.board = board;
    this.effects = new Effects(scene);
    this.isProcessing = false;
    this.comboCount = 0;
    this.score = 0;
    this.lastSwapPos = null;  // 마지막 스와이프 위치 (특수블록 배치용)

    // 콜백
    this.onScoreUpdate = null;
    this.onMatchFound = null;
    this.onMoveUsed = null;
    this.onNoValidMoves = null;
    this.onGemDestroyed = null; // (colorName) => {} 목표 추적용
    this.onInvalidSwap = null;  // () => {} 잘못된 스와이프
    this.onSpecialCreated = null; // () => {} 특수블록 생성
    this.onSpecialExploded = null; // () => {} 특수블록 폭발
    this.onObstacleDestroyed = null; // (obstacleType) => {} 장애물 파괴
  }

  // ═══ 블록 교환 ═════════════════════════════════

  swapGems(pos1, pos2) {
    if (this.isProcessing) return;

    const gem1 = this.board.getGem(pos1.row, pos1.col);
    const gem2 = this.board.getGem(pos2.row, pos2.col);
    if (!gem1 || !gem2) return;

    // 체인 장애물은 스왑 불가
    if (gem1.obstacle?.type === 'chain' || gem2.obstacle?.type === 'chain') {
      if (this.onInvalidSwap) this.onInvalidSwap();
      return;
    }
    // 나무상자는 스왑 불가
    if (gem1.colorIndex === -2 || gem2.colorIndex === -2) {
      if (this.onInvalidSwap) this.onInvalidSwap();
      return;
    }

    if (Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col) !== 1) return;

    this.isProcessing = true;
    this.comboCount = 0;

    // ── 특수+특수 조합 체크 ──
    if (gem1.isSpecial && gem2.isSpecial) {
      this.lastSwapPos = pos2;
      this.board.swapInGrid(gem1, gem2);
      const speed = GAME_CONFIG.ANIM.SWAP_SPEED;
      let done = 0;
      const onDone = () => {
        done++;
        if (done >= 2) {
          if (this.onMoveUsed) this.onMoveUsed();
          this.handleSpecialCombo(gem1, gem2);
        }
      };
      gem1.moveTo(pos2.row, pos2.col, speed, onDone);
      gem2.moveTo(pos1.row, pos1.col, speed, onDone);
      return;
    }

    // ── 무지개 + 일반 블록 ──
    if (gem1.specialType === 'rainbow' || gem2.specialType === 'rainbow') {
      const rainbow = gem1.specialType === 'rainbow' ? gem1 : gem2;
      const other = rainbow === gem1 ? gem2 : gem1;
      this.lastSwapPos = pos2;
      this.board.swapInGrid(gem1, gem2);
      const speed = GAME_CONFIG.ANIM.SWAP_SPEED;
      let done = 0;
      const onDone = () => {
        done++;
        if (done >= 2) {
          if (this.onMoveUsed) this.onMoveUsed();
          this.activateRainbow(rainbow, other.colorIndex);
        }
      };
      gem1.moveTo(pos2.row, pos2.col, speed, onDone);
      gem2.moveTo(pos1.row, pos1.col, speed, onDone);
      return;
    }

    // ── 일반 교환 ──
    this.lastSwapPos = pos2;
    this.board.swapInGrid(gem1, gem2);

    const speed = GAME_CONFIG.ANIM.SWAP_SPEED;
    let completed = 0;
    const onSwapDone = () => {
      completed++;
      if (completed < 2) return;

      const matchGroups = this.findMatchGroups();
      if (matchGroups.length > 0) {
        if (this.onMoveUsed) this.onMoveUsed();
        this.processMatchGroups(matchGroups);
      } else {
        // 되돌리기
        if (this.onInvalidSwap) this.onInvalidSwap();
        this.board.swapInGrid(gem1, gem2);
        let rev = 0;
        const onRev = () => { rev++; if (rev >= 2) this.isProcessing = false; };
        gem1.moveTo(gem1.row, gem1.col, speed, onRev);
        gem2.moveTo(gem2.row, gem2.col, speed, onRev);
      }
    };

    gem1.moveTo(pos2.row, pos2.col, speed, onSwapDone);
    gem2.moveTo(pos1.row, pos1.col, speed, onSwapDone);
  }

  // ═══ 매치 탐지 (구조화) ════════════════════════

  /** 가로/세로 run을 그룹으로 반환 */
  findMatchGroups() {
    const { rows, cols } = this.board;
    const hRuns = []; // { cells: [{row,col}], dir: 'h' }
    const vRuns = [];

    // 가로 스캔
    for (let row = 0; row < rows; row++) {
      let start = 0;
      for (let col = 1; col <= cols; col++) {
        const cur = this.board.getGem(row, col);
        const prev = this.board.getGem(row, col - 1);
        if (col < cols && cur && prev && !cur.isDestroying && !prev.isDestroying
          && cur.colorIndex === prev.colorIndex && cur.colorIndex >= 0) {
          continue;
        }
        if (col - start >= 3) {
          const cells = [];
          for (let c = start; c < col; c++) cells.push({ row, col: c });
          hRuns.push({ cells, dir: 'h' });
        }
        start = col;
      }
    }

    // 세로 스캔
    for (let col = 0; col < cols; col++) {
      let start = 0;
      for (let row = 1; row <= rows; row++) {
        const cur = this.board.getGem(row, col);
        const prev = this.board.getGem(row - 1, col);
        if (row < rows && cur && prev && !cur.isDestroying && !prev.isDestroying
          && cur.colorIndex === prev.colorIndex && cur.colorIndex >= 0) {
          continue;
        }
        if (row - start >= 3) {
          const cells = [];
          for (let r = start; r < row; r++) cells.push({ row: r, col });
          vRuns.push({ cells, dir: 'v' });
        }
        start = row;
      }
    }

    // 교차 감지: 같은 색의 H/V run이 셀을 공유하면 cross
    const groups = [];
    const usedH = new Set();
    const usedV = new Set();

    for (let hi = 0; hi < hRuns.length; hi++) {
      for (let vi = 0; vi < vRuns.length; vi++) {
        const hCells = hRuns[hi].cells;
        const vCells = vRuns[vi].cells;
        const hColor = this.board.getGem(hCells[0].row, hCells[0].col)?.colorIndex;
        const vColor = this.board.getGem(vCells[0].row, vCells[0].col)?.colorIndex;
        if (hColor !== vColor) continue;

        // 교차점 찾기
        const hSet = new Set(hCells.map(c => `${c.row},${c.col}`));
        const cross = vCells.find(c => hSet.has(`${c.row},${c.col}`));
        if (cross) {
          // L/T 교차 매치 → 폭탄
          const allCells = [...hCells];
          vCells.forEach(c => {
            if (!hSet.has(`${c.row},${c.col}`)) allCells.push(c);
          });
          groups.push({
            cells: allCells,
            type: 'cross',
            specialPos: cross,
            specialType: 'bomb',
          });
          usedH.add(hi);
          usedV.add(vi);
        }
      }
    }

    // 교차에 사용되지 않은 H/V run 처리
    hRuns.forEach((run, i) => {
      if (usedH.has(i)) return;
      const group = { cells: run.cells, type: 'h' };
      if (run.cells.length >= 5) {
        group.specialType = 'rainbow';
      } else if (run.cells.length === 4) {
        group.specialType = 'rocket_h';
      }
      // 특수블록 위치: 스와이프 위치 우선, 아니면 중앙
      if (group.specialType) {
        group.specialPos = this.pickSpecialPos(run.cells);
      }
      groups.push(group);
    });

    vRuns.forEach((run, i) => {
      if (usedV.has(i)) return;
      const group = { cells: run.cells, type: 'v' };
      if (run.cells.length >= 5) {
        group.specialType = 'rainbow';
      } else if (run.cells.length === 4) {
        group.specialType = 'rocket_v';
      }
      if (group.specialType) {
        group.specialPos = this.pickSpecialPos(run.cells);
      }
      groups.push(group);
    });

    return groups;
  }

  /** 특수블록 배치 위치 결정 */
  pickSpecialPos(cells) {
    // 스와이프 도착 위치가 매치에 포함되면 그곳에
    if (this.lastSwapPos) {
      const found = cells.find(c => c.row === this.lastSwapPos.row && c.col === this.lastSwapPos.col);
      if (found) return found;
    }
    // 아니면 중앙
    return cells[Math.floor(cells.length / 2)];
  }

  /** flat 매치 리스트 (연쇄용 — findMatchGroups 래퍼) */
  findMatches() {
    const groups = this.findMatchGroups();
    const set = new Set();
    groups.forEach(g => g.cells.forEach(c => set.add(`${c.row},${c.col}`)));
    return Array.from(set).map(k => {
      const [r, c] = k.split(',').map(Number);
      return { row: r, col: c };
    });
  }

  // ═══ 매치 처리 ═════════════════════════════════

  processMatchGroups(groups) {
    this.comboCount++;

    // 모든 셀 수집 (중복 제거)
    const cellSet = new Set();
    const specialsToCreate = [];  // { type, row, col, colorIndex }
    const specialsToActivate = []; // 기존 특수블록이 매치에 포함된 경우

    groups.forEach(group => {
      // 특수블록 생성 예약
      if (group.specialType && group.specialPos) {
        const gem = this.board.getGem(group.specialPos.row, group.specialPos.col);
        specialsToCreate.push({
          type: group.specialType,
          row: group.specialPos.row,
          col: group.specialPos.col,
          colorIndex: gem ? gem.colorIndex : 0,
        });
      }

      group.cells.forEach(c => {
        const gem = this.board.getGem(c.row, c.col);
        // 기존 특수블록이 매치에 포함 → 활성화
        if (gem && gem.isSpecial && !gem.isDestroying) {
          specialsToActivate.push(gem);
        }
        cellSet.add(`${c.row},${c.col}`);
      });
    });

    // 특수블록 배치 위치는 제거 대상에서 빼기
    const createPosSet = new Set(specialsToCreate.map(s => `${s.row},${s.col}`));

    // 점수
    const allCells = Array.from(cellSet).map(k => {
      const [r, c] = k.split(',').map(Number);
      return { row: r, col: c };
    });

    const baseScore = this.calculateScore(allCells.length);
    const multiplier = Math.pow(GAME_CONFIG.SCORE.COMBO_BASE, this.comboCount - 1);
    const points = Math.round(baseScore * multiplier);
    this.score += points;

    if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.comboCount);
    if (this.onMatchFound) this.onMatchFound(allCells, this.comboCount);

    // ── 장애물 인접 데미지 ──
    this._damageAdjacentObstacles(allCells);

    // 특수블록 활성화 (연쇄 폭발)
    const extraCells = new Set();
    specialsToActivate.forEach(gem => {
      if (createPosSet.has(`${gem.row},${gem.col}`)) return; // 새로 만들 자리면 스킵
      this.getSpecialTargets(gem).forEach(c => extraCells.add(`${c.row},${c.col}`));
    });

    // 추가 타겟도 제거 대상에 포함
    extraCells.forEach(key => cellSet.add(key));

    // 제거 실행
    const toDestroy = Array.from(cellSet)
      .map(k => { const [r, c] = k.split(',').map(Number); return { row: r, col: c }; })
      .filter(c => !createPosSet.has(`${c.row},${c.col}`));

    let destroyed = 0;
    const total = toDestroy.length;

    if (total === 0) {
      // 제거할 게 없으면 (특수블록만 생성)
      this.createSpecialGems(specialsToCreate);
      this.scene.time.delayedCall(GAME_CONFIG.ANIM.COMBO_DELAY, () => this.applyGravity());
      return;
    }

    toDestroy.forEach(({ row, col }) => {
      const gem = this.board.getGem(row, col);
      if (!gem || gem.isDestroying) {
        destroyed++;
        if (destroyed >= total) this.afterDestroy(specialsToCreate);
        return;
      }

      // 목표 추적
      if (this.onGemDestroyed && gem.color) {
        this.onGemDestroyed(gem.color);
      }

      // 이펙트
      const hex = gem.color ? GAME_CONFIG.COLOR_HEX[gem.color] : 0xffffff;
      this.effects.gemDestroy(row, col, hex);

      if (gem.isSpecial) {
        this.playSpecialEffect(gem);
      }

      gem.destroy(() => {
        destroyed++;
        if (destroyed >= total) this.afterDestroy(specialsToCreate);
      });
      this.board.grid[row][col] = null;
    });
  }

  afterDestroy(specialsToCreate) {
    this.createSpecialGems(specialsToCreate);
    this.scene.time.delayedCall(GAME_CONFIG.ANIM.COMBO_DELAY, () => this.applyGravity());
  }

  /** 특수블록 생성 */
  createSpecialGems(specials) {
    if (specials.length > 0 && this.onSpecialCreated) {
      this.onSpecialCreated();
    }
    specials.forEach(({ type, row, col, colorIndex }) => {
      // 기존 블록이 있으면 제거
      const existing = this.board.getGem(row, col);
      if (existing) {
        existing.destroyImmediate();
      }

      const cIdx = type === 'rainbow' ? 0 : colorIndex;
      const gem = new Gem(this.scene, row, col, cIdx);
      gem.makeSpecial(type);
      this.board.grid[row][col] = gem;

      // 등장 이펙트
      gem.allTargets.forEach(t => {
        if (t && t.active) { t.setScale(0); }
      });
      this.scene.tweens.add({
        targets: gem.allTargets,
        scaleX: 1, scaleY: 1,
        duration: 250,
        ease: 'Back.easeOut',
      });
    });
  }

  // ═══ 특수블록 활성화 ═══════════════════════════

  /** 특수블록이 터질 때 추가 타겟 셀 계산 */
  getSpecialTargets(gem) {
    const targets = [];
    const { rows, cols } = this.board;

    switch (gem.specialType) {
      case 'rocket_h':
        for (let c = 0; c < cols; c++) {
          if (c !== gem.col) targets.push({ row: gem.row, col: c });
        }
        break;
      case 'rocket_v':
        for (let r = 0; r < rows; r++) {
          if (r !== gem.row) targets.push({ row: r, col: gem.col });
        }
        break;
      case 'bomb': {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = gem.row + dr;
            const c = gem.col + dc;
            if (this.board.isValid(r, c) && !(dr === 0 && dc === 0)) {
              targets.push({ row: r, col: c });
            }
          }
        }
        break;
      }
      case 'rainbow':
        // 단독 매치 시 랜덤 색상 하나 제거
        break;
    }
    return targets;
  }

  /** 특수블록 비주얼 이펙트 */
  playSpecialEffect(gem) {
    if (this.onSpecialExploded) this.onSpecialExploded();
    switch (gem.specialType) {
      case 'rocket_h':
        this.effects.rocketExplode(gem.row, gem.col, 'h');
        break;
      case 'rocket_v':
        this.effects.rocketExplode(gem.row, gem.col, 'v');
        break;
      case 'bomb':
        this.effects.bombExplode(gem.row, gem.col, 1.5);
        break;
      case 'rainbow': {
        const hex = gem.color ? GAME_CONFIG.COLOR_HEX[gem.color] : 0xffffff;
        this.effects.rainbowExplode(gem.row, gem.col, hex);
        break;
      }
    }
  }

  /** 무지개 활성화: 특정 색상 전체 제거 */
  activateRainbow(rainbow, targetColorIndex) {
    const { rows, cols, grid } = this.board;
    const hex = GAME_CONFIG.COLOR_HEX[GAME_CONFIG.COLORS[targetColorIndex]];
    this.effects.rainbowExplode(rainbow.row, rainbow.col, hex);

    const toDestroy = [];

    // 무지개 자신
    toDestroy.push({ row: rainbow.row, col: rainbow.col });

    // 같은 색 블록 전부
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const gem = grid[r][c];
        if (gem && gem.colorIndex === targetColorIndex && gem !== rainbow) {
          toDestroy.push({ row: r, col: c });
        }
      }
    }

    this.comboCount++;
    const points = Math.round(toDestroy.length * GAME_CONFIG.SCORE.MATCH_3);
    this.score += points;
    if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.comboCount);

    let destroyed = 0;
    const total = toDestroy.length;

    toDestroy.forEach(({ row, col }) => {
      const gem = this.board.getGem(row, col);
      if (!gem || gem.isDestroying) {
        destroyed++;
        if (destroyed >= total) this.onAllDestroyed();
        return;
      }
      if (this.onGemDestroyed && gem.color) {
        this.onGemDestroyed(gem.color);
      }
      this.effects.gemDestroy(row, col, hex);
      gem.destroy(() => {
        destroyed++;
        if (destroyed >= total) this.onAllDestroyed();
      });
      this.board.grid[row][col] = null;
    });
  }

  // ═══ 특수+특수 조합 ═══════════════════════════

  handleSpecialCombo(gem1, gem2) {
    const t1 = gem1.specialType;
    const t2 = gem2.specialType;
    const types = [t1, t2].sort().join('+');

    const { rows, cols, grid } = this.board;
    const toDestroy = new Set();
    toDestroy.add(`${gem1.row},${gem1.col}`);
    toDestroy.add(`${gem2.row},${gem2.col}`);

    const centerRow = gem2.row;
    const centerCol = gem2.col;

    switch (types) {
      // 로켓+로켓 = 십자 (가로+세로)
      case 'rocket_h+rocket_v':
      case 'rocket_h+rocket_h':
      case 'rocket_v+rocket_v':
        this.effects.rocketExplode(centerRow, centerCol, 'both');
        for (let c = 0; c < cols; c++) toDestroy.add(`${centerRow},${c}`);
        for (let r = 0; r < rows; r++) toDestroy.add(`${r},${centerCol}`);
        break;

      // 폭탄+폭탄 = 5x5
      case 'bomb+bomb':
        this.effects.bombExplode(centerRow, centerCol, 2.5);
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const r = centerRow + dr, c = centerCol + dc;
            if (this.board.isValid(r, c)) toDestroy.add(`${r},${c}`);
          }
        }
        break;

      // 로켓+폭탄 = 3행3열 십자
      case 'bomb+rocket_h':
      case 'bomb+rocket_v':
        this.effects.rocketExplode(centerRow, centerCol, 'both');
        this.effects.bombExplode(centerRow, centerCol, 2);
        for (let d = -1; d <= 1; d++) {
          for (let c = 0; c < cols; c++) {
            if (this.board.isValid(centerRow + d, c)) toDestroy.add(`${centerRow + d},${c}`);
          }
          for (let r = 0; r < rows; r++) {
            if (this.board.isValid(r, centerCol + d)) toDestroy.add(`${r},${centerCol + d}`);
          }
        }
        break;

      // 무지개+무지개 = 보드 전체
      case 'rainbow+rainbow':
        this.effects.boardClearFlash();
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) toDestroy.add(`${r},${c}`);
        }
        break;

      // 무지개+로켓 = 모든 같은색 → 로켓
      case 'rainbow+rocket_h':
      case 'rainbow+rocket_v': {
        const rainbow = t1 === 'rainbow' ? gem1 : gem2;
        const rocket = rainbow === gem1 ? gem2 : gem1;
        const targetColor = rocket.colorIndex;
        const hex = GAME_CONFIG.COLOR_HEX[GAME_CONFIG.COLORS[targetColor]];
        this.effects.rainbowExplode(rainbow.row, rainbow.col, hex);

        // 같은 색 전부 로켓으로 변환 후 폭발
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const g = grid[r][c];
            if (g && g.colorIndex === targetColor) {
              // 해당 줄 전체 추가
              for (let cc = 0; cc < cols; cc++) toDestroy.add(`${r},${cc}`);
              for (let rr = 0; rr < rows; rr++) toDestroy.add(`${rr},${c}`);
            }
          }
        }
        toDestroy.add(`${rainbow.row},${rainbow.col}`);
        break;
      }

      // 무지개+폭탄 = 모든 같은색 → 폭탄
      case 'bomb+rainbow': {
        const rainbow = t1 === 'rainbow' ? gem1 : gem2;
        const bomb = rainbow === gem1 ? gem2 : gem1;
        const targetColor = bomb.colorIndex;
        const hex = GAME_CONFIG.COLOR_HEX[GAME_CONFIG.COLORS[targetColor]];
        this.effects.rainbowExplode(rainbow.row, rainbow.col, hex);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const g = grid[r][c];
            if (g && g.colorIndex === targetColor) {
              for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                  if (this.board.isValid(r + dr, c + dc)) toDestroy.add(`${r + dr},${c + dc}`);
                }
              }
            }
          }
        }
        toDestroy.add(`${rainbow.row},${rainbow.col}`);
        break;
      }

      default:
        // 알 수 없는 조합 → 둘 다 그냥 제거
        break;
    }

    this.comboCount++;
    const points = Math.round(toDestroy.size * GAME_CONFIG.SCORE.MATCH_3);
    this.score += points;
    if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.comboCount);

    // 장애물 인접 데미지 (특수 조합 폭발 범위)
    const comboCells = Array.from(toDestroy).map(k => {
      const [r, c] = k.split(',').map(Number);
      return { row: r, col: c };
    });
    this._damageAdjacentObstacles(comboCells);

    // 일괄 제거
    let destroyed = 0;
    const total = toDestroy.size;

    toDestroy.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      const gem = this.board.getGem(r, c);
      if (!gem || gem.isDestroying) {
        destroyed++;
        if (destroyed >= total) this.onAllDestroyed();
        return;
      }
      // 나무상자는 직접 파괴하지 않음 (인접 데미지로만 처리)
      if (gem.colorIndex === -2) {
        destroyed++;
        if (destroyed >= total) this.onAllDestroyed();
        return;
      }
      if (this.onGemDestroyed && gem.color) {
        this.onGemDestroyed(gem.color);
      }
      const hex = gem.color ? GAME_CONFIG.COLOR_HEX[gem.color] : 0xffffff;
      this.effects.gemDestroy(r, c, hex);
      gem.destroy(() => {
        destroyed++;
        if (destroyed >= total) this.onAllDestroyed();
      });
      this.board.grid[r][c] = null;
    });
  }

  // ═══ 장애물 처리 ═══════════════════════════════

  /** 매치된 셀 인접 장애물 데미지 */
  _damageAdjacentObstacles(matchedCells) {
    const toDamage = new Set();

    matchedCells.forEach(({ row, col }) => {
      const neighbors = [
        { row: row - 1, col },
        { row: row + 1, col },
        { row, col: col - 1 },
        { row, col: col + 1 },
      ];
      neighbors.forEach(n => {
        if (!this.board.isValid(n.row, n.col)) return;
        const gem = this.board.getGem(n.row, n.col);
        if (gem && gem.obstacle) {
          toDamage.add(`${n.row},${n.col}`);
        }
      });
    });

    toDamage.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      const gem = this.board.getGem(r, c);
      if (!gem || !gem.obstacle) return;

      const obstacleType = gem.obstacle.type;
      const stillExists = gem.damageObstacle();

      // 이펙트
      this.effects.obstacleDamage(r, c, obstacleType, !stillExists);

      if (!stillExists) {
        if (this.onObstacleDestroyed) {
          this.onObstacleDestroyed(obstacleType);
        }
        // 나무상자: 셀 비우기
        if (obstacleType === 'wood') {
          gem.destroyImmediate();
          this.board.grid[r][c] = null;
        }
        // ice/chain: 젬은 남아있음 (정상 블록으로 전환)
      }
    });
  }

  // ═══ 점수 ═════════════════════════════════════

  calculateScore(matchSize) {
    if (matchSize >= 5) return GAME_CONFIG.SCORE.MATCH_5;
    if (matchSize >= 4) return GAME_CONFIG.SCORE.MATCH_4;
    return GAME_CONFIG.SCORE.MATCH_3;
  }

  // ═══ 중력 ═════════════════════════════════════

  onAllDestroyed() {
    this.scene.time.delayedCall(GAME_CONFIG.ANIM.COMBO_DELAY, () => this.applyGravity());
  }

  applyGravity() {
    const { rows, cols } = this.board;
    const fallPromises = [];
    let hasFall = false;

    for (let col = 0; col < cols; col++) {
      // 나무상자를 "바닥"으로 처리 → 컬럼을 세그먼트로 분할
      const segments = []; // { start, end } (inclusive row range)
      let segStart = 0;

      for (let row = 0; row <= rows; row++) {
        const gem = row < rows ? this.board.grid[row][col] : null;
        const isWood = gem && gem.colorIndex === -2;

        if (isWood || row === rows) {
          if (row > segStart) {
            segments.push({ start: segStart, end: row - 1 });
          }
          segStart = row + 1;
        }
      }

      // 각 세그먼트 내에서 중력 적용
      segments.forEach(({ start, end }) => {
        let emptyRow = -1;

        for (let row = end; row >= start; row--) {
          if (!this.board.grid[row][col]) {
            if (emptyRow === -1) emptyRow = row;
          } else if (emptyRow !== -1) {
            const gem = this.board.grid[row][col];
            this.board.grid[row][col] = null;
            this.board.grid[emptyRow][col] = gem;

            const dist = emptyRow - row;
            hasFall = true;
            fallPromises.push(new Promise(resolve => {
              gem.moveTo(emptyRow, col, dist * GAME_CONFIG.ANIM.FALL_SPEED, resolve);
            }));
            emptyRow--;
          }
        }

        // 최상단 세그먼트(start === 0)만 새 젬 스폰
        if (start === 0 && emptyRow >= 0) {
          let spawnOffset = 0;
          for (let row = emptyRow; row >= 0; row--) {
            if (this.board.grid[row][col]) continue;

            const colorIndex = Math.floor(Math.random() * this.board.numColors);
            const gem = new Gem(this.scene, -1, col, colorIndex);
            const startPos = Gem.getPixelPos(-1 - spawnOffset, col);
            gem.allTargets.forEach(t => { if (t && t.active) t.setPosition(startPos.x, startPos.y); });

            this.board.grid[row][col] = gem;
            const dist = row + 1 + spawnOffset;
            hasFall = true;
            fallPromises.push(new Promise(resolve => {
              gem.moveTo(row, col, dist * GAME_CONFIG.ANIM.FALL_SPEED, resolve);
            }));
            spawnOffset++;
          }
        }
      });
    }

    if (hasFall) {
      Promise.all(fallPromises).then(() => this.checkCascade());
    } else {
      this.checkCascade();
    }
  }

  // ═══ 연쇄 & 유효이동 & 셔플 ═══════════════════

  checkCascade() {
    this.lastSwapPos = null; // 연쇄 중에는 스와이프 위치 무시
    const groups = this.findMatchGroups();
    if (groups.length > 0) {
      this.processMatchGroups(groups);
    } else {
      this.comboCount = 0;
      this.isProcessing = false;

      if (!this.hasValidMoves()) {
        if (this.onNoValidMoves) this.onNoValidMoves();
        this.shuffleBoard();
      }
    }
  }

  hasValidMoves() {
    const { rows, cols, grid } = this.board;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gem = grid[row][col];
        if (!gem) continue;
        // 체인/나무상자는 스왑 불가
        if (gem.obstacle?.type === 'chain') continue;
        if (gem.colorIndex === -2) continue;
        // 무지개 블록이 있으면 항상 유효 이동 있음
        if (gem.specialType === 'rainbow') return true;

        if (col < cols - 1) {
          const right = grid[row][col + 1];
          if (right && right.obstacle?.type !== 'chain' && right.colorIndex !== -2) {
            this.simSwap(grid, row, col, row, col + 1);
            if (this.findMatchesInGrid(grid).length > 0) {
              this.simSwap(grid, row, col, row, col + 1);
              return true;
            }
            this.simSwap(grid, row, col, row, col + 1);
          }
        }
        if (row < rows - 1) {
          const below = grid[row + 1][col];
          if (below && below.obstacle?.type !== 'chain' && below.colorIndex !== -2) {
            this.simSwap(grid, row, col, row + 1, col);
            if (this.findMatchesInGrid(grid).length > 0) {
              this.simSwap(grid, row, col, row + 1, col);
              return true;
            }
            this.simSwap(grid, row, col, row + 1, col);
          }
        }
      }
    }
    return false;
  }

  simSwap(grid, r1, c1, r2, c2) {
    [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
  }

  findMatchesInGrid(grid) {
    const { rows, cols } = this.board;
    const matched = [];
    for (let row = 0; row < rows; row++) {
      let len = 1;
      for (let col = 1; col < cols; col++) {
        if (grid[row][col] && grid[row][col - 1]
          && grid[row][col].colorIndex === grid[row][col - 1].colorIndex
          && grid[row][col].colorIndex >= 0) {
          len++;
        } else {
          if (len >= 3) matched.push({ row, col: col - 1 });
          len = 1;
        }
      }
      if (len >= 3) matched.push({ row, col: cols - 1 });
    }
    for (let col = 0; col < cols; col++) {
      let len = 1;
      for (let row = 1; row < rows; row++) {
        if (grid[row][col] && grid[row - 1][col]
          && grid[row][col].colorIndex === grid[row - 1][col].colorIndex
          && grid[row][col].colorIndex >= 0) {
          len++;
        } else {
          if (len >= 3) matched.push({ row: row - 1, col });
          len = 1;
        }
      }
      if (len >= 3) matched.push({ row: rows - 1, col });
    }
    return matched;
  }

  shuffleBoard() {
    const MAX_SHUFFLE = 10;
    const { rows, cols, grid } = this.board;
    for (let attempt = 0; attempt < MAX_SHUFFLE; attempt++) {
      // 나무상자/체인 제외, 이동 가능한 젬만 셔플
      const gems = [];
      const positions = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const gem = grid[r][c];
          if (gem && gem.colorIndex !== -2 && gem.obstacle?.type !== 'chain') {
            gems.push(gem);
            positions.push({ r, c });
          }
        }
      }

      for (let i = gems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gems[i], gems[j]] = [gems[j], gems[i]];
      }

      positions.forEach(({ r, c }, idx) => {
        grid[r][c] = gems[idx];
        gems[idx].moveTo(r, c, GAME_CONFIG.ANIM.SWAP_SPEED);
      });

      if (this.hasValidMoves()) {
        const matches = this.findMatches();
        if (matches.length > 0) {
          this.scene.time.delayedCall(GAME_CONFIG.ANIM.SWAP_SPEED + 50, () => {
            this.isProcessing = true;
            this.processMatchGroups(this.findMatchGroups());
          });
        }
        return;
      }
    }
    this.regenerateBoard();
  }

  regenerateBoard() {
    this.board.destroyAll();
    this.board.createBoard();
    this.isProcessing = false;
    if (!this.hasValidMoves()) this.shuffleBoard();
  }
}
