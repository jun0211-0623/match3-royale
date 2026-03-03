import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { SaveManager } from '../managers/SaveManager.js';
import { audioManager } from '../managers/AudioManager.js';

export class DailyChallengeScene extends Phaser.Scene {
  constructor() {
    super('DailyChallenge');
  }

  create() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;
    const cx = W / 2;
    const cy = H / 2;
    const dailyData = SaveManager.getDailyData();
    const todayStr = this._getTodayStr();
    const alreadyDone = dailyData.history.includes(todayStr);
    const dailyLevel = this._generateDailyLevel(todayStr);
    const coins = SaveManager.getCoins();

    // 캘린더 생성
    let calendarHTML = '';
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const done = dailyData.history.includes(dStr);
      const isToday = dStr === todayStr;

      calendarHTML += `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;
            background:${done ? 'linear-gradient(135deg,#66BB6A,#2E7D32)' : isToday ? 'linear-gradient(135deg,#FFA726,#EF6C00)' : 'rgba(255,255,255,0.06)'};
            ${isToday ? 'box-shadow:0 0 12px rgba(255,167,38,0.4);' : ''}
            font-size:${done ? '16px' : '14px'};font-weight:${isToday || done ? '800' : '400'};
            color:${done || isToday ? 'white' : 'rgba(255,255,255,0.4)'};
          ">${done ? '✓' : d.getDate()}</div>
          <span style="font-size:10px;color:rgba(255,255,255,0.3);">${days[d.getDay()]}</span>
        </div>
      `;
    }

    // 목표 HTML
    const goalColors = GAME_CONFIG.COLOR_HEX;
    let goalsHTML = '';
    dailyLevel.goals.forEach(goal => {
      if (goal.type === 'collect') {
        const hex = goalColors[goal.color] || 0xffffff;
        const cssColor = '#' + hex.toString(16).padStart(6, '0');
        goalsHTML += `
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:24px;height:24px;border-radius:6px;background:${cssColor};box-shadow:0 2px 6px ${cssColor}40;position:relative;">
              <div style="position:absolute;top:2px;left:3px;width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.4);filter:blur(1px);"></div>
            </div>
            <span style="color:rgba(255,255,255,0.7);font-weight:700;font-size:14px;">${goal.color} x ${goal.count}</span>
          </div>
        `;
      } else if (goal.type === 'destroy_obstacle') {
        const icons = { ice: '🧊', chain: '⛓', wood: '📦' };
        goalsHTML += `
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:20px;">${icons[goal.obstacleType] || '?'}</span>
            <span style="color:rgba(255,255,255,0.7);font-weight:700;font-size:14px;">${goal.obstacleType} x ${goal.count}</span>
          </div>
        `;
      }
    });

    // 버튼
    let actionHTML = '';
    if (alreadyDone) {
      actionHTML = `
        <div style="background:rgba(76,175,80,0.1);border:1px solid rgba(76,175,80,0.2);border-radius:16px;padding:20px;text-align:center;">
          <div style="font-size:28px;font-weight:900;color:#00E676;margin-bottom:8px;">✅ 오늘 도전 완료!</div>
          <div style="font-size:14px;color:rgba(255,255,255,0.4);">내일 다시 도전하세요</div>
        </div>
      `;
    } else {
      actionHTML = `
        <button id="m3d-btn-start" class="m3d-btn-3d" style="width:100%;padding:18px;font-size:22px;font-weight:900;color:white;background:linear-gradient(180deg,#FFA726 0%,#FB8C00 40%,#EF6C00 100%);border:none;border-radius:16px;cursor:pointer;box-shadow:0 6px 0 #BF360C,0 8px 20px rgba(239,108,0,0.4),inset 0 1px 0 rgba(255,255,255,0.2);font-family:'Segoe UI',system-ui,sans-serif;position:relative;overflow:hidden;">
          <div style="position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(180deg,rgba(255,255,255,0.15) 0%,transparent 100%);border-radius:16px 16px 0 0;pointer-events:none;"></div>
          🔥 도전 시작!
        </button>
      `;
    }

    const container = document.createElement('div');
    container.style.cssText = `
      width:${W}px;height:${H}px;display:flex;flex-direction:column;align-items:center;
      position:relative;overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif;
      background:linear-gradient(180deg,#0A0E27 0%,#1A1145 30%,#2D1B69 60%,#1A1145 100%);
      padding:20px;box-sizing:border-box;
    `;

    container.innerHTML = `
      <style>
        @keyframes m3d-slide-up { from { opacity:0;transform:translateY(20px); } to { opacity:1;transform:translateY(0); } }
        @keyframes m3d-flame { 0%,100% { transform:translateY(0) scale(1);filter:brightness(1); } 25% { transform:translateY(-6px) scale(1.05);filter:brightness(1.1); } 50% { transform:translateY(-10px) scale(1.02);filter:brightness(1.2); } 75% { transform:translateY(-4px) scale(1.08);filter:brightness(1.05); } }
        .m3d-btn-3d { transition:transform 0.15s ease,filter 0.15s ease; }
        .m3d-btn-3d:hover { transform:translateY(-2px);filter:brightness(1.1); }
        .m3d-btn-3d:active { transform:translateY(3px) scale(0.98) !important;filter:brightness(0.95) !important; }
        #m3d-back { transition:all 0.15s ease; }
        #m3d-back:hover { background:rgba(255,255,255,0.18) !important;transform:translateX(-2px); }
        #m3d-back:active { transform:translateX(1px) scale(0.95); }
      </style>

      <!-- Header -->
      <div style="width:100%;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <button id="m3d-back" style="background:rgba(255,255,255,0.1);border:none;border-radius:12px;padding:10px 14px;cursor:pointer;color:white;font-size:18px;">←</button>
        <div style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.4);border-radius:20px;padding:6px 14px;border:1px solid rgba(255,215,0,0.15);">
          <span style="font-size:16px;">🪙</span>
          <span style="color:#FFD54F;font-weight:800;font-size:14px;font-family:monospace;">${coins.toLocaleString()}</span>
        </div>
      </div>

      <!-- Title area -->
      <div style="text-align:center;margin-bottom:16px;animation:m3d-slide-up 0.5s ease-out;">
        <div style="font-size:48px;animation:m3d-flame 2s ease-in-out infinite;margin-bottom:8px;">🔥</div>
        <h1 style="color:#FFD54F;font-size:32px;font-weight:900;margin:0 0 4px;">일일 도전</h1>
        <div style="color:rgba(255,255,255,0.4);font-size:14px;">${todayStr}</div>
      </div>

      <!-- Streak -->
      <div style="display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,152,0,0.1));border:1px solid rgba(255,215,0,0.3);border-radius:20px;padding:8px 20px;margin-bottom:24px;animation:m3d-slide-up 0.5s ease-out 0.1s both;">
        <span style="font-size:18px;">🔥</span>
        <span style="color:#FFD54F;font-weight:800;font-size:18px;">연속 ${dailyData.streak}일</span>
      </div>

      <!-- Calendar -->
      <div style="margin-bottom:24px;animation:m3d-slide-up 0.5s ease-out 0.15s both;">
        <div style="color:rgba(255,255,255,0.3);font-size:12px;font-weight:700;text-align:center;margin-bottom:12px;letter-spacing:1px;">최근 7일</div>
        <div style="display:flex;gap:8px;justify-content:center;">
          ${calendarHTML}
        </div>
      </div>

      <!-- Challenge info card -->
      <div style="width:100%;max-width:420px;background:rgba(255,255,255,0.06);border-radius:20px;padding:24px;border:1px solid rgba(255,152,0,0.15);margin-bottom:24px;animation:m3d-slide-up 0.5s ease-out 0.2s both;">
        <h3 style="color:#FFD54F;font-size:18px;font-weight:900;margin:0 0 16px;text-align:center;">오늘의 도전</h3>

        <div style="display:flex;gap:12px;justify-content:center;margin-bottom:16px;">
          <div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:8px 16px;text-align:center;">
            <div style="color:rgba(255,255,255,0.4);font-size:10px;font-weight:700;">이동</div>
            <div style="color:white;font-size:20px;font-weight:900;font-family:monospace;">${dailyLevel.moves}</div>
          </div>
          <div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:8px 16px;text-align:center;">
            <div style="color:rgba(255,255,255,0.4);font-size:10px;font-weight:700;">색상</div>
            <div style="color:white;font-size:20px;font-weight:900;font-family:monospace;">${dailyLevel.colors}</div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
          ${goalsHTML}
        </div>

        <div style="display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(255,215,0,0.08);border-radius:12px;padding:10px 16px;border:1px solid rgba(255,215,0,0.15);">
          <span style="font-size:18px;">🪙</span>
          <span style="color:#FFD54F;font-weight:800;font-size:14px;">보상: ${dailyLevel.reward.coins} (스트릭 보너스)</span>
        </div>
      </div>

      <!-- Action -->
      <div style="width:100%;max-width:320px;animation:m3d-slide-up 0.5s ease-out 0.3s both;">
        ${actionHTML}
      </div>
    `;

    this.domUI = this.add.dom(cx, cy, container);

    container.style.opacity = '0';
    container.style.transition = 'opacity 0.3s ease';
    this.time.delayedCall(50, () => { container.style.opacity = '1'; });

    // 뒤로가기
    container.querySelector('#m3d-back').addEventListener('pointerup', () => {
      if (this._nav) return;
      this._nav = true;
      container.style.opacity = '0';
      this.time.delayedCall(300, () => this.scene.start('Menu'));
    });

    // 시작 버튼
    const startBtn = container.querySelector('#m3d-btn-start');
    if (startBtn) {
      startBtn.addEventListener('pointerup', () => {
        if (this._nav) return;
        this._nav = true;
        audioManager.playClick();
        container.style.opacity = '0';
        this.time.delayedCall(300, () => {
          this.scene.start('Game', {
            level: -1,
            dailyLevel,
            dailyDate: todayStr,
          });
        });
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
      goals.push({ type: 'collect', color, count: 10 + Math.floor(rng() * 11) });
    }

    const obstacles = [];
    if (rng() > 0.5) {
      const obsTypes = ['ice', 'chain', 'wood'];
      const obsType = obsTypes[Math.floor(rng() * obsTypes.length)];
      const obsCount = 2 + Math.floor(rng() * 5);
      const usedPositions = new Set();
      for (let i = 0; i < obsCount; i++) {
        let r, c;
        do { r = Math.floor(rng() * 8); c = Math.floor(rng() * 8); } while (usedPositions.has(`${r},${c}`));
        usedPositions.add(`${r},${c}`);
        obstacles.push({ row: r, col: c, type: obsType, layers: obsType === 'chain' ? 1 : (1 + Math.floor(rng() * 2)) });
      }
      if (rng() > 0.4) {
        goals.push({ type: 'destroy_obstacle', obstacleType: obsType, count: obsCount });
      }
    }

    const daily = SaveManager.getDailyData();
    const streakBonus = Math.min(daily.streak, 10) * 10;

    return {
      level: -1, isDaily: true, colors, moves, goals, obstacles,
      stars: { one: 1, two: 3, three: 6 },
      reward: { coins: 100 + streakBonus },
    };
  }

  _seededRng(seed) {
    return () => {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
}
