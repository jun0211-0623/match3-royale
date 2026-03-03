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

    // 게임 폰트 로딩 대기 후 시작
    const startGame = () => {
      if (this._started) return;
      this._started = true;
      this.scene.start('Preload');
    };

    document.fonts.load('16px "Jua"').then(startGame).catch(startGame);
    setTimeout(startGame, 3000); // 3초 타임아웃 (CDN 느릴 때 폴백)
  }
}
