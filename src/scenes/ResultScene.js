import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { LevelManager } from '../managers/LevelManager.js';
import { SaveManager } from '../managers/SaveManager.js';
import { audioManager } from '../managers/AudioManager.js';

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

    // 결과 패널
    const panelH = this.cleared ? 450 : 380;
    this.add.rectangle(cx, cy, 440, panelH, 0x1a1a2e, 0.95)
      .setStrokeStyle(3, this.cleared ? 0xf1c40f : 0xe74c3c);

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

      // 점수
      this.add.text(cx, cy - panelH / 2 + 155, `점수: ${this.score}`, {
        fontSize: '26px',
        color: '#ffffff',
      }).setOrigin(0.5);

      // 코인 획득
      this.add.text(cx, cy - panelH / 2 + 190, `+${this.coins} 💰`, {
        fontSize: '24px',
        color: '#f1c40f',
      }).setOrigin(0.5);

      // 다음 레벨 버튼
      if (LevelManager.hasLevel(this.level + 1)) {
        const nextBtn = this.add.rectangle(cx, cy + 20, 280, 60, 0x2ecc71)
          .setInteractive({ useHandCursor: true });
        this.add.text(cx, cy + 20, '다음 레벨', {
          fontSize: '28px', fontStyle: 'bold', color: '#ffffff',
        }).setOrigin(0.5);
        nextBtn.on('pointerup', () => {
          this.scene.start('Game', { level: this.level + 1 });
        });
      }

      // 재시도
      const retryBtn = this.add.rectangle(cx, cy + 95, 280, 55, 0x3498db)
        .setInteractive({ useHandCursor: true });
      this.add.text(cx, cy + 95, '재시도', {
        fontSize: '24px', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5);
      retryBtn.on('pointerup', () => {
        this.scene.start('Game', { level: this.level });
      });

    } else {
      // 실패 화면
      this.add.text(cx, cy - panelH / 2 + 100, `점수: ${this.score}`, {
        fontSize: '26px',
        color: '#ffffff',
      }).setOrigin(0.5);

      // 추가 이동 구매 버튼
      const extraCost = GAME_CONFIG.ECONOMY.BOOSTER_EXTRA_MOVES;
      const canBuy = SaveManager.getCoins() >= extraCost;

      const extraBtn = this.add.rectangle(cx, cy - 20, 280, 55, canBuy ? 0xe67e22 : 0x555555)
        .setInteractive({ useHandCursor: canBuy });
      this.add.text(cx, cy - 20, `+5 이동 (${extraCost}💰)`, {
        fontSize: '22px', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5);

      if (canBuy) {
        extraBtn.on('pointerup', () => {
          if (SaveManager.spendCoins(extraCost)) {
            // 같은 레벨로 돌아가되, 추가 이동 적용은 GameScene에서 처리
            this.scene.start('Game', { level: this.level });
          }
        });
      }

      // 재시도
      const retryBtn = this.add.rectangle(cx, cy + 50, 280, 55, 0x3498db)
        .setInteractive({ useHandCursor: true });
      this.add.text(cx, cy + 50, '재시도', {
        fontSize: '24px', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5);
      retryBtn.on('pointerup', () => {
        this.scene.start('Game', { level: this.level });
      });
    }

    // 레벨 선택 (공통)
    const selectBtn = this.add.rectangle(cx, cy + panelH / 2 - 45, 280, 55, 0x7f8c8d)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, cy + panelH / 2 - 45, '레벨 선택', {
      fontSize: '24px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);
    selectBtn.on('pointerup', () => {
      this.scene.start('LevelSelect');
    });
  }
}
