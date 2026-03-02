import { GAME_CONFIG } from '../config.js';
import { SaveManager } from './SaveManager.js';

/**
 * 부스터 아이템 관리
 * - 망치(Hammer): 블록 1개 즉시 제거
 * - 셔플(Shuffle): 보드 재배치
 * - +5 이동(ExtraMoves): 이동 횟수 추가
 */
export const BOOSTERS = {
  hammer: {
    id: 'hammer',
    name: '망치',
    icon: '🔨',
    cost: GAME_CONFIG.ECONOMY.BOOSTER_HAMMER,
    description: '블록 1개 즉시 제거',
  },
  shuffle: {
    id: 'shuffle',
    name: '셔플',
    icon: '🔀',
    cost: GAME_CONFIG.ECONOMY.BOOSTER_SHUFFLE,
    description: '보드 재배치',
  },
  extraMoves: {
    id: 'extraMoves',
    name: '+5 이동',
    icon: '➕',
    cost: GAME_CONFIG.ECONOMY.BOOSTER_EXTRA_MOVES,
    description: '이동 5회 추가',
  },
};

export class BoosterManager {
  /** 부스터 구매 가능 여부 */
  static canAfford(boosterId) {
    const booster = BOOSTERS[boosterId];
    if (!booster) return false;
    return SaveManager.getCoins() >= booster.cost;
  }

  /** 부스터 구매 (코인 차감) */
  static purchase(boosterId) {
    const booster = BOOSTERS[boosterId];
    if (!booster) return false;
    return SaveManager.spendCoins(booster.cost);
  }
}
