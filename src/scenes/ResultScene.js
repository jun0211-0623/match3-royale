import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { LevelManager } from '../managers/LevelManager.js';
import { SaveManager } from '../managers/SaveManager.js';
import { audioManager } from '../managers/AudioManager.js';
import { UIButton } from '../ui/UIButton.js';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  init(data) {
    this.level = data.level || 1;
    this.cleared = data.cleared || false;
    this.stars = data.stars || 0;
    this.score = data.score || 0;
    this.coins = data.coins || 0;
  }

  create() {
    const cx = GAME_CONFIG.WIDTH / 2;
    const cy = GAME_CONFIG.HEIGHT / 2;

    // 사운드
    if (this.cleared) {
      audioManager.playClear();
    } else {
      audioManager.playFail();
    }

    // 배경 어둡게
    this.add.rectangle(cx, cy, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT, 0x000000, 0.4);

    // 결과 패널 (둥근 모서리)
    const panelH = this.cleared ? 450 : 380;
    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a2e, 0.95);
    panel.fillRoundedRect(cx - 220, cy - panelH / 2, 440, panelH, 20);
    panel.lineStyle(3, this.cleared ? 0xf1c40f : 0xe74c3c, 1);
    panel.strokeRoundedRect(cx - 220, cy - panelH / 2, 440, panelH, 20);

    // 타이틀
    const title = this.cleared ? '레벨 클리어!' : '실패...';
    const titleColor = this.cleared ? '#f1c40f' : '#e74c3c';

    this.add.text(cx, cy - panelH / 2 + 40, title, {
      fontSize: '42px',
      fontStyle: 'bold',
      color: titleColor,
    }).setOrigin(0.5);

    if (this.cleared) {
      // 별 애니메이션
      const starY = cy - panelH / 2 + 100;
      for (let i = 0; i < 3; i++) {
        const star = this.add.text(cx - 60 + i * 60, starY, i < this.stars ? '★' : '☆', {
          fontSize: '48px',
          color: '#f1c40f',
        }).setOrigin(0.5).setScale(0).setAlpha(0);

        this.tweens.add({
          targets: star,
          scaleX: 1, scaleY: 1, alpha: 1,
          duration: 300,
          delay: 300 + i * 200,
          ease: 'Back.easeOut',
        });
      }

      this.add.text(cx, cy - panelH / 2 + 155, `점수: ${this.score}`, {
        fontSize: '26px', color: '#ffffff',
      }).setOrigin(0.5);

      this.add.text(cx, cy - panelH / 2 + 190, `+${this.coins} 💰`, {
        fontSize: '24px', color: '#f1c40f',
      }).setOrigin(0.5);

      // 다음 레벨
      if (LevelManager.hasLevel(this.level + 1)) {
        new UIButton(this, cx, cy + 20, 280, 60, {
          text: '다음 레벨',
          fontSize: '28px',
          bgColor: 0x2ecc71,
          onClick: () => this.scene.start('Game', { level: this.level + 1 }),
        });
      }

      // 재시도
      new UIButton(this, cx, cy + 95, 280, 55, {
        text: '재시도',
        fontSize: '24px',
        bgColor: 0x3498db,
        onClick: () => this.scene.start('Game', { level: this.level }),
      });

    } else {
      this.add.text(cx, cy - panelH / 2 + 100, `점수: ${this.score}`, {
        fontSize: '26px', color: '#ffffff',
      }).setOrigin(0.5);

      // 추가 이동 구매
      const extraCost = GAME_CONFIG.ECONOMY.BOOSTER_EXTRA_MOVES;
      const canBuy = SaveManager.getCoins() >= extraCost;

      new UIButton(this, cx, cy - 20, 280, 55, {
        text: `+5 이동 (${extraCost}💰)`,
        fontSize: '22px',
        bgColor: canBuy ? 0xe67e22 : 0x555555,
        onClick: () => {
          if (canBuy && SaveManager.spendCoins(extraCost)) {
            this.scene.start('Game', { level: this.level });
          }
        },
      });

      // 재시도
      new UIButton(this, cx, cy + 50, 280, 55, {
        text: '재시도',
        fontSize: '24px',
        bgColor: 0x3498db,
        onClick: () => this.scene.start('Game', { level: this.level }),
      });
    }

    // 레벨 선택
    new UIButton(this, cx, cy + panelH / 2 - 45, 280, 55, {
      text: '레벨 선택',
      fontSize: '24px',
      bgColor: 0x7f8c8d,
      onClick: () => this.scene.start('LevelSelect'),
    });
  }
}
