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

    // 뒤로가기
    this.add.text(30, 30, '< 뒤로', {
      fontSize: '24px', color: '#ffffff',
    }).setInteractive({ useHandCursor: true })
      .on('pointerup', () => fadeToScene(this, 'Menu'));

    // 코인
    this.add.text(GAME_CONFIG.WIDTH - 30, 30, `💰 ${SaveManager.getCoins()}`, {
      fontSize: '22px', color: '#f1c40f',
    }).setOrigin(1, 0);

    // 타이틀
    this.add.text(cx, 100, '일일 도전', {
      fontSize: '42px', fontStyle: 'bold', color: '#e67e22',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    // 날짜
    this.add.text(cx, 155, todayStr, {
      fontSize: '20px', color: '#aaaaaa',
    }).setOrigin(0.5);

    // ─── 스트릭 카운터 ────────────────────
    const streakY = 210;
    this.add.text(cx, streakY, `🔥 연속 ${dailyData.streak}일`, {
      fontSize: '32px', fontStyle: 'bold', color: '#f1c40f',
    }).setOrigin(0.5);

    // ─── 최근 7일 캘린더 ─────────────────
    const calY = 280;
    this.add.text(cx, calY - 20, '최근 7일', {
      fontSize: '18px', color: '#888888',
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
      const fillColor = done ? 0x2ecc71 : isToday ? 0xe67e22 : 0x333344;
      this.add.circle(dx, calY + 20, 18, fillColor, done || isToday ? 0.9 : 0.4);
      this.add.text(dx, calY + 20, `${d.getDate()}`, {
        fontSize: '14px', color: '#ffffff', fontStyle: isToday ? 'bold' : 'normal',
      }).setOrigin(0.5);

      // 요일
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      this.add.text(dx, calY + 48, days[d.getDay()], {
        fontSize: '12px', color: '#666666',
      }).setOrigin(0.5);
    }

    // ─── 오늘의 도전 정보 ─────────────────
    const infoY = 420;
    const dailyLevel = this._generateDailyLevel(todayStr);

    // 패널
    const panelG = this.add.graphics();
    panelG.fillStyle(0x1a1a2e, 0.9);
    panelG.fillRoundedRect(cx - 250, infoY - 10, 500, 240, 20);
    panelG.lineStyle(2, 0xe67e22, 0.6);
    panelG.strokeRoundedRect(cx - 250, infoY - 10, 500, 240, 20);

    this.add.text(cx, infoY + 20, '오늘의 도전', {
      fontSize: '24px', fontStyle: 'bold', color: '#e67e22',
    }).setOrigin(0.5);

    this.add.text(cx, infoY + 55, `이동: ${dailyLevel.moves}회 | 색상: ${dailyLevel.colors}개`, {
      fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5);

    // 목표 표시
    const goalColors = GAME_CONFIG.COLOR_HEX;
    const obstacleIcons = { ice: '🧊', chain: '⛓', wood: '📦' };
    dailyLevel.goals.forEach((goal, i) => {
      const gy = infoY + 90 + i * 28;
      let label;
      if (goal.type === 'collect') {
        const hex = goalColors[goal.color] || 0xffffff;
        this.add.circle(cx - 80, gy, 6, hex);
        label = `${goal.color} × ${goal.count}`;
      } else if (goal.type === 'destroy_obstacle') {
        label = `${obstacleIcons[goal.obstacleType] || '?'} ${goal.obstacleType} × ${goal.count}`;
      }
      this.add.text(cx - 60, gy, label, {
        fontSize: '16px', color: '#cccccc',
      }).setOrigin(0, 0.5);
    });

    // 보상 표시
    this.add.text(cx, infoY + 200, `보상: 💰 ${dailyLevel.reward.coins} (스트릭 보너스 적용)`, {
      fontSize: '16px', color: '#f1c40f',
    }).setOrigin(0.5);

    // ─── 도전 버튼 ─────────────────────────
    const btnY = 700;
    if (alreadyDone) {
      this.add.text(cx, btnY, '✅ 오늘 도전 완료!', {
        fontSize: '28px', fontStyle: 'bold', color: '#2ecc71',
      }).setOrigin(0.5);
      this.add.text(cx, btnY + 40, '내일 다시 도전하세요', {
        fontSize: '18px', color: '#888888',
      }).setOrigin(0.5);
    } else {
      new UIButton(this, cx, btnY, 280, 70, {
        text: '도전 시작!',
        fontSize: '30px',
        bgColor: 0xe67e22,
        glow: true,
        glowColor: 0xe67e22,
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
    // 날짜 기반 시드 RNG
    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) {
      seed = ((seed << 5) - seed) + dateStr.charCodeAt(i);
      seed |= 0;
    }
    const rng = this._seededRng(Math.abs(seed));

    const colors = 4 + Math.floor(rng() * 3); // 4~6
    const moves = 15 + Math.floor(rng() * 11); // 15~25
    const allColors = GAME_CONFIG.COLORS.slice(0, colors);

    // 목표 1~2개
    const goals = [];
    const goalCount = 1 + Math.floor(rng() * 2);
    for (let i = 0; i < goalCount; i++) {
      const color = allColors[Math.floor(rng() * allColors.length)];
      goals.push({
        type: 'collect',
        color,
        count: 10 + Math.floor(rng() * 11), // 10~20
      });
    }

    // 장애물 (50% 확률)
    const obstacles = [];
    if (rng() > 0.5) {
      const obsTypes = ['ice', 'chain', 'wood'];
      const obsType = obsTypes[Math.floor(rng() * obsTypes.length)];
      const obsCount = 2 + Math.floor(rng() * 5); // 2~6
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

      // 장애물 파괴 목표 추가
      if (rng() > 0.4) {
        goals.push({
          type: 'destroy_obstacle',
          obstacleType: obsType,
          count: obsCount,
        });
      }
    }

    // 스트릭 보너스
    const daily = SaveManager.getDailyData();
    const streakBonus = Math.min(daily.streak, 10) * 10; // 최대 100 보너스

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
    // mulberry32
    return () => {
      seed |= 0;
      seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
}
