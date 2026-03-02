import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { SaveManager } from '../managers/SaveManager.js';
import { LevelManager } from '../managers/LevelManager.js';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create() {
    const cx = GAME_CONFIG.WIDTH / 2;
    const saveData = SaveManager.load();
    const totalLevels = LevelManager.getTotalLevels();

    // 상단 뒤로가기
    this.add.text(30, 30, '< 뒤로', {
      fontSize: '24px',
      color: '#ffffff',
    }).setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.start('Menu'));

    // 코인 표시
    this.add.text(GAME_CONFIG.WIDTH - 30, 30, `💰 ${saveData.coins}`, {
      fontSize: '22px',
      color: '#f1c40f',
    }).setOrigin(1, 0);

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

    for (let i = 0; i < totalLevels; i++) {
      const level = i + 1;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (btnSize + gap);
      const y = startY + row * (btnSize + gap);

      const isUnlocked = level <= saveData.unlockedLevel;
      const isCurrent = level === saveData.unlockedLevel;
      const stars = saveData.levelStars[level] || 0;

      let bgColor = 0x555555;
      let strokeColor = 0x444444;
      if (isCurrent) {
        bgColor = 0xe67e22;
        strokeColor = 0xd35400;
      } else if (isUnlocked) {
        bgColor = 0x3498db;
        strokeColor = 0x2980b9;
      }

      const btn = this.add.rectangle(x, y, btnSize, btnSize, bgColor, 1)
        .setStrokeStyle(3, strokeColor);

      if (isUnlocked) {
        this.add.text(x, y - 10, `${level}`, {
          fontSize: '32px',
          fontStyle: 'bold',
          color: '#ffffff',
        }).setOrigin(0.5);

        // 별 표시
        if (stars > 0) {
          const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
          this.add.text(x, y + 28, starStr, {
            fontSize: '14px',
            color: '#f1c40f',
          }).setOrigin(0.5);
        }

        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => btn.setFillStyle(isCurrent ? 0xd35400 : 0x2980b9));
        btn.on('pointerout', () => btn.setFillStyle(bgColor));
        btn.on('pointerup', () => {
          this.scene.start('Game', { level });
        });
      } else {
        this.add.text(x, y, '🔒', {
          fontSize: '28px',
        }).setOrigin(0.5);
      }
    }
  }
}
