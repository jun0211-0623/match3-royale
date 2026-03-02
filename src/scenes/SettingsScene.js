import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('Settings');
  }

  create() {
    const cx = GAME_CONFIG.WIDTH / 2;

    // 뒤로가기
    this.add.text(30, 30, '< 뒤로', {
      fontSize: '24px',
      color: '#ffffff',
    }).setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.start('Menu'));

    // 타이틀
    this.add.text(cx, 80, '설정', {
      fontSize: '40px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    // 사운드 토글 (Phase 5에서 실제 구현)
    this.createToggle('사운드', 200, 'soundOn', true);
    this.createToggle('BGM', 280, 'bgmOn', true);

    // 데이터 초기화 버튼
    const resetBtn = this.add.rectangle(cx, 400, 240, 50, 0xe74c3c)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, 400, '데이터 초기화', {
      fontSize: '22px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);

    resetBtn.on('pointerup', () => {
      this.showResetConfirm();
    });

    // 버전 정보
    this.add.text(cx, GAME_CONFIG.HEIGHT - 60, 'match3-royale v1.0.0', {
      fontSize: '18px',
      color: '#555555',
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

    const toggle = this.add.rectangle(cx + 120, y, 100, 44, value ? 0x2ecc71 : 0xe74c3c)
      .setInteractive({ useHandCursor: true });
    const toggleLabel = this.add.text(cx + 120, y, value ? 'ON' : 'OFF', {
      fontSize: '22px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);

    toggle.on('pointerup', () => {
      value = !value;
      toggle.setFillStyle(value ? 0x2ecc71 : 0xe74c3c);
      toggleLabel.setText(value ? 'ON' : 'OFF');
      try { localStorage.setItem(`match3_${key}`, String(value)); } catch (e) { /* ignore */ }
    });
  }

  showResetConfirm() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;

    const overlay = this.add.rectangle(cx, cy, WIDTH, HEIGHT, 0x000000, 0.7)
      .setDepth(50).setInteractive();
    const panel = this.add.rectangle(cx, cy, 380, 200, 0x1a1a2e, 0.95)
      .setStrokeStyle(3, 0xe74c3c).setDepth(51);
    const text = this.add.text(cx, cy - 50, '모든 데이터를 삭제하시겠습니까?', {
      fontSize: '20px', color: '#ffffff', align: 'center',
    }).setOrigin(0.5).setDepth(52);
    const sub = this.add.text(cx, cy - 20, '되돌릴 수 없습니다!', {
      fontSize: '16px', color: '#e74c3c',
    }).setOrigin(0.5).setDepth(52);

    const elements = [overlay, panel, text, sub];

    const confirmBtn = this.add.rectangle(cx - 70, cy + 40, 120, 45, 0xe74c3c)
      .setDepth(52).setInteractive({ useHandCursor: true });
    const confirmLabel = this.add.text(cx - 70, cy + 40, '삭제', {
      fontSize: '20px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setDepth(53);

    confirmBtn.on('pointerup', () => {
      try { localStorage.removeItem('match3royale_save'); } catch (e) { /* ignore */ }
      elements.forEach(el => el.destroy());
      confirmBtn.destroy(); confirmLabel.destroy();
      cancelBtn.destroy(); cancelLabel.destroy();
      this.scene.restart();
    });

    const cancelBtn = this.add.rectangle(cx + 70, cy + 40, 120, 45, 0x2ecc71)
      .setDepth(52).setInteractive({ useHandCursor: true });
    const cancelLabel = this.add.text(cx + 70, cy + 40, '취소', {
      fontSize: '20px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setDepth(53);

    cancelBtn.on('pointerup', () => {
      elements.forEach(el => el.destroy());
      confirmBtn.destroy(); confirmLabel.destroy();
      cancelBtn.destroy(); cancelLabel.destroy();
    });
  }
}
