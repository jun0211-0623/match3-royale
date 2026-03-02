import { LEVELS } from '../data/levels.js';

/**
 * 레벨 데이터 제공
 */
export class LevelManager {
  static getLevel(levelNumber) {
    return LEVELS.find(l => l.level === levelNumber) || null;
  }

  static getTotalLevels() {
    return LEVELS.length;
  }

  /** 레벨이 존재하는지 */
  static hasLevel(levelNumber) {
    return levelNumber >= 1 && levelNumber <= LEVELS.length;
  }
}
