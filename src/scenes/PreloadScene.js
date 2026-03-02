import Phaser from 'phaser';
import { generateGemTextures, generateSpecialTextures, generateParticleTextures, generateBackgroundTexture } from '../utils/GemTextureGenerator.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
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
  }

  create() {
    // 텍스처 사전 생성
    generateGemTextures(this);
    generateSpecialTextures(this);
    generateParticleTextures(this);
    generateBackgroundTexture(this);

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Menu');
    });
  }
}
