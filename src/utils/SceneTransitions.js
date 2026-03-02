import { GAME_CONFIG } from '../config.js';

const FADE_DURATION = GAME_CONFIG.ANIM.SCENE_FADE;

export function fadeToScene(currentScene, targetScene, data = {}) {
  currentScene.cameras.main.fadeOut(FADE_DURATION, 0, 0, 0);
  currentScene.cameras.main.once('camerafadeoutcomplete', () => {
    currentScene.scene.start(targetScene, data);
  });
}

export function fadeIn(scene) {
  scene.cameras.main.fadeIn(FADE_DURATION, 0, 0, 0);
}
