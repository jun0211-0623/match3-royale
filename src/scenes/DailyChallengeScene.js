import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { SaveManager } from '../managers/SaveManager.js';
import { audioManager } from '../managers/AudioManager.js';
import { UIButton } from '../ui/UIButton.js';
import { fadeToScene, fadeIn } from '../utils/SceneTransitions.js';

export class DailyChallengeScene extends Phaser.Scene {
  constructor() {
    super('DailyChallenge');
  }

  create() {
    fadeIn(this);
    const cx = GAME_CONFIG.WIDTH / 2;
    const dailyData = SaveManager.getDailyData();
    const todayStr = this._getTodayStr();
    const alreadyDone = dailyData.history.includes(todayStr);

    // 배경
    this.add.image(cx, GAME_CONFIG.HEIGHT / 2, 'bg_gradient');

    // ─── 상단 헤더 ──────────────────────────────

    // 뒤로가기 (glass button)
    const backBg = this.add.graphics();
    backBg.fillStyle(0xffffff, 0.1);
    backBg.fillRoundedRect(16, 20, 44, 40, 12);
    this.add.text(38, 40, '←', {
      fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerup', () => fadeToScene(this, 'Menu'));

    // 코인 pill
    const coinPill = this.add.graphics();
    coinPill.fillStyle(0x000000, 0.4);
    coinPill.fillRoundedRect(GAME_CONFIG.WIDTH - 130, 22, 116, 36, 20);
    coinPill.lineStyle(1, 0xFFD54F, 0.15);
    coinPill.strokeRoundedRect(GAME_CONFIG.WIDTH - 130, 22, 116, 36, 20);
    this.add.text(GAME_CONFIG.WIDTH - 112, 40, '🪙', { fontSize: '16px' }).setOrigin(0.5);
    this.add.text(GAME_CONFIG.WIDTH - 72, 40, `${SaveManager.getCoins()}`, {
      fontSize: '14px', fontStyle: 'bold', color: '#FFD54F', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // ─── 타이틀 ─────────────────────────────────

    this.add.text(cx, 110, '🔥', { fontSize: '48px' }).setOrigin(0.5);
    this.add.text(cx, 160, '일일 도전', {
      fontSize: '32px', fontStyle: 'bold', color: '#FFD54F',
    }).setOrigin(0.5);

    // 날짜
    this.add.text(cx, 200, todayStr, {
      fontSize: '14px', color: 'rgba(255,255,255,0.4)',
    }).setOrigin(0.5);

    // ─── 스트릭 카운터 ────────────────────────

    const streakY = 250;
    const streakPill = this.add.graphics();
    streakPill.fillStyle(0xFFD54F, 0.1);
    streakPill.fillRoundedRect(cx - 90, streakY - 20, 180, 40, 20);
    streakPill.lineStyle(1, 0xFFD54F, 0.2);
    streakPill.strokeRoundedRect(cx - 90, streakY - 20, 180, 40, 20);

    this.add.text(cx, streakY, `🔥 연속 ${dailyData.streak}일`, {
      fontSize: '20px', fontStyle: 'bold', color: '#FFD54F',
    }).setOrigin(0.5);

    // ─── 최근 7일 캘린더 ─────────────────────

    const calY = 320;
    this.add.text(cx, calY - 20, '최근 7일', {
      fontSize: '12px', fontStyle: 'bold', color: 'rgba(255,255,255,0.3)',
    }).setOrigin(0.5);

    const calStartX = cx - 3 * 50;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const done = dailyData.history.includes(dStr);
      const isToday = dStr === todayStr;
      const dx = calStartX + (6 - i) * 50;

      // 날짜 원
      const g = this.add.graphics();
      if (done) {
        g.fillStyle(0x43A047, 0.9);
      } else if (isToday) {
        g.fillStyle(0xFB8C00, 0.9);
      } else {
        g.fillStyle(0xffffff, 0.06);
      }
      g.fillCircle(dx, calY + 18, 18);

      if (isToday) {
        g.lineStyle(2, 0xFFD54F, 0.5);
        g.strokeCircle(dx, calY + 18, 18);
      }

      this.add.text(dx, calY + 18, done ? '✓' : `${d.getDate()}`, {
        fontSize: done ? '16px' : '14px',
        fontStyle: isToday || done ? 'bold' : 'normal',
        color: done || isToday ? '#ffffff' : 'rgba(255,255,255,0.5)',
      }).setOrigin(0.5);

      // 요일
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      this.add.text(dx, calY + 46, days[d.getDay()], {
        fontSize: '10px', color: 'rgba(255,255,255,0.3)',
      }).setOrigin(0.5);
    }

    // ─── 오늘의 도전 정보 (glass card) ───────

    const infoY = 410;
    const dailyLevel = this._generateDailyLevel(todayStr);

    const panelG = this.add.graphics();
    panelG.fillStyle(0xffffff, 0.06);
    panelG.fillRoundedRect(cx - 230, infoY, 460, 230, 20);
    panelG.lineStyle(1, 0xFB8C00, 0.2);
    panelG.strokeRoundedRect(cx - 230, infoY, 460, 230, 20);

    this.add.text(cx, infoY + 28, '오늘의 도전', {
      fontSize: '20px', fontStyle: 'bold', color: '#FFD54F',
    }).setOrigin(0.5);

    // 이동/색상 info pills
    const infoPillY = infoY + 62;
    const moveInfoG = this.add.graphics();
    moveInfoG.fillStyle(0xffffff, 0.06);
    moveInfoG.fillRoundedRect(cx - 110, infoPillY - 14, 100, 28, 14);
    this.add.text(cx - 60, infoPillY, `이동 ${dailyLevel.moves}회`, {
      fontSize: '13px', fontStyle: 'bold', color: 'rgba(255,255,255,0.7)',
    }).setOrigin(0.5);

    const colorInfoG = this.add.graphics();
    colorInfoG.fillStyle(0xffffff, 0.06);
    colorInfoG.fillRoundedRect(cx + 10, infoPillY - 14, 100, 28, 14);
    this.add.text(cx + 60, infoPillY, `색상 ${dailyLevel.colors}개`, {
      fontSize: '13px', fontStyle: 'bold', color: 'rgba(255,255,255,0.7)',
    }).setOrigin(0.5);

    // 목표 표시 (with mini gem thumbnails)
    const goalColors = GAME_CONFIG.COLOR_HEX;
    const obstacleIcons = { ice: '🧊', chain: '⛓', wood: '📦' };
    dailyLevel.goals.forEach((goal, i) => {
      const gy = infoY + 100 + i * 32;
      if (goal.type === 'collect') {
        const hex = goalColors[goal.color] || 0xffffff;
        const thumbG = this.add.graphics();
        thumbG.fillStyle(hex, 1);
        thumbG.fillRoundedRect(cx - 80, gy - 10, 20, 20, 6);
        thumbG.fillStyle(0xffffff, 0.3);
        thumbG.fillCircle(cx - 74, gy - 4, 3);

        this.add.text(cx - 50, gy, `${goal.color} x ${goal.count}`, {
          fontSize: '14px', fontStyle: 'bold', color: 'rgba(255,255,255,0.7)',
        }).setOrigin(0, 0.5);
      } else if (goal.type === 'destroy_obstacle') {
        this.add.text(cx - 80, gy, obstacleIcons[goal.obstacleType] || '?', {
          fontSize: '18px',
        }).setOrigin(0, 0.5);
        this.add.text(cx - 50, gy, `${goal.obstacleType} x ${goal.count}`, {
          fontSize: '14px', fontStyle: 'bold', color: 'rgba(255,255,255,0.7)',
        }).setOrigin(0, 0.5);
      }
    });

    // 보상 표시 (gold pill)
    const rewardY = infoY + 195;
    const rewardG = this.add.graphics();
    rewardG.fillStyle(0xFFD54F, 0.1);
    rewardG.fillRoundedRect(cx - 130, rewardY - 14, 260, 28, 14);
    rewardG.lineStyle(1, 0xFFD54F, 0.15);
    rewardG.strokeRoundedRect(cx - 130, rewardY - 14, 260, 28, 14);

    this.add.text(cx, rewardY, `보상: 🪙 ${dailyLevel.reward.coins} (스트릭 보너스 적용)`, {
      fontSize: '13px', fontStyle: 'bold', color: '#FFD54F',
    }).setOrigin(0.5);

    // ─── 도전 버튼 ─────────────────────────

    const btnY = 690;
    if (alreadyDone) {
      // 완료 표시 (glass card)
      const doneBg = this.add.graphics();
      doneBg.fillStyle(0x43A047, 0.1);
      doneBg.fillRoundedRect(cx - 140, btnY - 30, 280, 60, 16);
      doneBg.lineStyle(1, 0x43A047, 0.2);
      doneBg.strokeRoundedRect(cx - 140, btnY - 30, 280, 60, 16);

      this.add.text(cx, btnY, '✅ 오늘 도전 완료!', {
        fontSize: '22px', fontStyle: 'bold', color: '#00E676',
      }).setOrigin(0.5);

      this.add.text(cx, btnY + 45, '내일 다시 도전하세요', {
        fontSize: '14px', color: 'rgba(255,255,255,0.4)',
      }).setOrigin(0.5);
    } else {
      new UIButton(this, cx, btnY, 280, 60, {
        text: '도전 시작!',
        fontSize: '22px',
        bgColor: 0xFB8C00,
        radius: 16,
        shadowOffset: 5,
        glow: true,
        glowColor: 0xFB8C00,
        onClick: () => {
          audioManager.playClick();
          fadeToScene(this, 'Game', {
            level: -1,
            dailyLevel,
            dailyDate: todayStr,
          });
        },
      });
    }
  }

  _getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  _generateDailyLevel(dateStr) {
    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) {
      seed = ((seed << 5) - seed) + dateStr.charCodeAt(i);
      seed |= 0;
    }
    const rng = this._seededRng(Math.abs(seed));

    const colors = 4 + Math.floor(rng() * 3);
    const moves = 15 + Math.floor(rng() * 11);
    const allColors = GAME_CONFIG.COLORS.slice(0, colors);

    const goals = [];
    const goalCount = 1 + Math.floor(rng() * 2);
    for (let i = 0; i < goalCount; i++) {
      const color = allColors[Math.floor(rng() * allColors.length)];
      goals.push({
        type: 'collect',
        color,
        count: 10 + Math.floor(rng() * 11),
      });
    }

    const obstacles = [];
    if (rng() > 0.5) {
      const obsTypes = ['ice', 'chain', 'wood'];
      const obsType = obsTypes[Math.floor(rng() * obsTypes.length)];
      const obsCount = 2 + Math.floor(rng() * 5);
      const usedPositions = new Set();
      for (let i = 0; i < obsCount; i++) {
        let r, c;
        do {
          r = Math.floor(rng() * 8);
          c = Math.floor(rng() * 8);
        } while (usedPositions.has(`${r},${c}`));
        usedPositions.add(`${r},${c}`);
        const layers = obsType === 'chain' ? 1 : (1 + Math.floor(rng() * 2));
        obstacles.push({ row: r, col: c, type: obsType, layers });
      }

      if (rng() > 0.4) {
        goals.push({
          type: 'destroy_obstacle',
          obstacleType: obsType,
          count: obsCount,
        });
      }
    }

    const daily = SaveManager.getDailyData();
    const streakBonus = Math.min(daily.streak, 10) * 10;

    return {
      level: -1,
      isDaily: true,
      colors,
      moves,
      goals,
      obstacles,
      stars: { one: 1, two: 3, three: 6 },
      reward: { coins: 100 + streakBonus },
    };
  }

  _seededRng(seed) {
    return () => {
      seed |= 0;
      seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
}
