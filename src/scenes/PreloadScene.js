import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    // 로딩 바 표시
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const barBg = this.add.rectangle(width / 2, height / 2, 400, 30, 0x333333);
    const bar = this.add.rectangle(width / 2 - 198, height / 2, 0, 26, 0x3498db);
    bar.setOrigin(0, 0.5);

    const loadText = this.add.text(width / 2, height / 2 - 40, '로딩 중...', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      bar.width = 396 * value;
    });

    this.load.on('complete', () => {
      loadText.destroy();
      barBg.destroy();
      bar.destroy();
    });

    // 향후 에셋 로드는 여기에 추가
    // this.load.image('gem_red', 'assets/images/gems/red.png');
    // this.load.audio('match', ['assets/audio/match.mp3', 'assets/audio/match.ogg']);
  }

  create() {
    this.scene.start('Menu');
  }
}
