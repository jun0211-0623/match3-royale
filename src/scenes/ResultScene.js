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
    this.isDaily = !!data.isDaily;
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

    // 어두운 오버레이 (blur 효과 대체)
    this.add.rectangle(cx, cy, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT, 0x000000, 0.75);

    // 클리어 시 컨페티
    if (this.cleared) {
      const confetti = this.add.particles(cx, -20, 'particle_square', {
        x: { min: -cx, max: cx },
        speed: { min: 80, max: 200 },
        angle: { min: 75, max: 105 },
        scale: { start: 0.8, end: 0.3 },
        alpha: { start: 1, end: 0.5 },
        tint: [0xFF1744, 0xFFC400, 0x00E676, 0x2979FF, 0xD500F9, 0xFFD54F],
        lifespan: { min: 2000, max: 4000 },
        frequency: 50,
        quantity: 2,
        rotate: { min: 0, max: 360 },
        gravityY: 80,
      }).setDepth(10);

      this.time.delayedCall(3000, () => confetti.stop());
      this.time.delayedCall(7000, () => confetti.destroy());
    }

    // ─── 결과 카드 (JSX gradient card) ──────────

    const panelH = this.cleared ? 420 : 350;
    const panelW = 340;
    const panelTop = cy - panelH / 2;

    const panel = this.add.graphics().setDepth(1);
    // Gradient: #1E1452 → #2D1B69
    panel.fillStyle(0x1E1452, 1);
    panel.fillRoundedRect(cx - panelW / 2, panelTop, panelW, panelH, 28);
    // Bottom half darker
    panel.fillStyle(0x2D1B69, 0.6);
    panel.fillRoundedRect(cx - panelW / 2, cy, panelW, panelH / 2, { tl: 0, tr: 0, bl: 28, br: 28 });
    // Border
    panel.lineStyle(1, this.cleared ? 0xFFD54F : 0xFF5252, 0.2);
    panel.strokeRoundedRect(cx - panelW / 2, panelTop, panelW, panelH, 28);

    if (this.cleared) {
      // 트로피
      const trophy = this.add.text(cx, panelTop + 45, '🏆', {
        fontSize: '56px',
      }).setOrigin(0.5).setDepth(2).setAlpha(0).setScale(0);

      this.tweens.add({
        targets: trophy,
        alpha: 1, scaleX: 1, scaleY: 1,
        duration: 400, ease: 'Back.easeOut',
      });

      // 별
      const starY = panelTop + 105;
      for (let i = 0; i < 3; i++) {
        const star = this.add.text(cx - 50 + i * 50, starY, '⭐', {
          fontSize: '32px',
        }).setOrigin(0.5).setDepth(2).setScale(0).setAlpha(0);

        if (i >= this.stars) {
          star.setAlpha(0.3);
          star.setStyle({ fontSize: '32px' });
        }

        this.tweens.add({
          targets: star,
          scaleX: 1, scaleY: 1,
          alpha: i < this.stars ? 1 : 0.3,
          duration: 300,
          delay: 300 + i * 200,
          ease: 'Back.easeOut',
          onComplete: () => {
            if (i < this.stars) {
              const sparkle = this.add.particles(star.x, star.y, 'particle_circle', {
                speed: { min: 30, max: 80 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.4, end: 0 },
                tint: 0xFFD54F,
                lifespan: 400,
                quantity: 6,
                emitting: false,
              }).setDepth(3);
              sparkle.explode();
              this.time.delayedCall(500, () => sparkle.destroy());
            }
          },
        });
      }

      // 타이틀
      const titleText = this.isDaily ? '도전 성공!' : '스테이지 클리어!';
      this.add.text(cx, panelTop + 148, titleText, {
        fontSize: '28px', fontStyle: 'bold', color: '#FFD54F',
      }).setOrigin(0.5).setDepth(2);

      // 점수
      this.add.text(cx, panelTop + 180, `점수: ${this.score}`, {
        fontSize: '14px', color: 'rgba(255,255,255,0.5)',
      }).setOrigin(0.5).setDepth(2);

      // 코인 보상 pill
      const coinPillY = panelTop + 215;
      const coinPillG = this.add.graphics().setDepth(2);
      coinPillG.fillStyle(0xFFD54F, 0.1);
      coinPillG.fillRoundedRect(cx - 80, coinPillY - 18, 160, 36, 14);
      coinPillG.lineStyle(1, 0xFFD54F, 0.2);
      coinPillG.strokeRoundedRect(cx - 80, coinPillY - 18, 160, 36, 14);

      this.add.text(cx - 30, coinPillY, '🪙', { fontSize: '24px' }).setOrigin(0.5).setDepth(2);
      this.add.text(cx + 15, coinPillY, `+${this.coins}`, {
        fontSize: '24px', fontStyle: 'bold', color: '#FFD54F',
      }).setOrigin(0, 0.5).setDepth(2);

      if (this.isDaily) {
        // 스트릭 표시
        const dailyData = SaveManager.getDailyData();
        this.add.text(cx, panelTop + 260, `🔥 연속 ${dailyData.streak}일`, {
          fontSize: '20px', fontStyle: 'bold', color: '#FF8F00',
        }).setOrigin(0.5).setDepth(2);

        // 확인 버튼
        new UIButton(this, cx, panelTop + panelH - 60, 260, 50, {
          text: '확인', fontSize: '18px', bgColor: 0x43A047, depth: 2, radius: 14,
          onClick: () => fadeToScene(this, 'DailyChallenge'),
        });
      } else {
        // 버튼 영역
        const btnY = panelTop + 275;

        // 다음 레벨
        if (LevelManager.hasLevel(this.level + 1)) {
          new UIButton(this, cx, btnY, 260, 50, {
            text: '다음 스테이지 ▶', fontSize: '18px', bgColor: 0x43A047, depth: 2, radius: 14,
            shadowOffset: 4, glow: true, glowColor: 0x43A047,
            onClick: () => fadeToScene(this, 'Game', { level: this.level + 1 }),
          });
        }

        // 홈으로 (glass style)
        const homeBtnY = btnY + 65;
        const homeBg = this.add.graphics().setDepth(2);
        homeBg.fillStyle(0xffffff, 0.1);
        homeBg.fillRoundedRect(cx - 130, homeBtnY - 22, 260, 44, 14);
        homeBg.lineStyle(1, 0xffffff, 0.15);
        homeBg.strokeRoundedRect(cx - 130, homeBtnY - 22, 260, 44, 14);

        this.add.text(cx, homeBtnY, '레벨 선택', {
          fontSize: '16px', fontStyle: 'bold', color: 'rgba(255,255,255,0.7)',
        }).setOrigin(0.5).setDepth(2)
          .setInteractive({ useHandCursor: true })
          .on('pointerup', () => fadeToScene(this, 'LevelSelect'));
      }

    } else {
      // ─── 실패 ──────────────────────────────

      this.add.text(cx, panelTop + 50, '😢', { fontSize: '48px' }).setOrigin(0.5).setDepth(2);

      this.add.text(cx, panelTop + 105, '실패...', {
        fontSize: '28px', fontStyle: 'bold', color: '#FF5252',
      }).setOrigin(0.5).setDepth(2);

      this.add.text(cx, panelTop + 140, `점수: ${this.score}`, {
        fontSize: '14px', color: 'rgba(255,255,255,0.5)',
      }).setOrigin(0.5).setDepth(2);

      if (this.isDaily) {
        this.add.text(cx, panelTop + 175, '내일 다시 도전하세요!', {
          fontSize: '16px', color: 'rgba(255,255,255,0.4)',
        }).setOrigin(0.5).setDepth(2);

        new UIButton(this, cx, panelTop + 230, 260, 50, {
          text: '확인', fontSize: '18px', bgColor: 0x424242, depth: 2, radius: 14,
          onClick: () => fadeToScene(this, 'DailyChallenge'),
        });
      } else {
        // 추가 이동 구매
        const extraCost = GAME_CONFIG.ECONOMY.BOOSTER_EXTRA_MOVES;
        const canBuy = SaveManager.getCoins() >= extraCost;

        new UIButton(this, cx, panelTop + 185, 260, 50, {
          text: `+5 이동 (${extraCost}🪙)`,
          fontSize: '16px',
          bgColor: canBuy ? 0xFB8C00 : 0x424242,
          depth: 2, radius: 14,
          onClick: () => {
            if (canBuy && SaveManager.spendCoins(extraCost)) {
              fadeToScene(this, 'Game', { level: this.level });
            }
          },
        });

        new UIButton(this, cx, panelTop + 248, 260, 50, {
          text: '재시도', fontSize: '18px', bgColor: 0x2979FF, depth: 2, radius: 14,
          onClick: () => fadeToScene(this, 'Game', { level: this.level }),
        });
      }

      // 하단 버튼
      const bottomBtnY = panelTop + panelH - 45;
      const bottomBg = this.add.graphics().setDepth(2);
      bottomBg.fillStyle(0xffffff, 0.1);
      bottomBg.fillRoundedRect(cx - 130, bottomBtnY - 22, 260, 44, 14);
      bottomBg.lineStyle(1, 0xffffff, 0.15);
      bottomBg.strokeRoundedRect(cx - 130, bottomBtnY - 22, 260, 44, 14);

      this.add.text(cx, bottomBtnY, this.isDaily ? '메인 메뉴' : '레벨 선택', {
        fontSize: '16px', fontStyle: 'bold', color: 'rgba(255,255,255,0.7)',
      }).setOrigin(0.5).setDepth(2)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => fadeToScene(this, this.isDaily ? 'Menu' : 'LevelSelect'));
    }
  }
}
