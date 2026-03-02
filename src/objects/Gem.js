import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';

const SHAPE_ICONS = ['●', '◆', '▲', '■', '★', '♥'];

export class Gem {
  constructor(scene, row, col, colorIndex) {
    this.scene = scene;
    this.row = row;
    this.col = col;
    this.colorIndex = colorIndex;
    this.color = colorIndex >= 0 ? GAME_CONFIG.COLORS[colorIndex] : null;
    this.isSpecial = false;
    this.specialType = null;
    this.isDestroying = false;
    this.rocketIndicators = null;

    const { GEM_SIZE, CELL_SIZE, OFFSET_X, OFFSET_Y } = GAME_CONFIG.BOARD;
    const x = OFFSET_X + col * CELL_SIZE + GEM_SIZE / 2;
    const y = OFFSET_Y + row * CELL_SIZE + GEM_SIZE / 2;

    // 베이스 — 사전 생성된 텍스처 사용
    const textureKey = colorIndex >= 0 ? `gem_${this.color}` : 'special_rainbow';
    this.sprite = scene.add.image(x, y, textureKey);

    // 접근성 아이콘 (은은하게)
    this.icon = scene.add.text(x, y, colorIndex >= 0 ? SHAPE_ICONS[colorIndex] : '', {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5).setAlpha(0.3);

    // 특수 블록 오버레이 (처음엔 숨김)
    this.specialOverlay = scene.add.text(x, y, '', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0).setDepth(1);

    // 발광 링 (특수블록용)
    this.glowRect = scene.add.rectangle(x, y, GEM_SIZE + 4, GEM_SIZE + 4, 0xffffff, 0)
      .setStrokeStyle(0).setDepth(-1);
  }

  static getPixelPos(row, col) {
    const { GEM_SIZE, CELL_SIZE, OFFSET_X, OFFSET_Y } = GAME_CONFIG.BOARD;
    return {
      x: OFFSET_X + col * CELL_SIZE + GEM_SIZE / 2,
      y: OFFSET_Y + row * CELL_SIZE + GEM_SIZE / 2,
    };
  }

  get allTargets() {
    const targets = [this.sprite, this.icon, this.specialOverlay, this.glowRect];
    if (this.rocketIndicators) {
      targets.push(...this.rocketIndicators);
    }
    return targets.filter(t => t && t.active);
  }

  // ─── 특수 블록 변환 ────────────────────────────

  makeSpecial(type) {
    this.isSpecial = true;
    this.specialType = type;

    if (type === 'rainbow') {
      this.colorIndex = -1;
      this.color = null;
      this.sprite.setTexture('special_rainbow');
      this.icon.setText('🌈').setAlpha(0.8).setFontSize(26);
      this.specialOverlay.setAlpha(0);
      this._startGlow(0xf1c40f);
      this._startRainbowPulse();
    } else if (type === 'rocket_h' || type === 'rocket_v') {
      const dir = type === 'rocket_h' ? 'h' : 'v';
      this.sprite.setTexture(`special_rocket_${dir}_${this.color}`);
      this.icon.setAlpha(0.2);
      this.specialOverlay.setAlpha(0);
      this._startGlow(0xffffff);
      this._startRocketAnim();
    } else if (type === 'bomb') {
      this.sprite.setTexture(`special_bomb_${this.color}`);
      this.icon.setAlpha(0.15);
      this.specialOverlay.setAlpha(0);
      this._startGlow(0xff4444);
      this._startBombPulse();
    }
  }

  _startGlow(color) {
    this.glowRect.setStrokeStyle(2.5, color, 0.6);
    this.glowRect.setFillStyle(color, 0);
    this.scene.tweens.add({
      targets: this.glowRect,
      alpha: { from: 0.5, to: 0.1 },
      scaleX: { from: 1, to: 1.1 },
      scaleY: { from: 1, to: 1.1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  _startRocketAnim() {
    const { x, y } = this.sprite;
    const isH = this.specialType === 'rocket_h';
    const GS = GAME_CONFIG.BOARD.GEM_SIZE;

    this.rocketIndicators = [];
    const chars = isH ? ['◄', '►'] : ['▲', '▼'];
    const positions = isH
      ? [{ dx: -GS / 2 + 2, dy: 0 }, { dx: GS / 2 - 2, dy: 0 }]
      : [{ dx: 0, dy: -GS / 2 + 2 }, { dx: 0, dy: GS / 2 - 2 }];

    positions.forEach(({ dx, dy }, i) => {
      const ind = this.scene.add.text(x + dx, y + dy, chars[i], {
        fontSize: '11px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(0.5).setAlpha(0.7).setDepth(2);

      const prop = isH ? 'x' : 'y';
      const base = isH ? x + dx : y + dy;
      this.scene.tweens.add({
        targets: ind,
        [prop]: base + (i === 0 ? -5 : 5),
        alpha: 0.2,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.rocketIndicators.push(ind);
    });
  }

  _startBombPulse() {
    this.scene.tweens.add({
      targets: [this.sprite, this.icon],
      scaleX: { from: 1, to: 1.05 },
      scaleY: { from: 1, to: 1.05 },
      duration: 500,
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
        if (this.glowRect && this.glowRect.active) {
          this.glowRect.setStrokeStyle(2.5, colors[ci % colors.length], 0.6);
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
      this.sprite.setTint(0xcccccc);
      this.scene.tweens.add({
        targets: this.allTargets,
        scaleX: 1.12, scaleY: 1.12,
        duration: 100, ease: 'Power1',
      });
    } else {
      this.sprite.clearTint();
      // 특수블록은 고유 스케일 유지
      const baseScale = 1;
      this.scene.tweens.add({
        targets: this.allTargets,
        scaleX: baseScale, scaleY: baseScale,
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
    [this.sprite, this.icon, this.specialOverlay, this.glowRect].forEach(obj => {
      if (obj && obj.active) obj.destroy();
    });
    if (this.rocketIndicators) {
      this.rocketIndicators.forEach(ind => { if (ind && ind.active) ind.destroy(); });
      this.rocketIndicators = null;
    }
  }
}
