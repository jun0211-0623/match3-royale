import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { SaveManager } from '../managers/SaveManager.js';
import { audioManager } from '../managers/AudioManager.js';
import { UIButton } from '../ui/UIButton.js';
import { fadeToScene, fadeIn } from '../utils/SceneTransitions.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    fadeIn(this);
    const cx = GAME_CONFIG.WIDTH / 2;
    const cy = GAME_CONFIG.HEIGHT / 2;

    // 배경
    this.add.image(cx, cy, 'bg_gradient');

    // 배경 파티클 (JSX bg-particle 스타일)
    const particleColors = [0xFFD700, 0xFF6B6B, 0x4ECDC4, 0xA78BFA, 0x60A5FA];
    this.add.particles(cx, GAME_CONFIG.HEIGHT + 10, 'particle_glow', {
      x: { min: -cx, max: cx },
      speed: { min: 15, max: 40 },
      angle: { min: 260, max: 280 },
      scale: { start: 0.4, end: 0.1 },
      alpha: { start: 0.3, end: 0 },
      tint: particleColors,
      lifespan: { min: 5000, max: 10000 },
      frequency: 500,
      quantity: 1,
    }).setDepth(-1);

    // 장식 래디얼 글로우
    const glow = this.add.circle(cx, cy - 200, 200, 0x8B5CF6, 0.08);
    if (glow.preFX) glow.preFX.addBloom(0x8B5CF6, 1, 1, 2, 1.2);

    // 왕관 (JSX 스타일 float 애니메이션)
    const crown = this.add.text(cx, cy - 290, '👑', {
      fontSize: '56px',
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: crown,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: crown,
      y: '-=12',
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 타이틀 "MATCH 3" (골드 그라데이션 텍스트)
    const title1 = this.add.text(cx, cy - 230, 'MATCH 3', {
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#FFD54F',
      stroke: '#FF8F00',
      strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    if (title1.preFX) {
      title1.preFX.addGlow(0xFFD700, 3, 0, false, 0.05, 8);
    }

    // 서브타이틀 "ROYALE"
    const title2 = this.add.text(cx, cy - 175, 'ROYALE', {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#E0E0E0',
      letterSpacing: 12,
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    // 타이틀 등장 애니메이션
    this.tweens.add({
      targets: title1,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 500,
      delay: 100,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: title2,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 500,
      delay: 200,
      ease: 'Back.easeOut',
    });

    // 타이틀 떠다니기
    this.tweens.add({
      targets: [title1, title2],
      y: '-=6',
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 레벨 뱃지 (JSX 스타일 pill)
    const levelData = SaveManager.load();
    const badgeY = cy - 120;
    const badge = this.add.graphics();
    badge.fillStyle(0xFFD700, 0.1);
    badge.fillRoundedRect(cx - 75, badgeY - 16, 150, 32, 16);
    badge.lineStyle(1, 0xFFD700, 0.3);
    badge.strokeRoundedRect(cx - 75, badgeY - 16, 150, 32, 16);

    this.add.text(cx, badgeY, `⭐ LEVEL ${levelData.unlockedLevel}`, {
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#FFD54F',
    }).setOrigin(0.5);

    // 코인 표시 (JSX 스타일 pill)
    const coinY = cy - 75;
    const coinBg = this.add.graphics();
    coinBg.fillStyle(0x000000, 0.4);
    coinBg.fillRoundedRect(cx - 85, coinY - 18, 170, 36, 18);
    coinBg.lineStyle(1, 0xFFD700, 0.2);
    coinBg.strokeRoundedRect(cx - 85, coinY - 18, 170, 36, 18);

    this.add.text(cx, coinY, `🪙 ${SaveManager.getCoins().toLocaleString()}`, {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFD54F',
    }).setOrigin(0.5);

    // ─── 버튼 ────────────────────────────────

    // 플레이 버튼 (초록 JSX 스타일)
    new UIButton(this, cx, cy + 20, 300, 60, {
      text: '▶ 플레이',
      fontSize: '22px',
      bgColor: 0x43A047,
      radius: 16,
      shadowOffset: 6,
      glow: true,
      glowColor: 0x43A047,
      onClick: () => {
        audioManager.unlock();
        audioManager.playClick();
        audioManager.startBGM();
        fadeToScene(this, 'LevelSelect');
      },
    });

    // 일일 도전 버튼 (오렌지 JSX 스타일)
    new UIButton(this, cx, cy + 100, 300, 56, {
      text: '🔥 일일 도전',
      fontSize: '18px',
      bgColor: 0xFB8C00,
      radius: 16,
      shadowOffset: 5,
      onClick: () => {
        audioManager.unlock();
        audioManager.playClick();
        fadeToScene(this, 'DailyChallenge');
      },
    });

    // 토너먼트 버튼 (퍼플 JSX 스타일)
    new UIButton(this, cx, cy + 178, 300, 56, {
      text: '🏆 토너먼트',
      fontSize: '18px',
      bgColor: 0x5E35B1,
      radius: 16,
      shadowOffset: 5,
      onClick: () => {
        audioManager.unlock();
        audioManager.playClick();
      },
    });

    // 설정 버튼 (글래스 JSX 스타일)
    new UIButton(this, cx, cy + 252, 300, 50, {
      text: '⚙️ 설정',
      fontSize: '16px',
      bgColor: 0x2A2444,
      radius: 14,
      shadowOffset: 3,
      onClick: () => {
        audioManager.unlock();
        audioManager.playClick();
        fadeToScene(this, 'Settings');
      },
    });

    // ─── 하단 네비게이션 (JSX 스타일) ─────────

    const navY = GAME_CONFIG.HEIGHT - 50;
    const navBg = this.add.graphics();
    navBg.fillStyle(0x000000, 0.4);
    navBg.fillRect(0, navY - 30, GAME_CONFIG.WIDTH, 80);

    const navItems = [
      { icon: '🏠', label: '홈', active: true },
      { icon: '🗺️', label: '모험' },
      { icon: '👥', label: '친구' },
      { icon: '🎁', label: '상점' },
    ];

    navItems.forEach((item, i) => {
      const nx = 120 + i * 140;
      if (item.active) {
        const activeBg = this.add.graphics();
        activeBg.fillStyle(0xFFD700, 0.08);
        activeBg.fillRoundedRect(nx - 35, navY - 22, 70, 44, 12);
      }
      this.add.text(nx, navY - 10, item.icon, { fontSize: '22px' }).setOrigin(0.5);
      this.add.text(nx, navY + 12, item.label, {
        fontSize: '10px',
        fontStyle: 'bold',
        color: item.active ? '#FFD54F' : 'rgba(255,255,255,0.4)',
      }).setOrigin(0.5);
    });

    // 버전
    this.add.text(cx, GAME_CONFIG.HEIGHT - 90, 'v2.0.0', {
      fontSize: '12px',
      color: 'rgba(255,255,255,0.2)',
    }).setOrigin(0.5);
  }
}
