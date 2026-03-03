import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { audioManager } from '../managers/AudioManager.js';
import { UIButton } from '../ui/UIButton.js';
import { fadeToScene, fadeIn } from '../utils/SceneTransitions.js';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('Settings');
  }

  create() {
    fadeIn(this);
    const cx = GAME_CONFIG.WIDTH / 2;

    // 배경
    this.add.image(cx, GAME_CONFIG.HEIGHT / 2, 'bg_gradient');

    // ─── 상단 헤더 ──────────────────────────────

    // 뒤로가기 (glass rounded button)
    const backBg = this.add.graphics();
    backBg.fillStyle(0xffffff, 0.1);
    backBg.fillRoundedRect(20, 20, 44, 40, 12);
    this.add.text(42, 40, '←', {
      fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerup', () => fadeToScene(this, 'Menu'));

    // 타이틀
    this.add.text(84, 40, '설정', {
      fontSize: '24px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0, 0.5);

    // ─── 설정 아이템 (JSX glass list items) ─────

    const startY = 100;
    const itemH = 64;
    const itemGap = 10;
    const itemW = 500;

    const settings = [
      { icon: '🔊', label: '배경음악', key: 'bgmOn', toggle: true },
      { icon: '🔔', label: '효과음', key: 'soundOn', toggle: true },
    ];

    settings.forEach((item, i) => {
      const y = startY + i * (itemH + itemGap);

      // Glass background
      const bg = this.add.graphics();
      bg.fillStyle(0xffffff, 0.06);
      bg.fillRoundedRect(cx - itemW / 2, y, itemW, itemH, 16);
      bg.lineStyle(1, 0xffffff, 0.06);
      bg.strokeRoundedRect(cx - itemW / 2, y, itemW, itemH, 16);

      // Icon + Label
      this.add.text(cx - itemW / 2 + 22, y + itemH / 2, item.icon, {
        fontSize: '22px',
      }).setOrigin(0, 0.5);
      this.add.text(cx - itemW / 2 + 56, y + itemH / 2, item.label, {
        fontSize: '16px', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0, 0.5);

      if (item.toggle) {
        this._createToggleSwitch(cx + itemW / 2 - 50, y + itemH / 2, item.key);
      }
    });

    // ─── 데이터 초기화 (위험 버튼) ───────────────

    const resetY = startY + settings.length * (itemH + itemGap) + 30;
    new UIButton(this, cx, resetY + 25, 240, 48, {
      text: '데이터 초기화',
      fontSize: '16px',
      bgColor: 0xF44336,
      radius: 14,
      shadowOffset: 3,
      onClick: () => this.showResetConfirm(),
    });

    // ─── 하단 링크 아이템 ────────────────────────

    const linksY = resetY + 90;
    const links = [
      { icon: '📋', label: '이용약관' },
      { icon: '🔒', label: '개인정보 처리방침' },
      { icon: '💬', label: '고객 지원' },
    ];

    links.forEach((item, i) => {
      const y = linksY + i * 50;

      this.add.text(cx - itemW / 2 + 22, y, item.icon, {
        fontSize: '18px',
      }).setOrigin(0, 0.5);
      this.add.text(cx - itemW / 2 + 52, y, item.label, {
        fontSize: '15px', color: 'rgba(255,255,255,0.6)',
      }).setOrigin(0, 0.5);
      this.add.text(cx + itemW / 2 - 20, y, '›', {
        fontSize: '18px', color: 'rgba(255,255,255,0.3)',
      }).setOrigin(1, 0.5);

      // Separator line
      if (i < links.length - 1) {
        const sep = this.add.graphics();
        sep.lineStyle(1, 0xffffff, 0.05);
        sep.lineBetween(cx - itemW / 2 + 20, y + 25, cx + itemW / 2 - 20, y + 25);
      }
    });

    // 버전 정보
    this.add.text(cx, GAME_CONFIG.HEIGHT - 60, 'Match 3 Royale v2.0.0', {
      fontSize: '12px', color: 'rgba(255,255,255,0.2)',
    }).setOrigin(0.5);
  }

  _createToggleSwitch(x, y, key) {
    let value = true;
    try {
      const stored = localStorage.getItem(`match3_${key}`);
      if (stored !== null) value = stored === 'true';
    } catch (e) { /* ignore */ }

    const trackW = 52;
    const trackH = 30;
    const knobR = 12;

    const track = this.add.graphics();
    const knob = this.add.circle(0, y, knobR, 0xffffff).setDepth(1);

    const draw = () => {
      track.clear();
      if (value) {
        // Green gradient simulation
        track.fillStyle(0x43A047, 1);
        track.fillRoundedRect(x - trackW / 2, y - trackH / 2, trackW, trackH, trackH / 2);
        track.fillStyle(0x66BB6A, 0.5);
        track.fillRoundedRect(x - trackW / 2, y - trackH / 2, trackW, trackH / 2, { tl: trackH / 2, tr: trackH / 2, bl: 0, br: 0 });
        knob.setPosition(x + trackW / 2 - knobR - 3, y);
      } else {
        track.fillStyle(0xffffff, 0.15);
        track.fillRoundedRect(x - trackW / 2, y - trackH / 2, trackW, trackH, trackH / 2);
        knob.setPosition(x - trackW / 2 + knobR + 3, y);
      }
    };
    draw();

    // Hit area
    this.add.rectangle(x, y, trackW + 10, trackH + 10, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        if (key === 'soundOn') {
          value = audioManager.toggleSound();
        } else if (key === 'bgmOn') {
          value = audioManager.toggleBGM();
        } else {
          value = !value;
          try { localStorage.setItem(`match3_${key}`, String(value)); } catch (e) { /* ignore */ }
        }
        draw();
      });
  }

  showResetConfirm() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;

    const overlay = this.add.rectangle(cx, cy, WIDTH, HEIGHT, 0x000000, 0.75)
      .setDepth(50).setInteractive();

    const panel = this.add.graphics().setDepth(51);
    panel.fillStyle(0x1E1452, 0.98);
    panel.fillRoundedRect(cx - 170, cy - 100, 340, 200, 28);
    panel.lineStyle(1, 0xFF5252, 0.3);
    panel.strokeRoundedRect(cx - 170, cy - 100, 340, 200, 28);

    const text = this.add.text(cx, cy - 50, '모든 데이터를 삭제하시겠습니까?', {
      fontSize: '16px', color: '#ffffff', align: 'center',
    }).setOrigin(0.5).setDepth(52);
    const sub = this.add.text(cx, cy - 25, '되돌릴 수 없습니다!', {
      fontSize: '14px', color: '#FF5252',
    }).setOrigin(0.5).setDepth(52);

    const confirmBtn = new UIButton(this, cx - 70, cy + 40, 120, 44, {
      text: '삭제', fontSize: '16px', bgColor: 0xF44336, depth: 52, radius: 14,
      onClick: () => {
        try { localStorage.removeItem('match3royale_save'); } catch (e) { /* ignore */ }
        cleanup();
        this.scene.restart();
      },
    });

    const cancelBtn = new UIButton(this, cx + 70, cy + 40, 120, 44, {
      text: '취소', fontSize: '16px', bgColor: 0x43A047, depth: 52, radius: 14,
      onClick: () => { cleanup(); },
    });

    const cleanup = () => {
      [overlay, panel, text, sub].forEach(el => el.destroy());
      confirmBtn.destroy();
      cancelBtn.destroy();
    };
  }
}
