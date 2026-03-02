import { GAME_CONFIG } from '../config.js';

/**
 * 힌트 시스템
 * 5초 대기 시 가능한 매치 위치를 반짝임으로 안내
 */
export class HintManager {
  constructor(scene, engine) {
    this.scene = scene;
    this.engine = engine;
    this.hintDelay = 5000; // 5초
    this.hintTimer = null;
    this.hintTweens = [];
    this.active = false;
  }

  /** 타이머 시작 (매 입력 후 리셋) */
  resetTimer() {
    this.clearHint();
    if (this.hintTimer) {
      this.hintTimer.remove(false);
    }
    this.hintTimer = this.scene.time.delayedCall(this.hintDelay, () => {
      this.showHint();
    });
  }

  /** 힌트 표시 중지 */
  clearHint() {
    this.hintTweens.forEach(tw => {
      if (tw && tw.isPlaying) tw.stop();
    });
    this.hintTweens = [];

    // 블록 알파 복원
    if (this._hintGems) {
      this._hintGems.forEach(gem => {
        if (gem && gem.sprite && gem.sprite.active) {
          gem.allTargets.forEach(t => {
            if (t && t.active) t.setAlpha(1);
          });
        }
      });
      this._hintGems = null;
    }
    this.active = false;
  }

  /** 가능한 매치를 찾아 반짝임 */
  showHint() {
    if (this.engine.isProcessing) return;

    const pair = this.findHintPair();
    if (!pair) return;

    this.active = true;
    this._hintGems = [];

    const { board } = this.engine;
    const gem1 = board.getGem(pair.r1, pair.c1);
    const gem2 = board.getGem(pair.r2, pair.c2);

    [gem1, gem2].forEach(gem => {
      if (!gem || !gem.sprite || !gem.sprite.active) return;
      this._hintGems.push(gem);

      const tw = this.scene.tweens.add({
        targets: gem.allTargets,
        alpha: 0.4,
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.hintTweens.push(tw);
    });
  }

  /** 유효한 스와이프 쌍 찾기 */
  findHintPair() {
    const { rows, cols, grid } = this.engine.board;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // 무지개 블록
        if (grid[row][col]?.specialType === 'rainbow') {
          // 인접 블록과 쌍
          if (col < cols - 1) return { r1: row, c1: col, r2: row, c2: col + 1 };
          if (row < rows - 1) return { r1: row, c1: col, r2: row + 1, c2: col };
        }

        // 오른쪽과 스와이프
        if (col < cols - 1) {
          this.engine.simSwap(grid, row, col, row, col + 1);
          const hasMatch = this.engine.findMatchesInGrid(grid).length > 0;
          this.engine.simSwap(grid, row, col, row, col + 1);
          if (hasMatch) return { r1: row, c1: col, r2: row, c2: col + 1 };
        }

        // 아래와 스와이프
        if (row < rows - 1) {
          this.engine.simSwap(grid, row, col, row + 1, col);
          const hasMatch = this.engine.findMatchesInGrid(grid).length > 0;
          this.engine.simSwap(grid, row, col, row + 1, col);
          if (hasMatch) return { r1: row, c1: col, r2: row + 1, c2: col };
        }
      }
    }
    return null;
  }

  /** 정리 */
  destroy() {
    this.clearHint();
    if (this.hintTimer) {
      this.hintTimer.remove(false);
      this.hintTimer = null;
    }
  }
}
