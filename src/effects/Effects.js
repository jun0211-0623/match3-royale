import { GAME_CONFIG } from '../config.js';
import { Gem } from '../objects/Gem.js';

export class Effects {
  constructor(scene) {
    this.scene = scene;
  }

  // ─── 블록 제거 — 네이티브 파티클 ───────────────

  gemDestroy(row, col, colorHex) {
    const { x, y } = Gem.getPixelPos(row, col);

    // 1차 버스트: 16개 컬러 circle 파티클
    const burst = this.scene.add.particles(x, y, 'particle_circle', {
      speed: { min: 80, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: colorHex,
      lifespan: 400,
      quantity: 16,
      emitting: false,
      gravityY: 150,
    });
    burst.explode();
    this.scene.time.delayedCall(500, () => burst.destroy());

    // 2차 스파클: 8개 white square 파티클
    const sparkle = this.scene.add.particles(x, y, 'particle_square', {
      speed: { min: 40, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: 0xffffff,
      lifespan: 300,
      quantity: 8,
      emitting: false,
      rotate: { min: 0, max: 360 },
    });
    sparkle.explode();
    this.scene.time.delayedCall(400, () => sparkle.destroy());

    // 플래시 서클
    const flash = this.scene.add.circle(x, y, 4, colorHex, 0.6).setDepth(5);
    this.scene.tweens.add({
      targets: flash,
      radius: 28,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });
  }

  // ─── 로켓 폭발 — 이중 빔 + 스파크 ─────────────

  rocketExplode(row, col, direction) {
    const { x, y } = Gem.getPixelPos(row, col);
    const { ROWS, COLS, CELL_SIZE } = GAME_CONFIG.BOARD;

    const createBeam = (isHorizontal) => {
      const len = (isHorizontal ? COLS : ROWS) * CELL_SIZE;

      // 코어 빔 (밝은 노랑, 좁은)
      const core = this.scene.add.rectangle(x, y, isHorizontal ? 0 : 6, isHorizontal ? 6 : 0, 0xfff176, 0.9)
        .setDepth(10);
      this.scene.tweens.add({
        targets: core,
        [isHorizontal ? 'width' : 'height']: len,
        alpha: 0,
        duration: 350,
        ease: 'Power2',
        onComplete: () => core.destroy(),
      });

      // 아우터 빔 (주황, 넓은)
      const outer = this.scene.add.rectangle(x, y, isHorizontal ? 0 : 18, isHorizontal ? 18 : 0, 0xf39c12, 0.4)
        .setDepth(9);
      this.scene.tweens.add({
        targets: outer,
        [isHorizontal ? 'width' : 'height']: len,
        alpha: 0,
        duration: 450,
        ease: 'Power2',
        onComplete: () => outer.destroy(),
      });

      // 스파크 파티클 양방향
      const angles = isHorizontal ? [{ min: -10, max: 10 }, { min: 170, max: 190 }]
        : [{ min: 260, max: 280 }, { min: 80, max: 100 }];

      angles.forEach((angle) => {
        const sparks = this.scene.add.particles(x, y, 'particle_spark', {
          speed: { min: 300, max: 500 },
          angle,
          scale: { start: 0.8, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: [0xfff176, 0xf39c12, 0xffffff],
          lifespan: 300,
          quantity: 10,
          emitting: false,
        });
        sparks.explode();
        this.scene.time.delayedCall(400, () => sparks.destroy());
      });
    };

    if (direction === 'h' || direction === 'both') createBeam(true);
    if (direction === 'v' || direction === 'both') createBeam(false);

    // 센터 플래시
    const centerFlash = this.scene.add.circle(x, y, 6, 0xffffff, 0.9).setDepth(11);
    this.scene.tweens.add({
      targets: centerFlash,
      radius: 20,
      alpha: 0,
      duration: 200,
      onComplete: () => centerFlash.destroy(),
    });
  }

  // ─── 폭탄 폭발 — 충격파 + 파편 ────────────────

  bombExplode(row, col, radius) {
    const { x, y } = Gem.getPixelPos(row, col);
    const size = radius * GAME_CONFIG.BOARD.CELL_SIZE;

    // 1차 충격파 링
    const ring1 = this.scene.add.circle(x, y, 10, 0x000000, 0).setDepth(10);
    ring1.setStrokeStyle(4, 0xff6b35, 0.9);
    this.scene.tweens.add({
      targets: ring1,
      radius: size,
      alpha: 0,
      duration: 350,
      ease: 'Power2',
      onComplete: () => ring1.destroy(),
    });

    // 2차 충격파 링 (딜레이)
    this.scene.time.delayedCall(80, () => {
      const ring2 = this.scene.add.circle(x, y, 10, 0x000000, 0).setDepth(10);
      ring2.setStrokeStyle(2, 0xffaa00, 0.6);
      this.scene.tweens.add({
        targets: ring2,
        radius: size * 1.3,
        alpha: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => ring2.destroy(),
      });
    });

    // 센터 플래시
    const flash = this.scene.add.circle(x, y, size * 0.2, 0xffffff, 0.9).setDepth(11);
    this.scene.tweens.add({
      targets: flash,
      radius: size * 0.5,
      alpha: 0,
      duration: 200,
      ease: 'Power1',
      onComplete: () => flash.destroy(),
    });

    // 파편 파티클
    const debris = this.scene.add.particles(x, y, 'particle_square', {
      speed: { min: 100, max: 280 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0.2 },
      alpha: { start: 1, end: 0 },
      tint: [0xff4444, 0xff8800, 0xffcc00, 0xffffff],
      lifespan: 500,
      quantity: 20,
      emitting: false,
      gravityY: 200,
      rotate: { min: 0, max: 360 },
    });
    debris.explode();
    this.scene.time.delayedCall(600, () => debris.destroy());

    this.scene.cameras.main.shake(300, 0.015);
  }

  // ─── 무지개 폭발 — 컬러 버스트 ─────────────────

  rainbowExplode(row, col, colorHex) {
    const { x, y } = Gem.getPixelPos(row, col);
    const rainbowColors = [0xe74c3c, 0xf39c12, 0xf1c40f, 0x2ecc71, 0x3498db, 0x9b59b6];

    // 6색 순차 확장 링
    rainbowColors.forEach((color, i) => {
      this.scene.time.delayedCall(i * 40, () => {
        const ring = this.scene.add.circle(x, y, 8, 0x000000, 0).setDepth(10);
        ring.setStrokeStyle(3, color, 0.8);
        this.scene.tweens.add({
          targets: ring,
          radius: 100 + i * 20,
          alpha: 0,
          duration: 500,
          ease: 'Power2',
          onComplete: () => ring.destroy(),
        });
      });
    });

    // 컬러 버스트 파티클
    const burst = this.scene.add.particles(x, y, 'particle_glow', {
      speed: { min: 60, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: rainbowColors,
      lifespan: 600,
      quantity: 24,
      emitting: false,
    });
    burst.explode();
    this.scene.time.delayedCall(700, () => burst.destroy());
  }

  // ─── 보드 클리어 플래시 ────────────────────────

  boardClearFlash() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const flash = this.scene.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0xffffff, 0.7)
      .setDepth(20);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });

    this.scene.cameras.main.shake(400, 0.015);
  }

  // ─── 콤보 텍스트 — 글로우 + 더 큰 텍스트 ──────

  comboText(text, x, y) {
    const txt = this.scene.add.text(x, y, text, {
      fontSize: '42px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(15).setScale(0.2);

    // preFX 글로우
    if (txt.preFX) {
      const glow = txt.preFX.addGlow(0xf1c40f, 4, 0, false, 0.1, 8);
      this.scene.time.delayedCall(1000, () => {
        if (txt.preFX) txt.preFX.remove(glow);
      });
    }

    this.scene.tweens.add({
      targets: txt,
      scaleX: 1.4, scaleY: 1.4,
      duration: 200,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 400,
      onComplete: () => {
        this.scene.tweens.add({
          targets: txt,
          y: y - 50, alpha: 0,
          scaleX: 0.8, scaleY: 0.8,
          duration: 400,
          onComplete: () => txt.destroy(),
        });
      },
    });
  }
}
