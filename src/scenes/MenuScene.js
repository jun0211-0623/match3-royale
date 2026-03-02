import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { SaveManager } from '../managers/SaveManager.js';
import { audioManager } from '../managers/AudioManager.js';
import { UIButton } from '../ui/UIButton.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const cx = GAME_CONFIG.WIDTH / 2;
    const cy = GAME_CONFIG.HEIGHT / 2;

    // 타이틀
    this.add.text(cx, cy - 250, '매치3', {
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#f1c40f',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 180, 'ROYALE', {
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    // 코인 표시
    this.add.text(cx, cy - 110, `💰 ${SaveManager.getCoins()}`, {
      fontSize: '24px',
      color: '#f1c40f',
    }).setOrigin(0.5);

    // 플레이 버튼
    new UIButton(this, cx, cy, 280, 70, {
      text: '플레이',
      fontSize: '34px',
      bgColor: 0x2ecc71,
      onClick: () => {
        audioManager.unlock();
        audioManager.playClick();
        audioManager.startBGM();
        this.scene.start('LevelSelect');
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
        this.scene.start('Settings');
      },
    });

    // 버전 표시
    this.add.text(cx, GAME_CONFIG.HEIGHT - 40, 'v1.0.0', {
      fontSize: '16px',
      color: '#666666',
    }).setOrigin(0.5);
  }
}
