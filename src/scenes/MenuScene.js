import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const cx = GAME_CONFIG.WIDTH / 2;
    const cy = GAME_CONFIG.HEIGHT / 2;

    // 타이틀
    this.add.text(cx, cy - 200, '매치3 퍼즐', {
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    // 플레이 버튼
    const playBtn = this.add.rectangle(cx, cy, 240, 70, 0x2ecc71, 1)
      .setInteractive({ useHandCursor: true });

    this.add.text(cx, cy, '플레이', {
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    playBtn.on('pointerover', () => playBtn.setFillStyle(0x27ae60));
    playBtn.on('pointerout', () => playBtn.setFillStyle(0x2ecc71));
    playBtn.on('pointerup', () => {
      this.scene.start('LevelSelect');
    });

    // 설정 버튼
    const settingsBtn = this.add.rectangle(cx, cy + 100, 240, 70, 0x7f8c8d, 1)
      .setInteractive({ useHandCursor: true });

    this.add.text(cx, cy + 100, '설정', {
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    settingsBtn.on('pointerover', () => settingsBtn.setFillStyle(0x95a5a6));
    settingsBtn.on('pointerout', () => settingsBtn.setFillStyle(0x7f8c8d));
    settingsBtn.on('pointerup', () => {
      this.scene.start('Settings');
    });

    // 버전 표시
    this.add.text(cx, GAME_CONFIG.HEIGHT - 40, 'v1.0.0', {
      fontSize: '16px',
      color: '#666666',
    }).setOrigin(0.5);
  }
}
