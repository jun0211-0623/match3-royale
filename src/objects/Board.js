import { GAME_CONFIG } from '../config.js';
import { Gem } from './Gem.js';

export class Board {
  constructor(scene, numColors, levelData = null) {
    this.scene = scene;
    this.rows = GAME_CONFIG.BOARD.ROWS;
    this.cols = GAME_CONFIG.BOARD.COLS;
    this.numColors = numColors || 4;
    this.levelData = levelData;
    this.grid = [];

    this.createBoard();
  }

  /** 보드 생성 (초기 매치 방지 + 장애물 배치) */
  createBoard() {
    this.grid = [];
    const obstacles = this.levelData?.obstacles || [];

    // 장애물 위치 맵
    const obsMap = {};
    obstacles.forEach(o => { obsMap[`${o.row},${o.col}`] = o; });

    for (let row = 0; row < this.rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.cols; col++) {
        const obsData = obsMap[`${row},${col}`];

        if (obsData && obsData.type === 'wood') {
          // 나무상자: 젬 없이 셀 점유
          this.grid[row][col] = Gem.createWoodBox(this.scene, row, col, obsData.layers);
        } else {
          const colorIndex = this.getSafeColor(row, col);
          const gem = new Gem(this.scene, row, col, colorIndex);

          if (obsData) {
            // 얼음 또는 체인: 기존 젬 위에 오버레이
            gem.setObstacle(obsData.type, obsData.layers);
          }

          this.grid[row][col] = gem;
        }
      }
    }
  }

  /** 초기 매치가 생기지 않는 색상 선택 */
  getSafeColor(row, col) {
    const maxAttempts = 50;
    for (let i = 0; i < maxAttempts; i++) {
      const colorIndex = Math.floor(Math.random() * this.numColors);
      if (!this.wouldMatch(row, col, colorIndex)) {
        return colorIndex;
      }
    }
    // fallback: 아무 색이나 (매우 드문 경우)
    return Math.floor(Math.random() * this.numColors);
  }

  /** 해당 위치에 이 색을 놓으면 3매치가 되는지 검사 */
  wouldMatch(row, col, colorIndex) {
    // 가로 왼쪽 2칸 같은 색?
    if (col >= 2
      && this.grid[row][col - 1]?.colorIndex === colorIndex
      && this.grid[row][col - 2]?.colorIndex === colorIndex) {
      return true;
    }
    // 세로 위쪽 2칸 같은 색?
    if (row >= 2
      && this.grid[row - 1]?.[col]?.colorIndex === colorIndex
      && this.grid[row - 2]?.[col]?.colorIndex === colorIndex) {
      return true;
    }
    return false;
  }

  /** 격자 범위 확인 */
  isValid(row, col) {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  /** 특정 위치의 Gem 가져오기 */
  getGem(row, col) {
    if (!this.isValid(row, col)) return null;
    return this.grid[row][col];
  }

  /** 두 Gem의 격자 위치 교환 (논리적) */
  swapInGrid(gem1, gem2) {
    const { row: r1, col: c1 } = gem1;
    const { row: r2, col: c2 } = gem2;
    this.grid[r1][c1] = gem2;
    this.grid[r2][c2] = gem1;
  }

  /** 보드 전체 제거 */
  destroyAll() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col]) {
          this.grid[row][col].destroyImmediate();
          this.grid[row][col] = null;
        }
      }
    }
  }
}
