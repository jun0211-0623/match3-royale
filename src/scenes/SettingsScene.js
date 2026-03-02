import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('Settings');
  }

  create() {
    const cx = GAME_CONFIG.WIDTH / 2;

    // 뒤로가기
    const backBtn = this.add.text(30, 30, '< 뒤로', {
      fontSize: '24px',
      color: '#ffffff',
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerup', () => {
      this.scene.start('Menu');
    });

    // 타이틀
    this.add.text(cx, 80, '설정', {
      fontSize: '40px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    // 사운드 토글 (Phase 5에서 실제 구현)
    this.add.text(cx - 120, 200, '사운드', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    const soundToggle = this.add.rectangle(cx + 120, 200, 100, 44, 0x2ecc71)
      .setInteractive({ useHandCursor: true });
    const soundLabel = this.add.text(cx + 120, 200, 'ON', {
      fontSize: '22px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);

    let soundOn = true;
    soundToggle.on('pointerup', () => {
      soundOn = !soundOn;
      soundToggle.setFillStyle(soundOn ? 0x2ecc71 : 0xe74c3c);
      soundLabel.setText(soundOn ? 'ON' : 'OFF');
    });

    // BGM 토글
    this.add.text(cx - 120, 270, 'BGM', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    const bgmToggle = this.add.rectangle(cx + 120, 270, 100, 44, 0x2ecc71)
      .setInteractive({ useHandCursor: true });
    const bgmLabel = this.add.text(cx + 120, 270, 'ON', {
      fontSize: '22px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);

    let bgmOn = true;
    bgmToggle.on('pointerup', () => {
      bgmOn = !bgmOn;
      bgmToggle.setFillStyle(bgmOn ? 0x2ecc71 : 0xe74c3c);
      bgmLabel.setText(bgmOn ? 'ON' : 'OFF');
    });

    // 버전 정보
    this.add.text(cx, GAME_CONFIG.HEIGHT - 60, 'match3-royale v1.0.0', {
      fontSize: '18px',
      color: '#555555',
    }).setOrigin(0.5);
  }
}
