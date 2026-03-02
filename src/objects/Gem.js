import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';

export class Gem {
  constructor(scene, row, col, colorIndex) {
    this.scene = scene;
    this.row = row;
    this.col = col;
    this.colorIndex = colorIndex;
    this.color = GAME_CONFIG.COLORS[colorIndex];
    this.isSpecial = false;
    this.specialType = null;
    this.isDestroying = false;

    const { GEM_SIZE, CELL_SIZE, OFFSET_X, OFFSET_Y } = GAME_CONFIG.BOARD;
    const x = OFFSET_X + col * CELL_SIZE + GEM_SIZE / 2;
    const y = OFFSET_Y + row * CELL_SIZE + GEM_SIZE / 2;
    const hex = GAME_CONFIG.COLOR_HEX[this.color];

    // 임시 색상 사각형 (Phase 3에서 스프라이트로 교체)
    this.sprite = scene.add.rectangle(x, y, GEM_SIZE - 6, GEM_SIZE - 6, hex, 1)
      .setStrokeStyle(2, 0xffffff, 0.2);

    // 색상 구분용 아이콘 텍스트 (접근성 — 색각 이상 대응)
    const icons = ['●', '◆', '▲', '■', '★', '♥'];
    this.icon = scene.add.text(x, y, icons[colorIndex], {
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0.6);
  }

  /** 격자 위치 기반 화면 좌표 계산 */
  static getPixelPos(row, col) {
    const { GEM_SIZE, CELL_SIZE, OFFSET_X, OFFSET_Y } = GAME_CONFIG.BOARD;
    return {
      x: OFFSET_X + col * CELL_SIZE + GEM_SIZE / 2,
      y: OFFSET_Y + row * CELL_SIZE + GEM_SIZE / 2,
    };
  }

  /** 격자 위치 업데이트 (논리 + 화면) */
  setGridPosition(row, col) {
    this.row = row;
    this.col = col;
  }

  /** 트윈으로 부드럽게 이동 */
  moveTo(row, col, duration, onComplete) {
    this.row = row;
    this.col = col;
    const { x, y } = Gem.getPixelPos(row, col);

    this.scene.tweens.add({
      targets: [this.sprite, this.icon],
      x, y,
      duration,
      ease: 'Power2',
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });
  }

  /** 선택 하이라이트 */
  setSelected(selected) {
    if (selected) {
      this.sprite.setStrokeStyle(3, 0xffffff, 1);
      this.scene.tweens.add({
        targets: [this.sprite, this.icon],
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        ease: 'Power1',
      });
    } else {
      this.sprite.setStrokeStyle(2, 0xffffff, 0.2);
      this.scene.tweens.add({
        targets: [this.sprite, this.icon],
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Power1',
      });
    }
  }

  /** 제거 애니메이션 */
  destroy(onComplete) {
    this.isDestroying = true;
    this.scene.tweens.add({
      targets: [this.sprite, this.icon],
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: GAME_CONFIG.ANIM.DESTROY_SPEED,
      ease: 'Power2',
      onComplete: () => {
        this.sprite.destroy();
        this.icon.destroy();
        if (onComplete) onComplete();
      },
    });
  }

  /** 즉시 제거 (애니메이션 없이) */
  destroyImmediate() {
    this.sprite.destroy();
    this.icon.destroy();
  }
}
