import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { SaveManager } from '../managers/SaveManager.js';
import { audioManager } from '../managers/AudioManager.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;
    const cx = W / 2;
    const cy = H / 2;
    const levelData = SaveManager.load();
    const coins = SaveManager.getCoins();

    // 배경 파티클 생성
    const particleColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#60A5FA'];
    let particlesHTML = '';
    for (let i = 0; i < 20; i++) {
      const size = 4 + Math.random() * 6;
      particlesHTML += `<div style="position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:${particleColors[i % 5]};opacity:0;left:${Math.random() * 100}%;animation:m3-bg-particle ${5 + Math.random() * 8}s linear ${Math.random() * 5}s infinite;"></div>`;
    }

    const container = document.createElement('div');
    container.style.cssText = `
      width:${W}px;height:${H}px;display:flex;flex-direction:column;
      align-items:center;justify-content:center;position:relative;overflow:hidden;
      font-family:'Segoe UI',system-ui,sans-serif;
      background:linear-gradient(180deg, #0A0E27 0%, #1A1145 30%, #2D1B69 60%, #1A1145 100%);
    `;

    container.innerHTML = `
      <style>
        @keyframes m3-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-12px); } }
        @keyframes m3-bg-particle { 0% { transform:translateY(${H}px) scale(0);opacity:0; } 10% { opacity:0.6; } 90% { opacity:0.6; } 100% { transform:translateY(-50px) scale(1);opacity:0; } }
        @keyframes m3-slide-up { from { opacity:0;transform:translateY(30px); } to { opacity:1;transform:translateY(0); } }
        @keyframes m3-title-glow {
          0%,100% { text-shadow:0 0 20px rgba(255,215,0,0.5),0 2px 4px rgba(0,0,0,0.8),0 0 60px rgba(255,165,0,0.2);filter:brightness(1); }
          50% { text-shadow:0 0 30px rgba(255,215,0,0.8),0 2px 4px rgba(0,0,0,0.8),0 0 80px rgba(255,165,0,0.4);filter:brightness(1.1); }
        }
        @keyframes m3-badge-bounce { 0%,100% { transform:scale(1); } 50% { transform:scale(1.1); } }
        .m3-btn-3d { transition:transform 0.1s; }
        .m3-btn-3d:active { transform:translateY(4px) !important; }
      </style>

      ${particlesHTML}

      <!-- Decorative glow -->
      <div style="position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%);top:10%;left:50%;transform:translateX(-50%);pointer-events:none;"></div>

      <!-- Crown -->
      <div style="animation:m3-float 3s ease-in-out infinite;margin-bottom:8px;font-size:56px;filter:drop-shadow(0 4px 20px rgba(255,215,0,0.4));pointer-events:none;">👑</div>

      <!-- Title -->
      <div style="text-align:center;margin-bottom:6px;animation:m3-slide-up 0.8s ease-out;">
        <div style="font-size:52px;font-weight:900;color:transparent;background:linear-gradient(180deg,#FFE082 0%,#FFD54F 30%,#FFB300 60%,#FF8F00 100%);-webkit-background-clip:text;background-clip:text;margin:0;line-height:1.1;animation:m3-title-glow 3s ease-in-out infinite;letter-spacing:-1px;">MATCH 3</div>
        <div style="font-size:22px;font-weight:800;color:#E0E0E0;letter-spacing:12px;margin-top:4px;text-shadow:0 2px 10px rgba(0,0,0,0.5);">ROYALE</div>
      </div>

      <!-- Level badge -->
      <div style="display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,rgba(255,215,0,0.15) 0%,rgba(255,152,0,0.1) 100%);border:1px solid rgba(255,215,0,0.3);border-radius:20px;padding:6px 18px;margin-bottom:32px;animation:m3-slide-up 0.8s ease-out 0.1s both;">
        <span style="font-size:18px;">⭐</span>
        <span style="color:#FFD54F;font-weight:700;font-size:15px;">LEVEL ${levelData.unlockedLevel}</span>
      </div>

      <!-- Coin display -->
      <div style="display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,215,0,0.2);border-radius:25px;padding:8px 20px 8px 12px;margin-bottom:40px;backdrop-filter:blur(10px);animation:m3-slide-up 0.8s ease-out 0.2s both;">
        <span style="font-size:22px;">🪙</span>
        <span style="color:#FFD54F;font-weight:800;font-size:18px;font-family:monospace;">${coins.toLocaleString()}</span>
        <div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#4CAF50,#2E7D32);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:white;margin-left:4px;cursor:pointer;box-shadow:0 2px 8px rgba(76,175,80,0.4);">+</div>
      </div>

      <!-- Buttons -->
      <div style="display:flex;flex-direction:column;gap:14px;width:100%;max-width:300px;animation:m3-slide-up 0.8s ease-out 0.3s both;">
        <button id="m3-btn-play" class="m3-btn-3d" style="position:relative;padding:18px 40px;font-size:22px;font-weight:900;color:white;background:linear-gradient(180deg,#66BB6A 0%,#43A047 40%,#2E7D32 100%);border:none;border-radius:16px;cursor:pointer;letter-spacing:2px;text-shadow:0 2px 4px rgba(0,0,0,0.3);box-shadow:0 6px 0 #1B5E20,0 8px 20px rgba(46,125,50,0.4),inset 0 1px 0 rgba(255,255,255,0.2);overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif;">
          <div style="position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(180deg,rgba(255,255,255,0.15) 0%,transparent 100%);border-radius:16px 16px 0 0;pointer-events:none;"></div>
          ▶ 플레이
        </button>

        <button id="m3-btn-daily" class="m3-btn-3d" style="position:relative;padding:16px 40px;font-size:18px;font-weight:800;color:white;background:linear-gradient(180deg,#FFA726 0%,#FB8C00 40%,#EF6C00 100%);border:none;border-radius:16px;cursor:pointer;letter-spacing:1px;text-shadow:0 2px 4px rgba(0,0,0,0.3);box-shadow:0 5px 0 #BF360C,0 7px 16px rgba(239,108,0,0.4),inset 0 1px 0 rgba(255,255,255,0.2);overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif;">
          <div style="position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(180deg,rgba(255,255,255,0.15) 0%,transparent 100%);border-radius:16px 16px 0 0;pointer-events:none;"></div>
          🔥 일일 도전
          <span style="position:absolute;top:-8px;right:-8px;background:linear-gradient(135deg,#F44336,#C62828);color:white;font-size:11px;font-weight:900;padding:3px 8px;border-radius:10px;box-shadow:0 2px 8px rgba(244,67,54,0.5);animation:m3-badge-bounce 1.5s ease-in-out infinite;">NEW</span>
        </button>

        <button id="m3-btn-tournament" class="m3-btn-3d" style="position:relative;padding:16px 40px;font-size:18px;font-weight:800;color:white;background:linear-gradient(180deg,#7E57C2 0%,#5E35B1 40%,#4527A0 100%);border:none;border-radius:16px;cursor:pointer;letter-spacing:1px;text-shadow:0 2px 4px rgba(0,0,0,0.3);box-shadow:0 5px 0 #311B92,0 7px 16px rgba(69,39,160,0.4),inset 0 1px 0 rgba(255,255,255,0.2);overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif;">
          <div style="position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(180deg,rgba(255,255,255,0.12) 0%,transparent 100%);border-radius:16px 16px 0 0;pointer-events:none;"></div>
          🏆 토너먼트
        </button>

        <button id="m3-btn-settings" style="padding:14px 40px;font-size:16px;font-weight:700;color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:14px;cursor:pointer;font-family:'Segoe UI',system-ui,sans-serif;transition:all 0.2s;">
          ⚙️ 설정
        </button>
      </div>

      <!-- Version -->
      <div style="position:absolute;bottom:70px;color:rgba(255,255,255,0.15);font-size:12px;">v2.0.0</div>

      <!-- Bottom nav -->
      <div style="position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:center;gap:0;padding:12px 20px;background:linear-gradient(180deg,transparent,rgba(0,0,0,0.6));">
        ${['🏠,홈,true', '🗺️,모험,false', '👥,친구,false', '🎁,상점,false'].map(item => {
          const [icon, label, active] = item.split(',');
          return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 20px;border-radius:12px;cursor:pointer;background:${active === 'true' ? 'rgba(255,215,0,0.1)' : 'transparent'};">
            <span style="font-size:22px;">${icon}</span>
            <span style="font-size:10px;font-weight:700;color:${active === 'true' ? '#FFD54F' : 'rgba(255,255,255,0.4)'};">${label}</span>
          </div>`;
        }).join('')}
      </div>
    `;

    // Phaser DOM 오버레이
    this.domUI = this.add.dom(cx, cy, container);

    // 페이드 인
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.3s ease';
    this.time.delayedCall(50, () => { container.style.opacity = '1'; });

    // 버튼 이벤트
    const nav = (scene, data) => {
      if (this._nav) return;
      this._nav = true;
      audioManager.unlock();
      audioManager.playClick();
      container.style.opacity = '0';
      this.time.delayedCall(300, () => this.scene.start(scene, data));
    };

    container.querySelector('#m3-btn-play').addEventListener('pointerup', () => {
      audioManager.startBGM();
      nav('LevelSelect');
    });
    container.querySelector('#m3-btn-daily').addEventListener('pointerup', () => nav('DailyChallenge'));
    container.querySelector('#m3-btn-tournament').addEventListener('pointerup', () => {
      audioManager.unlock();
      audioManager.playClick();
    });
    container.querySelector('#m3-btn-settings').addEventListener('pointerup', () => nav('Settings'));

    // 설정 버튼 호버
    const settingsBtn = container.querySelector('#m3-btn-settings');
    settingsBtn.addEventListener('pointerenter', () => {
      settingsBtn.style.background = 'rgba(255,255,255,0.12)';
      settingsBtn.style.color = 'rgba(255,255,255,0.9)';
    });
    settingsBtn.addEventListener('pointerleave', () => {
      settingsBtn.style.background = 'rgba(255,255,255,0.08)';
      settingsBtn.style.color = 'rgba(255,255,255,0.7)';
    });
  }
}
