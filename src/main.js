import Phaser from 'phaser';
import { GAME_CONFIG } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { LevelSelectScene } from './scenes/LevelSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
  },

  backgroundColor: '#1a1a2e',

  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    LevelSelectScene,
    GameScene,
    ResultScene,
    SettingsScene,
  ],
};

const game = new Phaser.Game(config);
