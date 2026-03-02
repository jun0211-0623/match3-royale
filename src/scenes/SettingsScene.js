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

    // 뒤로가기
    this.add.text(30, 30, '< 뒤로', {
      fontSize: '24px',
      color: '#ffffff',
    }).setInteractive({ useHandCursor: true })
      .on('pointerup', () => fadeToScene(this, 'Menu'));

    // 타이틀
    this.add.text(cx, 80, '설정', {
      fontSize: '40px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // 설정 패널 배경
    const settingsPanel = this.add.graphics();
    settingsPanel.fillStyle(0x0d1b2a, 0.4);
    settingsPanel.fillRoundedRect(cx - 250, 140, 500, 340, 16);
    settingsPanel.lineStyle(1, 0x1a4a6e, 0.25);
    settingsPanel.strokeRoundedRect(cx - 250, 140, 500, 340, 16);

    // 사운드 토글
    this.createToggle('사운드', 200, 'soundOn', true);
    this.createToggle('BGM', 280, 'bgmOn', true);

    // 데이터 초기화 버튼
    new UIButton(this, cx, 400, 240, 50, {
      text: '데이터 초기화',
      fontSize: '22px',
      bgColor: 0xe74c3c,
      onClick: () => this.showResetConfirm(),
    });

    // 버전 정보
    this.add.text(cx, GAME_CONFIG.HEIGHT - 60, 'match3-royale v1.0.0', {
      fontSize: '18px',
      color: '#444466',
    }).setOrigin(0.5);
  }

  createToggle(label, y, key, defaultVal) {
    const cx = GAME_CONFIG.WIDTH / 2;

    this.add.text(cx - 120, y, label, {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    let value = defaultVal;
    try {
      const stored = localStorage.getItem(`match3_${key}`);
      if (stored !== null) value = stored === 'true';
    } catch (e) { /* ignore */ }

    const toggleBtn = new UIButton(this, cx + 120, y, 100, 44, {
      text: value ? 'ON' : 'OFF',
      fontSize: '22px',
      bgColor: value ? 0x2ecc71 : 0xe74c3c,
      radius: 12,
      onClick: () => {
        if (key === 'soundOn') {
          value = audioManager.toggleSound();
        } else if (key === 'bgmOn') {
          value = audioManager.toggleBGM();
        } else {
          value = !value;
          try { localStorage.setItem(`match3_${key}`, String(value)); } catch (e) { /* ignore */ }
        }
        toggleBtn.setColor(value ? 0x2ecc71 : 0xe74c3c);
        toggleBtn.setText(value ? 'ON' : 'OFF');
      },
    });
  }

  showResetConfirm() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;

    const overlay = this.add.rectangle(cx, cy, WIDTH, HEIGHT, 0x000000, 0.7)
      .setDepth(50).setInteractive();

    const panel = this.add.graphics().setDepth(51);
    panel.fillStyle(0x0d1b2a, 0.95);
    panel.fillRoundedRect(cx - 190, cy - 100, 380, 200, 20);
    panel.lineStyle(3, 0xe74c3c, 1);
    panel.strokeRoundedRect(cx - 190, cy - 100, 380, 200, 20);

    const text = this.add.text(cx, cy - 50, '모든 데이터를 삭제하시겠습니까?', {
      fontSize: '20px', color: '#ffffff', align: 'center',
    }).setOrigin(0.5).setDepth(52);
    const sub = this.add.text(cx, cy - 20, '되돌릴 수 없습니다!', {
      fontSize: '16px', color: '#e74c3c',
    }).setOrigin(0.5).setDepth(52);

    const confirmBtn = new UIButton(this, cx - 70, cy + 50, 120, 45, {
      text: '삭제', fontSize: '20px', bgColor: 0xe74c3c, depth: 52,
      onClick: () => {
        try { localStorage.removeItem('match3royale_save'); } catch (e) { /* ignore */ }
        cleanup();
        this.scene.restart();
      },
    });

    const cancelBtn = new UIButton(this, cx + 70, cy + 50, 120, 45, {
      text: '취소', fontSize: '20px', bgColor: 0x2ecc71, depth: 52,
      onClick: () => { cleanup(); },
    });

    const cleanup = () => {
      [overlay, panel, text, sub].forEach(el => el.destroy());
      confirmBtn.destroy();
      cancelBtn.destroy();
    };
  }
}
