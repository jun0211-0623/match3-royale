import { LEVELS, WORLDS } from '../data/levels.js';

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

  /** 월드 목록 */
  static getWorlds() {
    return WORLDS;
  }

  /** 레벨이 속한 월드 */
  static getWorldForLevel(levelNumber) {
    return WORLDS.find(w => levelNumber >= w.levels[0] && levelNumber <= w.levels[1]) || null;
  }

  /** 월드 잠금 해제 여부 */
  static isWorldUnlocked(worldId, unlockedLevel) {
    const world = WORLDS.find(w => w.id === worldId);
    if (!world) return false;
    return unlockedLevel >= world.levels[0];
  }
}
