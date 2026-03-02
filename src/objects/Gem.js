import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';

const SHAPE_ICONS = ['●', '◆', '▲', '■', '★', '♥'];
const SPECIAL_ICONS = {
  rocket_h: '⟷',
  rocket_v: '⟷',   // 세로로 회전해서 표시
  bomb: '💣',
  rainbow: '🌈',
};

export class Gem {
  constructor(scene, row, col, colorIndex) {
    this.scene = scene;
    this.row = row;
    this.col = col;
    this.colorIndex = colorIndex;
    this.color = colorIndex >= 0 ? GAME_CONFIG.COLORS[colorIndex] : null;
    this.isSpecial = false;
    this.specialType = null;   // 'rocket_h' | 'rocket_v' | 'bomb' | 'rainbow'
    this.isDestroying = false;

    const { GEM_SIZE, CELL_SIZE, OFFSET_X, OFFSET_Y } = GAME_CONFIG.BOARD;
    const x = OFFSET_X + col * CELL_SIZE + GEM_SIZE / 2;
    const y = OFFSET_Y + row * CELL_SIZE + GEM_SIZE / 2;
    const hex = colorIndex >= 0 ? GAME_CONFIG.COLOR_HEX[this.color] : 0xffffff;

    // 베이스 사각형
    this.sprite = scene.add.rectangle(x, y, GEM_SIZE - 6, GEM_SIZE - 6, hex, 1)
      .setStrokeStyle(2, 0xffffff, 0.2);

    // 접근성 아이콘
    this.icon = scene.add.text(x, y, colorIndex >= 0 ? SHAPE_ICONS[colorIndex] : '', {
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0.6);

    // 특수 블록 오버레이 (처음엔 숨김)
    this.specialOverlay = scene.add.text(x, y, '', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0).setDepth(1);

    // 특수 블록 발광 효과
    this.glowRect = scene.add.rectangle(x, y, GEM_SIZE - 2, GEM_SIZE - 2, 0xffffff, 0)
      .setStrokeStyle(0).setDepth(0);
  }

  /** 격자 위치 → 화면 좌표 */
  static getPixelPos(row, col) {
    const { GEM_SIZE, CELL_SIZE, OFFSET_X, OFFSET_Y } = GAME_CONFIG.BOARD;
    return {
      x: OFFSET_X + col * CELL_SIZE + GEM_SIZE / 2,
      y: OFFSET_Y + row * CELL_SIZE + GEM_SIZE / 2,
    };
  }

  /** 모든 비주얼 요소 목록 (트윈 대상) */
  get allTargets() {
    return [this.sprite, this.icon, this.specialOverlay, this.glowRect];
  }

  // ─── 특수 블록 변환 ────────────────────────────

  /** 일반 → 특수 블록으로 변환 */
  makeSpecial(type) {
    this.isSpecial = true;
    this.specialType = type;

    if (type === 'rainbow') {
      // 무지개: 색상 없음, 무지개 색 반복 애니메이션
      this.colorIndex = -1;
      this.color = null;
      this.sprite.setFillStyle(0xffffff, 0.9);
      this.sprite.setStrokeStyle(3, 0xf1c40f, 1);
      this.icon.setText('🌈');
      this.icon.setAlpha(1).setFontSize(30);
      this.specialOverlay.setAlpha(0);
      this._startRainbowPulse();
    } else {
      // 로켓/폭탄: 색상 유지 + 오버레이
      this.sprite.setStrokeStyle(3, 0xffffff, 0.9);

      if (type === 'rocket_h') {
        this.specialOverlay.setText('↔').setAlpha(1).setFontSize(26);
      } else if (type === 'rocket_v') {
        this.specialOverlay.setText('↕').setAlpha(1).setFontSize(26);
      } else if (type === 'bomb') {
        this.specialOverlay.setText('✦').setAlpha(1).setFontSize(24);
        this.sprite.setStrokeStyle(3, 0xe74c3c, 1);
      }

      this._startSpecialPulse();
    }
  }

  _startSpecialPulse() {
    this.glowRect.setStrokeStyle(2, 0xffffff, 0.5);
    this.scene.tweens.add({
      targets: this.glowRect,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  _startRainbowPulse() {
    const colors = [0xe74c3c, 0xf1c40f, 0x2ecc71, 0x3498db, 0x9b59b6];
    let ci = 0;
    this.scene.time.addEvent({
      delay: 300,
      loop: true,
      callback: () => {
        if (this.sprite && this.sprite.active) {
          this.sprite.setStrokeStyle(3, colors[ci % colors.length], 1);
          ci++;
        }
      },
    });
  }

  // ─── 이동 & 선택 ──────────────────────────────

  moveTo(row, col, duration, onComplete) {
    this.row = row;
    this.col = col;
    const { x, y } = Gem.getPixelPos(row, col);

    this.scene.tweens.add({
      targets: this.allTargets,
      x, y,
      duration,
      ease: 'Power2',
      onComplete: () => { if (onComplete) onComplete(); },
    });
  }

  setSelected(selected) {
    if (selected) {
      this.sprite.setStrokeStyle(3, 0xffffff, 1);
      this.scene.tweens.add({
        targets: this.allTargets,
        scaleX: 1.1, scaleY: 1.1,
        duration: 100, ease: 'Power1',
      });
    } else {
      const strokeColor = this.isSpecial && this.specialType === 'bomb' ? 0xe74c3c
        : this.isSpecial ? 0xffffff : 0xffffff;
      const strokeAlpha = this.isSpecial ? 0.9 : 0.2;
      this.sprite.setStrokeStyle(this.isSpecial ? 3 : 2, strokeColor, strokeAlpha);
      this.scene.tweens.add({
        targets: this.allTargets,
        scaleX: 1, scaleY: 1,
        duration: 100, ease: 'Power1',
      });
    }
  }

  // ─── 제거 ──────────────────────────────────────

  destroy(onComplete) {
    this.isDestroying = true;
    this.scene.tweens.add({
      targets: this.allTargets,
      scaleX: 0, scaleY: 0, alpha: 0,
      duration: GAME_CONFIG.ANIM.DESTROY_SPEED,
      ease: 'Power2',
      onComplete: () => {
        this._cleanup();
        if (onComplete) onComplete();
      },
    });
  }

  destroyImmediate() {
    this._cleanup();
  }

  _cleanup() {
    if (this.sprite && this.sprite.active) this.sprite.destroy();
    if (this.icon && this.icon.active) this.icon.destroy();
    if (this.specialOverlay && this.specialOverlay.active) this.specialOverlay.destroy();
    if (this.glowRect && this.glowRect.active) this.glowRect.destroy();
  }
}
