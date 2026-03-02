import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  init(data) {
    this.level = data.level || 1;
    this.cleared = data.cleared || false;
    this.stars = data.stars || 0;
    this.score = data.score || 0;
  }

  create() {
    const cx = GAME_CONFIG.WIDTH / 2;
    const cy = GAME_CONFIG.HEIGHT / 2;

    // 결과 텍스트
    const title = this.cleared ? '레벨 클리어!' : '실패...';
    const titleColor = this.cleared ? '#f1c40f' : '#e74c3c';

    this.add.text(cx, cy - 200, title, {
      fontSize: '52px',
      fontStyle: 'bold',
      color: titleColor,
    }).setOrigin(0.5);

    // 별 표시
    if (this.cleared) {
      const starText = '★'.repeat(this.stars) + '☆'.repeat(3 - this.stars);
      this.add.text(cx, cy - 120, starText, {
        fontSize: '48px',
        color: '#f1c40f',
      }).setOrigin(0.5);

      this.add.text(cx, cy - 60, `점수: ${this.score}`, {
        fontSize: '28px',
        color: '#ffffff',
      }).setOrigin(0.5);
    }

    // 버튼들
    if (this.cleared) {
      // 다음 레벨
      const nextBtn = this.add.rectangle(cx, cy + 40, 240, 60, 0x2ecc71)
        .setInteractive({ useHandCursor: true });
      this.add.text(cx, cy + 40, '다음 레벨', {
        fontSize: '28px', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5);
      nextBtn.on('pointerup', () => {
        this.scene.start('Game', { level: this.level + 1 });
      });
    }

    // 재시도
    const retryBtn = this.add.rectangle(cx, cy + 120, 240, 60, 0x3498db)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, cy + 120, '재시도', {
      fontSize: '28px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);
    retryBtn.on('pointerup', () => {
      this.scene.start('Game', { level: this.level });
    });

    // 레벨 선택
    const selectBtn = this.add.rectangle(cx, cy + 200, 240, 60, 0x7f8c8d)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, cy + 200, '레벨 선택', {
      fontSize: '28px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);
    selectBtn.on('pointerup', () => {
      this.scene.start('LevelSelect');
    });
  }
}
