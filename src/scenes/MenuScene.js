import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { SaveManager } from '../managers/SaveManager.js';
import { audioManager } from '../managers/AudioManager.js';
import { UIButton } from '../ui/UIButton.js';
import { fadeToScene, fadeIn } from '../utils/SceneTransitions.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    fadeIn(this);
    const cx = GAME_CONFIG.WIDTH / 2;
    const cy = GAME_CONFIG.HEIGHT / 2;

    // 배경
    this.add.image(cx, cy, 'bg_gradient');

    // 앰비언트 파티클
    this.add.particles(cx, GAME_CONFIG.HEIGHT + 10, 'particle_glow', {
      x: { min: -cx, max: cx },
      speed: { min: 10, max: 30 },
      angle: { min: 260, max: 280 },
      scale: { start: 0.35, end: 0.1 },
      alpha: { start: 0.15, end: 0 },
      tint: [0x3498db, 0x9b59b6, 0x2ecc71],
      lifespan: { min: 4000, max: 8000 },
      frequency: 800,
      quantity: 1,
    }).setDepth(-1);

    // 타이틀 (등장 애니메이션)
    const title1 = this.add.text(cx, cy - 250, '매치3', {
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#f1c40f',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    const title2 = this.add.text(cx, cy - 180, 'ROYALE', {
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    // 타이틀 등장
    this.tweens.add({
      targets: title1,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: title2,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 500,
      delay: 150,
      ease: 'Back.easeOut',
    });

    // 타이틀 글로우
    if (title1.preFX) {
      title1.preFX.addGlow(0xf1c40f, 4, 0, false, 0.05, 10);
    }

    // 타이틀 떠다니기
    this.tweens.add({
      targets: [title1, title2],
      y: '-=6',
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 코인 표시
    this.add.text(cx, cy - 110, `💰 ${SaveManager.getCoins()}`, {
      fontSize: '24px',
      color: '#f1c40f',
    }).setOrigin(0.5);

    // 플레이 버튼 (글로우)
    new UIButton(this, cx, cy, 280, 70, {
      text: '플레이',
      fontSize: '34px',
      bgColor: 0x2ecc71,
      glow: true,
      glowColor: 0x2ecc71,
      onClick: () => {
        audioManager.unlock();
        audioManager.playClick();
        audioManager.startBGM();
        fadeToScene(this, 'LevelSelect');
      },
    });

    // 설정 버튼
    new UIButton(this, cx, cy + 100, 280, 70, {
      text: '설정',
      fontSize: '34px',
      bgColor: 0x7f8c8d,
      onClick: () => {
        audioManager.unlock();
        audioManager.playClick();
        fadeToScene(this, 'Settings');
      },
    });

    // 버전 표시
    this.add.text(cx, GAME_CONFIG.HEIGHT - 40, 'v1.0.0', {
      fontSize: '16px',
      color: '#444466',
    }).setOrigin(0.5);
  }
}
