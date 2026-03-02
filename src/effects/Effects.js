import { GAME_CONFIG } from '../config.js';
import { Gem } from '../objects/Gem.js';

/**
 * 시각 이펙트 모음 (파티클 대신 Graphics + Tween 기반)
 * Phaser 3.60+에서 파티클 API가 변경되었으므로 간단한 도형 기반으로 구현
 */
export class Effects {
  constructor(scene) {
    this.scene = scene;
  }

  /** 블록 제거 시 파편 이펙트 */
  gemDestroy(row, col, colorHex) {
    const { x, y } = Gem.getPixelPos(row, col);
    const count = 6;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const particle = this.scene.add.rectangle(
        x, y,
        8 + Math.random() * 6,
        8 + Math.random() * 6,
        colorHex, 1
      ).setDepth(5);

      const dist = 40 + Math.random() * 30;
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        scaleX: 0, scaleY: 0,
        alpha: 0,
        angle: Math.random() * 360,
        duration: 300 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  /** 로켓 폭발: 가로 또는 세로 라인 */
  rocketExplode(row, col, direction) {
    const { x, y } = Gem.getPixelPos(row, col);
    const { ROWS, COLS, CELL_SIZE } = GAME_CONFIG.BOARD;

    if (direction === 'h' || direction === 'both') {
      // 가로 빔
      const beamWidth = COLS * CELL_SIZE;
      const beam = this.scene.add.rectangle(x, y, 0, 12, 0xf39c12, 0.8).setDepth(10);
      this.scene.tweens.add({
        targets: beam,
        width: beamWidth,
        alpha: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => beam.destroy(),
      });
    }

    if (direction === 'v' || direction === 'both') {
      // 세로 빔
      const beamHeight = ROWS * CELL_SIZE;
      const beam = this.scene.add.rectangle(x, y, 12, 0, 0xf39c12, 0.8).setDepth(10);
      this.scene.tweens.add({
        targets: beam,
        height: beamHeight,
        alpha: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => beam.destroy(),
      });
    }
  }

  /** 폭탄 폭발: 원형 확산 */
  bombExplode(row, col, radius) {
    const { x, y } = Gem.getPixelPos(row, col);
    const size = radius * GAME_CONFIG.BOARD.CELL_SIZE;

    // 충격파 원
    const ring = this.scene.add.circle(x, y, 0, 0xe74c3c, 0.6).setDepth(10);
    this.scene.tweens.add({
      targets: ring,
      radius: size,
      alpha: 0,
      duration: 350,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
    });

    // 내부 플래시
    const flash = this.scene.add.circle(x, y, size * 0.3, 0xffffff, 0.8).setDepth(11);
    this.scene.tweens.add({
      targets: flash,
      radius: size * 0.6,
      alpha: 0,
      duration: 250,
      ease: 'Power1',
      onComplete: () => flash.destroy(),
    });

    // 카메라 셰이크
    this.scene.cameras.main.shake(250, 0.01);
  }

  /** 무지개 폭발: 화면 전체 플래시 */
  rainbowExplode(row, col, colorHex) {
    const { x, y } = Gem.getPixelPos(row, col);
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // 중심에서 확산하는 링
    const ring = this.scene.add.circle(x, y, 0, colorHex || 0xffffff, 0.5).setDepth(10);
    this.scene.tweens.add({
      targets: ring,
      radius: Math.max(WIDTH, HEIGHT),
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
    });
  }

  /** 무지개+무지개: 보드 전체 삭제 이펙트 */
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

  /** 콤보 텍스트 이펙트 (화면 중앙) */
  comboText(text, x, y) {
    const txt = this.scene.add.text(x, y, text, {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(15).setScale(0.3);

    this.scene.tweens.add({
      targets: txt,
      scaleX: 1.3, scaleY: 1.3,
      duration: 200,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 300,
      onComplete: () => {
        this.scene.tweens.add({
          targets: txt,
          y: y - 40, alpha: 0,
          duration: 400,
          onComplete: () => txt.destroy(),
        });
      },
    });
  }
}
