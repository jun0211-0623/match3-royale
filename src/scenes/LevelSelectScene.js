import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create() {
    const cx = GAME_CONFIG.WIDTH / 2;

    // 상단 뒤로가기
    const backBtn = this.add.text(30, 30, '< 뒤로', {
      fontSize: '24px',
      color: '#ffffff',
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerup', () => {
      this.scene.start('Menu');
    });

    // 타이틀
    this.add.text(cx, 80, '레벨 선택', {
      fontSize: '40px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    // 레벨 버튼 격자 (5열)
    const cols = 5;
    const btnSize = 100;
    const gap = 20;
    const startX = (GAME_CONFIG.WIDTH - (cols * btnSize + (cols - 1) * gap)) / 2 + btnSize / 2;
    const startY = 180;

    // TODO: SaveManager에서 진행 상황 로드
    const unlockedLevel = 1;

    for (let i = 0; i < 15; i++) {
      const level = i + 1;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (btnSize + gap);
      const y = startY + row * (btnSize + gap);

      const isUnlocked = level <= unlockedLevel;
      const color = isUnlocked ? 0x3498db : 0x555555;

      const btn = this.add.rectangle(x, y, btnSize, btnSize, color, 1)
        .setStrokeStyle(3, isUnlocked ? 0x2980b9 : 0x444444);

      const label = this.add.text(x, y, isUnlocked ? `${level}` : '🔒', {
        fontSize: isUnlocked ? '32px' : '28px',
        fontStyle: 'bold',
        color: '#ffffff',
      }).setOrigin(0.5);

      if (isUnlocked) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => btn.setFillStyle(0x2980b9));
        btn.on('pointerout', () => btn.setFillStyle(0x3498db));
        btn.on('pointerup', () => {
          this.scene.start('Game', { level });
        });
      }
    }
  }
}
