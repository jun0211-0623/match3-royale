import { GAME_CONFIG } from '../config.js';

const SAVE_KEY = 'match3royale_save';

/**
 * localStorage 기반 저장 시스템
 * try-catch로 시크릿 모드/용량 초과 대응
 */
export class SaveManager {
  static getDefaultData() {
    return {
      unlockedLevel: 1,
      levelStars: {},     // { "1": 3, "2": 2, ... }
      highScores: {},     // { "1": 1500, ... }
      coins: GAME_CONFIG.ECONOMY.INITIAL_COINS,
      tutorialDone: false,
    };
  }

  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        // 기본값 병합 (새 필드 추가 시 안전)
        return { ...SaveManager.getDefaultData(), ...data };
      }
    } catch (e) {
      console.warn('SaveManager: load failed', e);
    }
    return SaveManager.getDefaultData();
  }

  static save(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('SaveManager: save failed', e);
    }
  }

  /** 레벨 클리어 시 호출 */
  static saveLevelResult(level, stars, score) {
    const data = SaveManager.load();

    // 별은 최고 기록만 저장
    const prevStars = data.levelStars[level] || 0;
    if (stars > prevStars) {
      data.levelStars[level] = stars;
    }

    // 최고 점수
    const prevScore = data.highScores[level] || 0;
    if (score > prevScore) {
      data.highScores[level] = score;
    }

    // 다음 레벨 언락
    if (level >= data.unlockedLevel) {
      data.unlockedLevel = level + 1;
    }

    SaveManager.save(data);
    return data;
  }

  /** 코인 추가 */
  static addCoins(amount) {
    const data = SaveManager.load();
    data.coins += amount;
    SaveManager.save(data);
    return data.coins;
  }

  /** 코인 차감 (잔고 부족 시 false) */
  static spendCoins(amount) {
    const data = SaveManager.load();
    if (data.coins < amount) return false;
    data.coins -= amount;
    SaveManager.save(data);
    return true;
  }

  /** 현재 코인 조회 */
  static getCoins() {
    return SaveManager.load().coins;
  }

  /** 튜토리얼 완료 */
  static setTutorialDone() {
    const data = SaveManager.load();
    data.tutorialDone = true;
    SaveManager.save(data);
  }

  /** 튜토리얼 완료 여부 */
  static isTutorialDone() {
    return SaveManager.load().tutorialDone;
  }

  // ─── 일일 도전 ──────────────────────────────

  /** 일일 도전 데이터 조회 */
  static getDailyData() {
    const data = SaveManager.load();
    return data.daily || { lastDate: null, streak: 0, history: [] };
  }

  /** 일일 도전 완료 처리 */
  static completeDailyChallenge(dateStr) {
    const data = SaveManager.load();
    if (!data.daily) data.daily = { lastDate: null, streak: 0, history: [] };
    if (data.daily.history.includes(dateStr)) return data.daily;

    // 스트릭 계산
    const yesterday = new Date(dateStr);
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (data.daily.lastDate === yStr) {
      data.daily.streak++;
    } else {
      data.daily.streak = 1;
    }

    data.daily.lastDate = dateStr;
    data.daily.history.push(dateStr);
    SaveManager.save(data);
    return data.daily;
  }
}
