import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { LevelManager } from '../managers/LevelManager.js';
import { SaveManager } from '../managers/SaveManager.js';
import { audioManager } from '../managers/AudioManager.js';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  init(data) {
    this.level = data.level || 1;
    this.cleared = data.cleared || false;
    this.stars = data.stars || 0;
    this.score = data.score || 0;
    this.coins = data.coins || 0;
    this.isDaily = !!data.isDaily;
  }

  create() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;
    const cx = W / 2;
    const cy = H / 2;

    if (this.cleared) {
      audioManager.playClear();
    } else {
      audioManager.playFail();
    }

    const starsHTML = [0, 1, 2].map(i =>
      `<span style="font-size:32px;filter:${i < this.stars ? 'none' : 'grayscale(1) opacity(0.3)'};transition:all 0.3s;animation:${i < this.stars ? `m3r-star-pop 0.4s ease-out ${0.3 + i * 0.2}s both` : 'none'};">⭐</span>`
    ).join('');

    let cardContent = '';
    let buttonsHTML = '';

    if (this.cleared) {
      const titleText = this.isDaily ? '도전 성공!' : '스테이지 클리어!';

      cardContent = `
        <div style="font-size:56px;margin-bottom:8px;animation:m3r-trophy-pop 0.5s ease-out both;">🏆</div>
        <div style="display:flex;justify-content:center;gap:4px;margin-bottom:12px;">${starsHTML}</div>
        <h2 style="color:#FFD54F;font-size:28px;margin:0 0 6px;font-weight:900;">${titleText}</h2>
        <p style="color:rgba(255,255,255,0.5);margin:0 0 20px;font-size:14px;">점수: ${this.score}</p>
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(255,215,0,0.1);border-radius:14px;padding:12px 20px;margin-bottom:24px;border:1px solid rgba(255,215,0,0.2);">
          <span style="font-size:24px;">🪙</span>
          <span style="color:#FFD54F;font-size:24px;font-weight:900;">+${this.coins}</span>
        </div>
      `;

      if (this.isDaily) {
        const dailyData = SaveManager.getDailyData();
        cardContent += `<div style="color:#FF8F00;font-size:18px;font-weight:800;margin-bottom:20px;">🔥 연속 ${dailyData.streak}일</div>`;
        buttonsHTML = `
          <button id="m3r-btn-confirm" style="width:100%;padding:14px;font-size:18px;font-weight:900;color:white;background:linear-gradient(180deg,#66BB6A,#2E7D32);border:none;border-radius:14px;cursor:pointer;box-shadow:0 4px 0 #1B5E20,0 6px 16px rgba(46,125,50,0.4);font-family:'Segoe UI',system-ui,sans-serif;" data-target="DailyChallenge">
            확인
          </button>
        `;
      } else {
        const hasNext = LevelManager.hasLevel(this.level + 1);
        buttonsHTML = `<div style="display:flex;gap:10px;width:100%;">
          <button id="m3r-btn-home" style="flex:1;padding:14px;font-size:16px;font-weight:800;color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:14px;cursor:pointer;font-family:'Segoe UI',system-ui,sans-serif;" data-target="LevelSelect">
            레벨 선택
          </button>
          ${hasNext ? `<button id="m3r-btn-next" style="flex:2;padding:14px;font-size:16px;font-weight:900;color:white;background:linear-gradient(180deg,#66BB6A,#2E7D32);border:none;border-radius:14px;cursor:pointer;box-shadow:0 4px 0 #1B5E20,0 6px 16px rgba(46,125,50,0.4);font-family:'Segoe UI',system-ui,sans-serif;" data-level="${this.level + 1}">
            다음 스테이지 ▶
          </button>` : ''}
        </div>`;
      }
    } else {
      cardContent = `
        <div style="font-size:48px;margin-bottom:12px;">😢</div>
        <h2 style="color:#FF5252;font-size:28px;margin:0 0 6px;font-weight:900;">실패...</h2>
        <p style="color:rgba(255,255,255,0.5);margin:0 0 24px;font-size:14px;">점수: ${this.score}</p>
      `;

      if (this.isDaily) {
        cardContent += `<p style="color:rgba(255,255,255,0.4);font-size:15px;margin:0 0 20px;">내일 다시 도전하세요!</p>`;
        buttonsHTML = `
          <button id="m3r-btn-confirm" style="width:100%;padding:14px;font-size:16px;font-weight:800;color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:14px;cursor:pointer;font-family:'Segoe UI',system-ui,sans-serif;" data-target="DailyChallenge">
            확인
          </button>
        `;
      } else {
        const extraCost = GAME_CONFIG.ECONOMY.BOOSTER_EXTRA_MOVES;
        const canBuy = SaveManager.getCoins() >= extraCost;
        buttonsHTML = `
          <button id="m3r-btn-extra" style="width:100%;padding:14px;font-size:16px;font-weight:800;color:white;background:${canBuy ? 'linear-gradient(180deg,#FFA726,#EF6C00)' : 'rgba(255,255,255,0.1)'};border:none;border-radius:14px;cursor:pointer;box-shadow:${canBuy ? '0 4px 0 #BF360C,0 6px 12px rgba(239,108,0,0.3)' : 'none'};margin-bottom:10px;font-family:'Segoe UI',system-ui,sans-serif;${canBuy ? '' : 'border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);'}">
            +5 이동 (${extraCost}🪙)
          </button>
          <button id="m3r-btn-retry" style="width:100%;padding:14px;font-size:16px;font-weight:900;color:white;background:linear-gradient(180deg,#42A5F5,#1565C0);border:none;border-radius:14px;cursor:pointer;box-shadow:0 4px 0 #0D47A1,0 6px 12px rgba(21,101,192,0.3);margin-bottom:10px;font-family:'Segoe UI',system-ui,sans-serif;">
            재시도
          </button>
          <button id="m3r-btn-home" style="width:100%;padding:12px;font-size:14px;font-weight:700;color:rgba(255,255,255,0.5);background:transparent;border:1px solid rgba(255,255,255,0.1);border-radius:14px;cursor:pointer;font-family:'Segoe UI',system-ui,sans-serif;">
            ${this.isDaily ? '메인 메뉴' : '레벨 선택'}
          </button>
        `;
      }
    }

    const container = document.createElement('div');
    container.style.cssText = `
      width:${W}px;height:${H}px;display:flex;align-items:center;justify-content:center;
      position:relative;overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif;
      background:linear-gradient(180deg,#0A0E27 0%,#1A1145 50%,#2D1B69 100%);
    `;

    container.innerHTML = `
      <style>
        @keyframes m3r-slide-up { from { opacity:0;transform:translateY(30px); } to { opacity:1;transform:translateY(0); } }
        @keyframes m3r-trophy-pop { from { transform:scale(0) rotate(-15deg);opacity:0; } to { transform:scale(1) rotate(0);opacity:1; } }
        @keyframes m3r-star-pop { from { transform:scale(0);opacity:0; } to { transform:scale(1);opacity:1; } }
        @keyframes m3r-confetti {
          0% { transform:translateY(-20px) rotate(0deg);opacity:1; }
          100% { transform:translateY(${H}px) rotate(720deg);opacity:0.3; }
        }
      </style>

      ${this.cleared ? this._generateConfettiHTML() : ''}

      <!-- Dark overlay -->
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.5);pointer-events:none;"></div>

      <!-- Card -->
      <div style="
        background:linear-gradient(180deg,#1E1452 0%,#2D1B69 100%);
        border-radius:28px;padding:36px 32px;text-align:center;
        max-width:340px;width:90%;
        border:1px solid rgba(255,215,0,${this.cleared ? '0.2' : '0.1'});
        box-shadow:0 20px 60px rgba(0,0,0,0.5);
        animation:m3r-slide-up 0.5s ease-out;
        position:relative;z-index:1;
      ">
        ${cardContent}
        ${buttonsHTML}
      </div>
    `;

    this.domUI = this.add.dom(cx, cy, container);

    // 페이드 인
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.3s ease';
    this.time.delayedCall(50, () => { container.style.opacity = '1'; });

    // 버튼 이벤트
    const nav = (scene, data) => {
      if (this._nav) return;
      this._nav = true;
      audioManager.playClick();
      container.style.opacity = '0';
      this.time.delayedCall(300, () => this.scene.start(scene, data));
    };

    const confirmBtn = container.querySelector('#m3r-btn-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('pointerup', () => nav(confirmBtn.dataset.target));
    }

    const homeBtn = container.querySelector('#m3r-btn-home');
    if (homeBtn) {
      homeBtn.addEventListener('pointerup', () => nav(homeBtn.dataset.target || (this.isDaily ? 'Menu' : 'LevelSelect')));
    }

    const nextBtn = container.querySelector('#m3r-btn-next');
    if (nextBtn) {
      nextBtn.addEventListener('pointerup', () => nav('Game', { level: parseInt(nextBtn.dataset.level) }));
    }

    const retryBtn = container.querySelector('#m3r-btn-retry');
    if (retryBtn) {
      retryBtn.addEventListener('pointerup', () => nav('Game', { level: this.level }));
    }

    const extraBtn = container.querySelector('#m3r-btn-extra');
    if (extraBtn) {
      extraBtn.addEventListener('pointerup', () => {
        const cost = GAME_CONFIG.ECONOMY.BOOSTER_EXTRA_MOVES;
        if (SaveManager.getCoins() >= cost && SaveManager.spendCoins(cost)) {
          nav('Game', { level: this.level });
        }
      });
    }
  }

  _generateConfettiHTML() {
    const colors = ['#FF1744', '#FFC400', '#00E676', '#2979FF', '#D500F9', '#FFD54F'];
    let html = '';
    for (let i = 0; i < 30; i++) {
      const color = colors[i % colors.length];
      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      const dur = 2 + Math.random() * 3;
      const size = 4 + Math.random() * 6;
      html += `<div style="position:absolute;top:-10px;left:${left}%;width:${size}px;height:${size}px;background:${color};border-radius:${Math.random() > 0.5 ? '50%' : '2px'};animation:m3r-confetti ${dur}s linear ${delay}s both;pointer-events:none;z-index:0;"></div>`;
    }
    return html;
  }
}
