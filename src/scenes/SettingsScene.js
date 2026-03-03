import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { audioManager } from '../managers/AudioManager.js';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('Settings');
  }

  create() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;
    const cx = W / 2;
    const cy = H / 2;

    // 토글 상태
    let bgmOn = true;
    let soundOn = true;
    try {
      const s1 = localStorage.getItem('match3_bgmOn');
      const s2 = localStorage.getItem('match3_soundOn');
      if (s1 !== null) bgmOn = s1 === 'true';
      if (s2 !== null) soundOn = s2 === 'true';
    } catch (e) { /* ignore */ }

    const makeToggle = (id, on) => `
      <div id="${id}" style="width:52px;height:30px;border-radius:15px;background:${on ? 'linear-gradient(135deg,#66BB6A,#2E7D32)' : 'rgba(255,255,255,0.15)'};cursor:pointer;position:relative;transition:all 0.3s;box-shadow:${on ? '0 2px 8px rgba(46,125,50,0.4)' : 'none'};">
        <div style="width:24px;height:24px;border-radius:50%;background:white;position:absolute;top:3px;left:${on ? '25px' : '3px'};transition:all 0.3s;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></div>
      </div>
    `;

    const settingsItems = [
      { icon: '🔊', label: '배경음악', id: 'toggle-bgm', on: bgmOn },
      { icon: '🔔', label: '효과음', id: 'toggle-sound', on: soundOn },
    ];

    const linksItems = [
      { icon: '📋', label: '이용약관' },
      { icon: '🔒', label: '개인정보 처리방침' },
      { icon: '💬', label: '고객 지원' },
    ];

    const container = document.createElement('div');
    container.style.cssText = `
      width:${W}px;height:${H}px;position:relative;overflow:hidden;
      font-family:'Segoe UI',system-ui,sans-serif;
      background:linear-gradient(180deg,#0A0E27 0%,#1A1145 50%,#2D1B69 100%);
      padding:20px;box-sizing:border-box;
    `;

    container.innerHTML = `
      <style>
        @keyframes m3s-slide-up { from { opacity:0;transform:translateY(20px); } to { opacity:1;transform:translateY(0); } }
        @keyframes m3s-modal-enter { from { opacity:0;transform:scale(0.9) translateY(10px); } to { opacity:1;transform:scale(1) translateY(0); } }
        .m3s-setting-item { transition:background 0.2s ease; }
        .m3s-setting-item:hover { background:rgba(255,255,255,0.1) !important; }
        #m3s-back { transition:all 0.15s ease; }
        #m3s-back:hover { background:rgba(255,255,255,0.18) !important;transform:translateX(-2px); }
        #m3s-back:active { transform:translateX(1px) scale(0.95); }
        #m3s-reset { transition:transform 0.15s ease,filter 0.15s ease; }
        #m3s-reset:hover { transform:translateY(-2px);filter:brightness(1.1); }
        #m3s-reset:active { transform:translateY(3px) scale(0.98) !important;filter:brightness(0.9) !important; }
        .m3s-link-item { transition:background 0.2s ease,padding-left 0.2s ease; }
        .m3s-link-item:hover { background:rgba(255,255,255,0.04); }
        .m3s-link-item:hover .m3s-chevron { transform:translateX(4px);color:rgba(255,255,255,0.6) !important; }
        .m3s-chevron { transition:transform 0.2s ease,color 0.2s ease; }
        .m3s-modal-card { animation:m3s-modal-enter 0.3s ease-out; }
        .m3s-modal-btn { transition:transform 0.15s ease,filter 0.15s ease; }
        .m3s-modal-btn:hover { transform:translateY(-1px);filter:brightness(1.1); }
        .m3s-modal-btn:active { transform:translateY(2px) scale(0.98);filter:brightness(0.9); }
      </style>

      <div style="max-width:400px;margin:0 auto;">
        <!-- Header -->
        <div style="display:flex;align-items:center;margin-bottom:32px;">
          <button id="m3s-back" style="background:rgba(255,255,255,0.1);border:none;border-radius:12px;padding:10px 14px;cursor:pointer;color:white;font-size:18px;">←</button>
          <h2 style="color:white;margin:0 0 0 16px;font-size:24px;font-weight:900;">설정</h2>
        </div>

        <!-- Toggle items -->
        ${settingsItems.map((item, i) => `
          <div class="m3s-setting-item" style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px;background:rgba(255,255,255,0.06);border-radius:16px;margin-bottom:10px;border:1px solid rgba(255,255,255,0.06);animation:m3s-slide-up 0.4s ease-out ${i * 0.08}s both;">
            <div style="display:flex;align-items:center;gap:14px;">
              <span style="font-size:22px;">${item.icon}</span>
              <span style="color:white;font-weight:700;font-size:16px;">${item.label}</span>
            </div>
            ${makeToggle(item.id, item.on)}
          </div>
        `).join('')}

        <!-- Reset button -->
        <div style="margin-top:20px;animation:m3s-slide-up 0.4s ease-out 0.2s both;">
          <button id="m3s-reset" style="width:100%;padding:16px;font-size:16px;font-weight:800;color:white;background:linear-gradient(180deg,#EF5350,#C62828);border:none;border-radius:16px;cursor:pointer;box-shadow:0 4px 0 #B71C1C,0 6px 12px rgba(198,40,40,0.3);font-family:'Segoe UI',system-ui,sans-serif;">
            데이터 초기화
          </button>
        </div>

        <!-- Links section -->
        <div style="margin-top:30px;">
          ${linksItems.map((item, i) => `
            <div class="m3s-link-item" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);animation:m3s-slide-up 0.4s ease-out ${(i + 3) * 0.08}s both;">
              <div style="display:flex;align-items:center;gap:14px;">
                <span style="font-size:18px;">${item.icon}</span>
                <span style="color:rgba(255,255,255,0.6);font-size:15px;">${item.label}</span>
              </div>
              <span class="m3s-chevron" style="color:rgba(255,255,255,0.3);">›</span>
            </div>
          `).join('')}
        </div>

        <p style="text-align:center;color:rgba(255,255,255,0.2);font-size:12px;margin-top:40px;">Match 3 Royale v2.0.0</p>
      </div>

      <!-- Reset confirm overlay -->
      <div id="m3s-confirm-overlay" style="display:none;position:absolute;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);align-items:center;justify-content:center;z-index:100;">
        <div class="m3s-modal-card" style="background:linear-gradient(180deg,#1E1452,#2D1B69);border:1px solid rgba(255,82,82,0.3);border-radius:24px;padding:32px 28px;max-width:320px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
          <div style="font-size:40px;margin-bottom:12px;">⚠️</div>
          <h3 style="color:white;font-size:18px;margin:0 0 8px;font-weight:800;">모든 데이터를 삭제하시겠습니까?</h3>
          <p style="color:#FF5252;font-size:14px;margin:0 0 24px;">되돌릴 수 없습니다!</p>
          <div style="display:flex;gap:10px;">
            <button id="m3s-cancel" class="m3s-modal-btn" style="flex:1;padding:14px;font-size:16px;font-weight:800;color:white;background:linear-gradient(180deg,#66BB6A,#2E7D32);border:none;border-radius:14px;cursor:pointer;box-shadow:0 4px 0 #1B5E20;font-family:'Segoe UI',system-ui,sans-serif;">취소</button>
            <button id="m3s-delete" class="m3s-modal-btn" style="flex:1;padding:14px;font-size:16px;font-weight:800;color:white;background:linear-gradient(180deg,#EF5350,#C62828);border:none;border-radius:14px;cursor:pointer;box-shadow:0 4px 0 #B71C1C;font-family:'Segoe UI',system-ui,sans-serif;">삭제</button>
          </div>
        </div>
      </div>
    `;

    this.domUI = this.add.dom(cx, cy, container);

    // 페이드 인
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.3s ease';
    this.time.delayedCall(50, () => { container.style.opacity = '1'; });

    // 뒤로가기
    container.querySelector('#m3s-back').addEventListener('pointerup', () => {
      if (this._nav) return;
      this._nav = true;
      audioManager.playClick();
      container.style.opacity = '0';
      this.time.delayedCall(300, () => this.scene.start('Menu'));
    });

    // 토글 이벤트
    const setupToggle = (id, key, getter) => {
      const el = container.querySelector(`#${id}`);
      el.addEventListener('pointerup', () => {
        audioManager.playClick();
        let newVal;
        if (key === 'soundOn') newVal = audioManager.toggleSound();
        else if (key === 'bgmOn') newVal = audioManager.toggleBGM();
        else {
          newVal = !(localStorage.getItem(`match3_${key}`) !== 'false');
          localStorage.setItem(`match3_${key}`, String(newVal));
        }
        el.style.background = newVal ? 'linear-gradient(135deg,#66BB6A,#2E7D32)' : 'rgba(255,255,255,0.15)';
        el.style.boxShadow = newVal ? '0 2px 8px rgba(46,125,50,0.4)' : 'none';
        el.querySelector('div').style.left = newVal ? '25px' : '3px';
      });
    };
    setupToggle('toggle-bgm', 'bgmOn');
    setupToggle('toggle-sound', 'soundOn');

    // 리셋 확인
    const overlay = container.querySelector('#m3s-confirm-overlay');
    overlay.style.transition = 'opacity 0.2s ease';

    const showOverlay = () => {
      overlay.style.display = 'flex';
      overlay.style.opacity = '0';
      requestAnimationFrame(() => { overlay.style.opacity = '1'; });
    };
    const hideOverlay = (cb) => {
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.style.display = 'none'; if (cb) cb(); }, 200);
    };

    container.querySelector('#m3s-reset').addEventListener('pointerup', showOverlay);
    container.querySelector('#m3s-cancel').addEventListener('pointerup', () => hideOverlay());
    container.querySelector('#m3s-delete').addEventListener('pointerup', () => {
      try { localStorage.removeItem('match3royale_save'); } catch (e) {}
      hideOverlay(() => this.scene.restart());
    });
  }
}
