import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { SaveManager } from '../managers/SaveManager.js';
import { LevelManager } from '../managers/LevelManager.js';
import { UIButton } from '../ui/UIButton.js';
import { fadeToScene, fadeIn } from '../utils/SceneTransitions.js';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create() {
    fadeIn(this);
    const cx = GAME_CONFIG.WIDTH / 2;
    const saveData = SaveManager.load();
    const totalLevels = LevelManager.getTotalLevels();

    // 배경
    this.add.image(cx, GAME_CONFIG.HEIGHT / 2, 'bg_gradient');

    // 상단 뒤로가기
    this.add.text(30, 30, '< 뒤로', {
      fontSize: '24px',
      color: '#ffffff',
    }).setInteractive({ useHandCursor: true })
      .on('pointerup', () => fadeToScene(this, 'Menu'));

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
      stroke: '#000000',
      strokeThickness: 2,
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

      let bgColor = 0x444444;
      if (isCurrent) bgColor = 0xe67e22;
      else if (isUnlocked) bgColor = 0x3498db;

      if (isUnlocked) {
        const btn = new UIButton(this, x, y, btnSize, btnSize, {
          text: `${level}`,
          fontSize: '32px',
          bgColor,
          radius: 16,
          shadowOffset: 3,
          glow: isCurrent,
          glowColor: 0xe67e22,
          onClick: () => fadeToScene(this, 'Game', { level }),
        });

        // 순차 등장 애니메이션
        btn.bg.setAlpha(0);
        btn.label.setAlpha(0);
        btn.shadow.setAlpha(0);
        this.tweens.add({
          targets: [btn.bg, btn.label, btn.shadow, btn.hitArea],
          alpha: 1,
          duration: 200,
          delay: i * 35,
          ease: 'Power2',
        });

        // 별 표시
        if (stars > 0) {
          const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
          const starText = this.add.text(x, y + 30, starStr, {
            fontSize: '14px',
            color: '#f1c40f',
          }).setOrigin(0.5).setAlpha(0);
          this.tweens.add({
            targets: starText,
            alpha: 1,
            duration: 200,
            delay: i * 35 + 100,
          });
        }
      } else {
        // 잠긴 레벨
        const g = this.add.graphics();
        g.fillStyle(0x222233, 0.5);
        g.fillRoundedRect(x - btnSize / 2, y - btnSize / 2, btnSize, btnSize, 16);
        g.lineStyle(1, 0x333344, 0.3);
        g.strokeRoundedRect(x - btnSize / 2, y - btnSize / 2, btnSize, btnSize, 16);
        const lock = this.add.text(x, y, '🔒', { fontSize: '28px' }).setOrigin(0.5);

        // 순차 등장
        g.setAlpha(0);
        lock.setAlpha(0);
        this.tweens.add({
          targets: [g, lock],
          alpha: 1,
          duration: 200,
          delay: i * 35,
        });
      }
    }
  }
}
