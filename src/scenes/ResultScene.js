import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { LevelManager } from '../managers/LevelManager.js';
import { SaveManager } from '../managers/SaveManager.js';
import { audioManager } from '../managers/AudioManager.js';
import { UIButton } from '../ui/UIButton.js';
import { fadeToScene, fadeIn } from '../utils/SceneTransitions.js';

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
    fadeIn(this);
    const cx = GAME_CONFIG.WIDTH / 2;
    const cy = GAME_CONFIG.HEIGHT / 2;

    // 배경
    this.add.image(cx, cy, 'bg_gradient');

    // 사운드
    if (this.cleared) {
      audioManager.playClear();
    } else {
      audioManager.playFail();
    }

    // 배경 어둡게
    this.add.rectangle(cx, cy, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT, 0x000000, 0.35);

    // 클리어 시 컨페티
    if (this.cleared) {
      const confetti = this.add.particles(cx, -20, 'particle_square', {
        x: { min: -cx, max: cx },
        speed: { min: 80, max: 200 },
        angle: { min: 75, max: 105 },
        scale: { start: 0.8, end: 0.3 },
        alpha: { start: 1, end: 0.5 },
        tint: [0xe74c3c, 0xf1c40f, 0x2ecc71, 0x3498db, 0x9b59b6, 0xffffff],
        lifespan: { min: 2000, max: 4000 },
        frequency: 50,
        quantity: 2,
        rotate: { min: 0, max: 360 },
        gravityY: 80,
      }).setDepth(1);

      this.time.delayedCall(3000, () => confetti.stop());
      this.time.delayedCall(7000, () => confetti.destroy());
    }

    // 결과 패널
    const panelH = this.cleared ? 450 : 380;
    const panel = this.add.graphics();
    panel.fillStyle(0x0d1b2a, 0.95);
    panel.fillRoundedRect(cx - 220, cy - panelH / 2, 440, panelH, 20);
    panel.lineStyle(3, this.cleared ? 0xf1c40f : 0xe74c3c, 1);
    panel.strokeRoundedRect(cx - 220, cy - panelH / 2, 440, panelH, 20);

    // 타이틀
    const title = this.cleared ? '레벨 클리어!' : '실패...';
    const titleColor = this.cleared ? '#f1c40f' : '#e74c3c';

    const titleText = this.add.text(cx, cy - panelH / 2 + 40, title, {
      fontSize: '42px',
      fontStyle: 'bold',
      color: titleColor,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    if (this.cleared && titleText.preFX) {
      titleText.preFX.addGlow(0xf1c40f, 3, 0, false, 0.05, 8);
    }

    if (this.cleared) {
      // 별 애니메이션 (오버슈트 + 스파클)
      const starY = cy - panelH / 2 + 100;
      for (let i = 0; i < 3; i++) {
        const star = this.add.text(cx - 60 + i * 60, starY, i < this.stars ? '★' : '☆', {
          fontSize: '52px',
          color: i < this.stars ? '#f1c40f' : '#555555',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5).setScale(0).setAlpha(0);

        this.tweens.add({
          targets: star,
          scaleX: 1.3, scaleY: 1.3,
          alpha: 1,
          duration: 300,
          delay: 400 + i * 250,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: star,
              scaleX: 1, scaleY: 1,
              duration: 150,
              ease: 'Power1',
            });
            // 스파클 파티클
            if (i < this.stars) {
              const sparkle = this.add.particles(star.x, star.y, 'particle_circle', {
                speed: { min: 30, max: 80 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.5, end: 0 },
                tint: 0xf1c40f,
                lifespan: 400,
                quantity: 8,
                emitting: false,
              });
              sparkle.explode();
              this.time.delayedCall(500, () => sparkle.destroy());
            }
          },
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
          glow: true,
          glowColor: 0x2ecc71,
          onClick: () => fadeToScene(this, 'Game', { level: this.level + 1 }),
        });
      }

      // 재시도
      new UIButton(this, cx, cy + 95, 280, 55, {
        text: '재시도',
        fontSize: '24px',
        bgColor: 0x3498db,
        onClick: () => fadeToScene(this, 'Game', { level: this.level }),
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
            fadeToScene(this, 'Game', { level: this.level });
          }
        },
      });

      // 재시도
      new UIButton(this, cx, cy + 50, 280, 55, {
        text: '재시도',
        fontSize: '24px',
        bgColor: 0x3498db,
        onClick: () => fadeToScene(this, 'Game', { level: this.level }),
      });
    }

    // 레벨 선택
    new UIButton(this, cx, cy + panelH / 2 - 45, 280, 55, {
      text: '레벨 선택',
      fontSize: '24px',
      bgColor: 0x7f8c8d,
      onClick: () => fadeToScene(this, 'LevelSelect'),
    });
  }
}
