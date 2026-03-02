import { GAME_CONFIG } from '../config.js';
import { Gem } from './Gem.js';

export class Match3Engine {
  constructor(scene, board) {
    this.scene = scene;
    this.board = board;
    this.isProcessing = false;
    this.comboCount = 0;
    this.score = 0;

    // 콜백
    this.onScoreUpdate = null;   // (score, combo) => void
    this.onMatchFound = null;    // (matches, combo) => void
    this.onMoveUsed = null;      // () => void
    this.onNoValidMoves = null;  // () => void (셔플 알림)
  }

  // ─── 블록 교환 ─────────────────────────────────

  /** 두 블록 교환 시도 */
  swapGems(pos1, pos2) {
    if (this.isProcessing) return;

    const gem1 = this.board.getGem(pos1.row, pos1.col);
    const gem2 = this.board.getGem(pos2.row, pos2.col);
    if (!gem1 || !gem2) return;

    // 인접한지 확인
    const dr = Math.abs(pos1.row - pos2.row);
    const dc = Math.abs(pos1.col - pos2.col);
    if (dr + dc !== 1) return;

    this.isProcessing = true;
    this.comboCount = 0;

    // 논리적 교환
    this.board.swapInGrid(gem1, gem2);

    // 교환 애니메이션
    const speed = GAME_CONFIG.ANIM.SWAP_SPEED;
    let completed = 0;
    const onSwapDone = () => {
      completed++;
      if (completed < 2) return;

      // 매치 확인
      const matches = this.findMatches();
      if (matches.length > 0) {
        if (this.onMoveUsed) this.onMoveUsed();
        this.processMatches(matches);
      } else {
        // 매치 없음 → 되돌리기
        this.board.swapInGrid(gem1, gem2);
        let reverted = 0;
        const onRevertDone = () => {
          reverted++;
          if (reverted >= 2) {
            this.isProcessing = false;
          }
        };
        gem1.moveTo(gem1.row, gem1.col, speed, onRevertDone);
        gem2.moveTo(gem2.row, gem2.col, speed, onRevertDone);
      }
    };

    gem1.moveTo(pos2.row, pos2.col, speed, onSwapDone);
    gem2.moveTo(pos1.row, pos1.col, speed, onSwapDone);
  }

  // ─── 매치 탐지 ─────────────────────────────────

  /** 보드 전체에서 매치 찾기 */
  findMatches() {
    const { rows, cols } = this.board;
    const matched = new Set();

    // 가로 스캔
    for (let row = 0; row < rows; row++) {
      let runStart = 0;
      for (let col = 1; col <= cols; col++) {
        const current = this.board.getGem(row, col);
        const prev = this.board.getGem(row, col - 1);

        if (col < cols && current && prev && !current.isDestroying && !prev.isDestroying
          && current.colorIndex === prev.colorIndex) {
          continue;
        }
        // run 끊김
        const runLen = col - runStart;
        if (runLen >= 3) {
          for (let c = runStart; c < col; c++) {
            matched.add(`${row},${c}`);
          }
        }
        runStart = col;
      }
    }

    // 세로 스캔
    for (let col = 0; col < cols; col++) {
      let runStart = 0;
      for (let row = 1; row <= rows; row++) {
        const current = this.board.getGem(row, col);
        const prev = this.board.getGem(row - 1, col);

        if (row < rows && current && prev && !current.isDestroying && !prev.isDestroying
          && current.colorIndex === prev.colorIndex) {
          continue;
        }
        const runLen = row - runStart;
        if (runLen >= 3) {
          for (let r = runStart; r < row; r++) {
            matched.add(`${r},${col}`);
          }
        }
        runStart = row;
      }
    }

    // Set → 좌표 배열
    return Array.from(matched).map(key => {
      const [r, c] = key.split(',').map(Number);
      return { row: r, col: c };
    });
  }

  // ─── 매치 처리 ─────────────────────────────────

