import { GAME_CONFIG } from '../config.js';

/**
 * 레벨 목표 추적
 * 매치될 때마다 onGemDestroyed(colorIndex)를 호출하여 목표 진행
 */
export class GoalManager {
  constructor(levelData) {
    this.moves = levelData.moves;
    this.movesLeft = levelData.moves;
    this.starThresholds = levelData.stars;
    this.reward = levelData.reward;

    // 목표 복사 (진행 상태 포함)
    this.goals = levelData.goals.map(g => ({
      ...g,
      current: 0,
    }));

    this.onGoalUpdate = null;   // (goals) => {}
    this.onGoalComplete = null; // () => {}
  }

  /** 블록 제거 시 호출 */
  onGemDestroyed(colorName) {
    let changed = false;
    this.goals.forEach(goal => {
      if (goal.type === 'collect' && goal.color === colorName && goal.current < goal.count) {
        goal.current++;
        changed = true;
      }
    });
    if (changed && this.onGoalUpdate) {
      this.onGoalUpdate(this.goals);
    }
  }

  /** 장애물 파괴 시 호출 */
  onObstacleDestroyed(obstacleType) {
    let changed = false;
    this.goals.forEach(goal => {
      if (goal.type === 'destroy_obstacle' && goal.obstacleType === obstacleType && goal.current < goal.count) {
        goal.current++;
        changed = true;
      }
    });
    if (changed && this.onGoalUpdate) {
      this.onGoalUpdate(this.goals);
    }
  }

  /** 이동 사용 */
  useMove() {
    this.movesLeft--;
  }

  /** 이동 추가 */
  addMoves(count) {
    this.movesLeft += count;
  }

  /** 모든 목표 달성 여부 */
  isAllGoalsComplete() {
    return this.goals.every(g => g.current >= g.count);
  }

  /** 별 계산 (남은 이동 기준) */
  calculateStars() {
    if (!this.isAllGoalsComplete()) return 0;
    const left = this.movesLeft;
    if (left >= this.starThresholds.three) return 3;
    if (left >= this.starThresholds.two) return 2;
    if (left >= this.starThresholds.one) return 1;
    return 1; // 클리어했으면 최소 1별
  }

  /** 코인 보상 */
  getRewardCoins(stars) {
    return (this.reward?.coins || 50) * stars;
  }
}
