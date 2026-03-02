import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    // 화면 방향 잠금 시도 (지원하는 브라우저)
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait').catch(() => {});
      }
    } catch (e) { /* 지원 안 함 — 무시 */ }

    this.scene.start('Preload');
  }
}