  /** 매치 제거 → 중력 → 연쇄 체크 */
  processMatches(matches) {
    this.comboCount++;

    // 점수 계산
    const baseScore = this.calculateScore(matches.length);
    const multiplier = Math.pow(GAME_CONFIG.SCORE.COMBO_BASE, this.comboCount - 1);
    const points = Math.round(baseScore * multiplier);
    this.score += points;

    if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.comboCount);
    if (this.onMatchFound) this.onMatchFound(matches, this.comboCount);

    // 제거 애니메이션
    let destroyed = 0;
    const total = matches.length;

    matches.forEach(({ row, col }) => {
      const gem = this.board.getGem(row, col);
      if (!gem || gem.isDestroying) {
        destroyed++;
        if (destroyed >= total) this.onAllDestroyed();
        return;
      }
      gem.destroy(() => {
        destroyed++;
        if (destroyed >= total) this.onAllDestroyed();
      });
      this.board.grid[row][col] = null;
    });
  }

  /** 모든 제거 완료 후 → 중력 적용 */
  onAllDestroyed() {
    this.scene.time.delayedCall(GAME_CONFIG.ANIM.COMBO_DELAY, () => {
      this.applyGravity();
    });
  }

  /** 점수 계산 (매치 크기 기반) */
  calculateScore(matchSize) {
    if (matchSize >= 5) return GAME_CONFIG.SCORE.MATCH_5;
    if (matchSize >= 4) return GAME_CONFIG.SCORE.MATCH_4;
    return GAME_CONFIG.SCORE.MATCH_3;
  }

  // ─── 중력 (빈 칸 채우기) ──────────────────────

  /** 열별로 독립적으로 중력 처리 */
  applyGravity() {
    const { rows, cols } = this.board;
    const fallPromises = [];
    let hasFall = false;

    // 각 열 독립 처리
    for (let col = 0; col < cols; col++) {
      // 아래에서 위로 스캔, 빈 칸 찾기
      let emptyRow = -1;

      for (let row = rows - 1; row >= 0; row--) {
        if (!this.board.grid[row][col]) {
          if (emptyRow === -1) emptyRow = row;
        } else if (emptyRow !== -1) {
          // 이 블록을 emptyRow 위치로 떨어뜨림
          const gem = this.board.grid[row][col];
          this.board.grid[row][col] = null;
          this.board.grid[emptyRow][col] = gem;

          const fallDist = emptyRow - row;
          const duration = fallDist * GAME_CONFIG.ANIM.FALL_SPEED;
          hasFall = true;

          fallPromises.push(new Promise(resolve => {
            gem.moveTo(emptyRow, col, duration, resolve);
          }));

          emptyRow--;
        }
      }

      // 위쪽 빈 칸에 새 블록 생성
      for (let row = emptyRow; row >= 0; row--) {
        if (this.board.grid[row][col]) continue;

        const colorIndex = Math.floor(Math.random() * this.board.numColors);
        const gem = new Gem(this.scene, -1, col, colorIndex);

        // 보드 위에서 시작
        const startPos = Gem.getPixelPos(-1 - (emptyRow - row), col);
        gem.sprite.setPosition(startPos.x, startPos.y);
        gem.icon.setPosition(startPos.x, startPos.y);

        this.board.grid[row][col] = gem;

        const fallDist = row + 1 + (emptyRow - row);
        const duration = fallDist * GAME_CONFIG.ANIM.FALL_SPEED;
        hasFall = true;

        fallPromises.push(new Promise(resolve => {
          gem.moveTo(row, col, duration, resolve);
        }));
      }
    }

    if (hasFall) {
      Promise.all(fallPromises).then(() => {
        this.checkCascade();
      });
    } else {
      this.checkCascade();
    }
  }

  // ─── 연쇄 & 유효 이동 ─────────────────────────

  /** 연쇄 매치 확인 */
  checkCascade() {
    const matches = this.findMatches();
    if (matches.length > 0) {
      this.processMatches(matches);
    } else {
      // 연쇄 종료
      this.comboCount = 0;
      this.isProcessing = false;

      if (!this.hasValidMoves()) {
        if (this.onNoValidMoves) this.onNoValidMoves();
        this.shuffleBoard();
      }
    }
  }

  /** 유효한 이동이 있는지 확인 */
  hasValidMoves() {
    const { rows, cols, grid } = this.board;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // 오른쪽과 교환 시뮬레이션
        if (col < cols - 1) {
          this.simulateSwap(grid, row, col, row, col + 1);
          if (this.findMatchesInGrid(grid).length > 0) {
            this.simulateSwap(grid, row, col, row, col + 1); // 원복
            return true;
          }
          this.simulateSwap(grid, row, col, row, col + 1); // 원복
        }
        // 아래와 교환 시뮬레이션
        if (row < rows - 1) {
          this.simulateSwap(grid, row, col, row + 1, col);
          if (this.findMatchesInGrid(grid).length > 0) {
            this.simulateSwap(grid, row, col, row + 1, col); // 원복
            return true;
          }
          this.simulateSwap(grid, row, col, row + 1, col); // 원복
        }
      }
    }
    return false;
  }

  /** grid 배열에서 직접 교환 (시뮬레이션용) */
  simulateSwap(grid, r1, c1, r2, c2) {
    const temp = grid[r1][c1];
    grid[r1][c1] = grid[r2][c2];
    grid[r2][c2] = temp;
  }

  /** grid 기반 매치 탐색 (시뮬레이션용, 화면 무관) */
  findMatchesInGrid(grid) {
    const { rows, cols } = this.board;
    const matched = [];

    // 가로
    for (let row = 0; row < rows; row++) {
      let runLen = 1;
      for (let col = 1; col < cols; col++) {
        if (grid[row][col] && grid[row][col - 1]
          && grid[row][col].colorIndex === grid[row][col - 1].colorIndex) {
          runLen++;
        } else {
          if (runLen >= 3) matched.push({ row, col: col - 1 });
          runLen = 1;
        }
      }
      if (runLen >= 3) matched.push({ row, col: cols - 1 });
    }

    // 세로
    for (let col = 0; col < cols; col++) {
      let runLen = 1;
      for (let row = 1; row < rows; row++) {
        if (grid[row][col] && grid[row - 1][col]
          && grid[row][col].colorIndex === grid[row - 1][col].colorIndex) {
          runLen++;
        } else {
          if (runLen >= 3) matched.push({ row: row - 1, col });
          runLen = 1;
        }
      }
      if (runLen >= 3) matched.push({ row: rows - 1, col });
    }

    return matched;
  }

  // ─── 셔플 ─────────────────────────────────────

  /** 보드 셔플 (무한 루프 방지) */
  shuffleBoard() {
    const MAX_SHUFFLE = 10;
    const { rows, cols, grid } = this.board;

    for (let attempt = 0; attempt < MAX_SHUFFLE; attempt++) {
      // Fisher-Yates 셔플
      const gems = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          gems.push(grid[row][col]);
        }
      }

      for (let i = gems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gems[i], gems[j]] = [gems[j], gems[i]];
      }

      // 셔플된 순서를 그리드에 배치
      let idx = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          grid[row][col] = gems[idx++];
          grid[row][col].moveTo(row, col, GAME_CONFIG.ANIM.SWAP_SPEED);
        }
      }

      // 초기 매치 제거가 어려우므로 일단 유효 이동만 확인
      if (this.hasValidMoves() && this.findMatches().length === 0) {
        return;
      }

      // 매치가 있으면 연쇄가 알아서 처리할 테니 OK
      if (this.hasValidMoves()) {
        // 기존 매치가 있다면 처리
        const matches = this.findMatches();
        if (matches.length > 0) {
          this.scene.time.delayedCall(GAME_CONFIG.ANIM.SWAP_SPEED + 50, () => {
            this.isProcessing = true;
            this.processMatches(matches);
          });
        }
        return;
      }
    }

    // 셔플 실패 → 보드 재생성
    this.regenerateBoard();
  }

  /** 보드 전체 재생성 */
  regenerateBoard() {
    this.board.destroyAll();
    this.board.createBoard();
    this.isProcessing = false;

    // 재생성 후에도 유효 이동 확인
    if (!this.hasValidMoves()) {
      this.shuffleBoard();
    }
  }
}
