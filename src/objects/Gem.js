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
    this._selectFx = null;
    this._selectTween = null;
    this._glowFx = null;

    // 장애물
    this.obstacle = null; // { type: 'ice'|'chain'|'wood', layers: number }
    this.obstacleOverlay = null;

    const { GEM_SIZE, CELL_SIZE, OFFSET_X, OFFSET_Y } = GAME_CONFIG.BOARD;
    const x = OFFSET_X + col * CELL_SIZE + GEM_SIZE / 2;
    const y = OFFSET_Y + row * CELL_SIZE + GEM_SIZE / 2;

    // 베이스 — 사전 생성된 텍스처 사용
    const textureKey = colorIndex >= 0 ? `gem_${this.color}`
                     : colorIndex === -2 ? 'obstacle_wood_full'
                     : 'special_rainbow';
    this.sprite = scene.add.image(x, y, textureKey);

    // 접근성 아이콘 (은은하게)
    this.icon = scene.add.text(x, y, colorIndex >= 0 ? SHAPE_ICONS[colorIndex] : '', {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5).setAlpha(0.25);

    // 특수 블록 오버레이 (처음엔 숨김)
    this.specialOverlay = scene.add.text(x, y, '', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0).setDepth(1);

    // 발광 링 (특수블록용 — preFX 폴백)
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
    if (this.obstacleOverlay) {
      targets.push(this.obstacleOverlay);
    }
    return targets.filter(t => t && t.active);
  }

  // ─── 장애물 ──────────────────────────────────────

  /** 나무상자 팩토리 (젬 없이 셀 점유) */
  static createWoodBox(scene, row, col, layers) {
    const gem = new Gem(scene, row, col, -2);
    gem.sprite.setTexture(layers >= 2 ? 'obstacle_wood_full' : 'obstacle_wood_damaged');
    gem.icon.setText('');
    gem.obstacle = { type: 'wood', layers };
    return gem;
  }

  /** 장애물 설정 (ice, chain) */
  setObstacle(type, layers) {
    this.obstacle = { type, layers };
    this._updateObstacleVisual();
  }

  /** 장애물 데미지 — false 반환 시 장애물 완전 파괴 */
  damageObstacle() {
    if (!this.obstacle) return false;
    this.obstacle.layers--;
    if (this.obstacle.layers <= 0) {
      const type = this.obstacle.type;
      this.obstacle = null;
      if (this.obstacleOverlay) {
        this.obstacleOverlay.destroy();
        this.obstacleOverlay = null;
      }
      // wood면 텍스처 갱신 불필요 (셀 자체 제거됨)
      return false; // 장애물 파괴됨
    }
    // 레이어 감소 → 비주얼 갱신
    if (this.obstacle.type === 'wood') {
      this.sprite.setTexture('obstacle_wood_damaged');
    } else {
      this._updateObstacleVisual();
    }
    return true; // 장애물 남아있음
  }

  _updateObstacleVisual() {
    if (!this.obstacle) return;
    const { type, layers } = this.obstacle;
    let textureKey;

    if (type === 'ice') {
      textureKey = layers >= 2 ? 'obstacle_ice_frozen' : 'obstacle_ice_cracked';
    } else if (type === 'chain') {
      textureKey = 'obstacle_chain';
    } else {
      return; // wood는 sprite 자체를 사용
    }

    const { x, y } = this.sprite;
    if (this.obstacleOverlay) {
      this.obstacleOverlay.setTexture(textureKey);
    } else {
      this.obstacleOverlay = this.scene.add.image(x, y, textureKey).setDepth(2);
    }
  }

  // ─── 특수 블록 변환 ────────────────────────────

  makeSpecial(type) {
    this.isSpecial = true;
    this.specialType = type;

    if (type === 'rainbow') {
      this.colorIndex = -1;
      this.color = null;
      this.sprite.setTexture('special_rainbow');
      this.icon.setText('🌈').setAlpha(0.7).setFontSize(24);
      this.specialOverlay.setAlpha(0);
      this._startGlow(0xf1c40f);
      this._startRainbowPulse();
    } else if (type === 'rocket_h' || type === 'rocket_v') {
      const dir = type === 'rocket_h' ? 'h' : 'v';
      this.sprite.setTexture(`special_rocket_${dir}_${this.color}`);
      this.icon.setAlpha(0.15);
      this.specialOverlay.setAlpha(0);
      this._startGlow(0xffffff);
      this._startRocketAnim();
    } else if (type === 'bomb') {
      this.sprite.setTexture(`special_bomb_${this.color}`);
      this.icon.setAlpha(0.1);
      this.specialOverlay.setAlpha(0);
      this._startGlow(0xff4444);
      this._startBombPulse();
    }
  }

  _startGlow(color) {
    // preFX 기반 글로우 (WebGL)
    if (this.sprite.preFX) {
      this._glowFx = this.sprite.preFX.addGlow(color, 4, 0, false, 0.1, 10);
      this.scene.tweens.add({
        targets: this._glowFx,
        outerStrength: { from: 2, to: 6 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      // Canvas 폴백
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
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(0.5).setAlpha(0.8).setDepth(2);

      const prop = isH ? 'x' : 'y';
      const base = isH ? x + dx : y + dy;
      this.scene.tweens.add({
        targets: ind,
        [prop]: base + (i === 0 ? -6 : 6),
        alpha: 0.15,
        duration: 450,
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
      scaleX: { from: 1, to: 1.06 },
      scaleY: { from: 1, to: 1.06 },
      duration: 450,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  _startRainbowPulse() {
    const colors = [0xe74c3c, 0xf1c40f, 0x2ecc71, 0x3498db, 0x9b59b6];
    let ci = 0;
    this.scene.time.addEvent({
      delay: 250,
      loop: true,
      callback: () => {
        if (this._glowFx) {
          this._glowFx.color = colors[ci % colors.length];
          ci++;
        } else if (this.glowRect && this.glowRect.active) {
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
      onComplete: () => {
        // 착지 바운스
        this.scene.tweens.add({
          targets: this.allTargets,
          scaleY: { from: 0.92, to: 1.0 },
          scaleX: { from: 1.06, to: 1.0 },
          duration: GAME_CONFIG.ANIM.LAND_BOUNCE,
          ease: 'Bounce.easeOut',
        });
        if (onComplete) onComplete();
      },
    });
  }

  setSelected(selected) {
    if (selected) {
      // preFX 글로우 (WebGL)
      if (this.sprite.preFX && !this._selectFx) {
        this._selectFx = this.sprite.preFX.addGlow(0xffffff, 3, 0, false, 0.1, 8);
      }
      // 펄스 애니메이션
      this._selectTween = this.scene.tweens.add({
        targets: this.allTargets,
        scaleX: { from: 1.0, to: 1.08 },
        scaleY: { from: 1.0, to: 1.08 },
        duration: GAME_CONFIG.ANIM.SELECT_PULSE,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      // 글로우 FX 제거
      if (this._selectFx && this.sprite.preFX) {
        this.sprite.preFX.remove(this._selectFx);
        this._selectFx = null;
      }
      // 펄스 중지
      if (this._selectTween) {
        this._selectTween.stop();
        this._selectTween = null;
      }
      this.sprite.clearTint();
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
    // 흰색 틴트 플래시
    if (this.sprite.active) this.sprite.setTint(0xffffff);

    this.scene.tweens.add({
      targets: this.allTargets,
      scaleX: 0, scaleY: 0, alpha: 0,
      angle: Phaser.Math.Between(-15, 15),
      duration: GAME_CONFIG.ANIM.DESTROY_SPEED,
      ease: 'Back.easeIn',
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
    // preFX 정리
    if (this._selectFx && this.sprite && this.sprite.preFX) {
      this.sprite.preFX.remove(this._selectFx);
      this._selectFx = null;
    }
    if (this._glowFx && this.sprite && this.sprite.preFX) {
      this.sprite.preFX.remove(this._glowFx);
      this._glowFx = null;
    }
    if (this._selectTween) {
      this._selectTween.stop();
      this._selectTween = null;
    }
    [this.sprite, this.icon, this.specialOverlay, this.glowRect].forEach(obj => {
      if (obj && obj.active) obj.destroy();
    });
    if (this.rocketIndicators) {
      this.rocketIndicators.forEach(ind => { if (ind && ind.active) ind.destroy(); });
      this.rocketIndicators = null;
    }
    if (this.obstacleOverlay && this.obstacleOverlay.active) {
      this.obstacleOverlay.destroy();
      this.obstacleOverlay = null;
    }
  }
}
