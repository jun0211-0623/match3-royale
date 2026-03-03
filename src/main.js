import Phaser from 'phaser';
import { GAME_CONFIG } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { LevelSelectScene } from './scenes/LevelSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { DailyChallengeScene } from './scenes/DailyChallengeScene.js';

const config = {
  type: Phaser.WEBGL,
  parent: 'game-container',

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
  },

  backgroundColor: '#0A0E27',

  // 입력 설정
  input: {
    activePointers: 1,  // 싱글 터치만 (멀티터치 방지)
  },

  // DOM 오버레이 (UI를 실제 HTML/CSS로 렌더링)
  dom: {
    createContainer: true,
  },

  // 렌더링 성능
  render: {
    antialias: false,       // 모바일 성능
    pixelArt: false,
    roundPixels: true,      // 서브픽셀 방지
  },

  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    LevelSelectScene,
    GameScene,
    ResultScene,
    SettingsScene,
    DailyChallengeScene,
  ],
};

// ─── 글로벌 게임 폰트 적용 ─────────────────────
const GAME_FONT = "'Segoe UI', system-ui, sans-serif";
const _origTextFactory = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, text, style) {
  const s = style || {};
  if (!s.fontFamily) s.fontFamily = GAME_FONT;
  return _origTextFactory.call(this, x, y, text, s);
};

const game = new Phaser.Game(config);

// ─── 모바일 풀스크린 지원 ─────────────────────
// 첫 터치 시 풀스크린 진입 시도 (iOS에서는 작동하지 않음)
let fullscreenRequested = false;
document.addEventListener('pointerup', () => {
  if (fullscreenRequested) return;
  fullscreenRequested = true;

  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen().catch(() => {});
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  }
}, { once: true });

// ─── 컨텍스트 메뉴 방지 (모바일 길게 누르기) ──
document.addEventListener('contextmenu', (e) => e.preventDefault());

// ─── 더블탭 줌 방지 ──────────────────────────
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });

// ─── 키보드 줌 방지 (Ctrl +/-) ─────────────
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=')) {
    e.preventDefault();
  }
});
