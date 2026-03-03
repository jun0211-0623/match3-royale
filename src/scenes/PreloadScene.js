import Phaser from 'phaser';
import { generateGemTextures, generateSpecialTextures, generateParticleTextures, generateBackgroundTexture, generateObstacleTextures } from '../utils/GemTextureGenerator.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const cx = W / 2;

    // ─── 다크 그라디언트 배경 ─────────────────
    const bg = this.add.graphics();
    const colors = [0x0A0E27, 0x111335, 0x1A1145, 0x231858, 0x2D1B69, 0x231858, 0x1A1145];
    const stops = [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1.0];
    const strips = 60;
    for (let i = 0; i < strips; i++) {
      const t = i / strips;
      const color = this._lerpGradient(colors, stops, t);
      bg.fillStyle(color, 1);
      bg.fillRect(0, Math.floor(H * t), W, Math.ceil(H / strips) + 1);
    }

    // ─── 미묘한 빛 효과 ──────────────────────
    const glow = this.add.graphics();
    glow.fillStyle(0x8B5CF6, 0.06);
    glow.fillCircle(cx, H * 0.35, 200);
    glow.fillStyle(0xFFD54F, 0.03);
    glow.fillCircle(cx, H * 0.35, 120);

    // ─── 떠다니는 파티클 ─────────────────────
    const particleColors = [0xFFD700, 0xA78BFA, 0x4ECDC4, 0xFF6B6B, 0x60A5FA];
    for (let i = 0; i < 10; i++) {
      const px = Math.random() * W;
      const py = H + 30 + Math.random() * 100;
      const r = 1.5 + Math.random() * 2.5;
      const c = particleColors[i % particleColors.length];
      const dot = this.add.circle(px, py, r, c, 0.25 + Math.random() * 0.15);
      this.tweens.add({
        targets: dot, y: -30,
        duration: 6000 + Math.random() * 6000,
        repeat: -1, delay: Math.random() * 4000,
      });
    }

    // ─── 왕관 (떠다니는 애니메이션) ──────────
    const crown = this.add.text(cx, H * 0.30, '👑', { fontSize: '52px' }).setOrigin(0.5);
    crown.setAlpha(0);
    this.tweens.add({
      targets: crown, alpha: 1, y: H * 0.28,
      duration: 600, ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: crown, y: '-=8',
      duration: 1800, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut', delay: 600,
    });

    // ─── 타이틀 텍스트 ──────────────────────
    const title = this.add.text(cx, H * 0.38, 'MATCH 3', {
      fontSize: '44px', fontStyle: 'bold', color: '#FFD54F',
      shadow: { offsetX: 0, offsetY: 3, color: 'rgba(255,143,0,0.5)', blur: 8, fill: true },
    }).setOrigin(0.5).setAlpha(0);

    const subtitle = this.add.text(cx, H * 0.38 + 46, 'ROYALE', {
      fontSize: '18px', fontStyle: 'bold', color: '#B0B0B0',
      letterSpacing: 14,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, y: '-=10', duration: 500, delay: 200, ease: 'Power2' });
    this.tweens.add({ targets: subtitle, alpha: 1, y: '-=8', duration: 500, delay: 350, ease: 'Power2' });

    // ─── 글래스 프로그레스 바 ────────────────
    const barW = 280;
    const barH = 14;
    const barY = H * 0.52;
    const barX = cx - barW / 2;

    // 바 배경 (글래스)
    const barBg = this.add.graphics();
    barBg.fillStyle(0xffffff, 0.08);
    barBg.fillRoundedRect(barX, barY, barW, barH, 7);
    barBg.lineStyle(1, 0xffffff, 0.1);
    barBg.strokeRoundedRect(barX, barY, barW, barH, 7);

    // 바 필 (골드)
    const barFill = this.add.graphics();

    // 퍼센트 텍스트
    const percentText = this.add.text(cx, barY - 16, '0%', {
      fontSize: '13px', fontStyle: 'bold', color: '#FFD54F',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: percentText, alpha: 1, duration: 400, delay: 500 });

    // 로딩 텍스트 (점 애니메이션)
    const loadText = this.add.text(cx, barY + 30, '로딩 중', {
      fontSize: '14px', color: 'rgba(255,255,255,0.45)',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: loadText, alpha: 1, duration: 400, delay: 500 });

    let dots = 0;
    this.time.addEvent({
      delay: 400, loop: true,
      callback: () => { dots = (dots + 1) % 4; loadText.setText('로딩 중' + '.'.repeat(dots)); },
    });

    // ─── 프로그레스 업데이트 ─────────────────
    this.load.on('progress', (value) => {
      barFill.clear();
      const fillW = Math.max(0, (barW - 4) * value);
      if (fillW > 0) {
        barFill.fillStyle(0xFFD54F, 1);
        barFill.fillRoundedRect(barX + 2, barY + 2, fillW, barH - 4, 5);
        // 상단 하이라이트
        barFill.fillStyle(0xFFE082, 0.5);
        barFill.fillRoundedRect(barX + 2, barY + 2, fillW, (barH - 4) / 2, { tl: 5, tr: 5, bl: 0, br: 0 });
      }
      percentText.setText(`${Math.round(value * 100)}%`);
    });

    this.load.on('complete', () => {
      // 100% 도달 후 잠시 보여주고 정리
      percentText.setText('100%');
    });
  }

  create() {
    // 텍스처 사전 생성
    generateGemTextures(this);
    generateSpecialTextures(this);
    generateParticleTextures(this);
    generateBackgroundTexture(this);
    generateObstacleTextures(this);

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Menu');
    });
  }

  /** 그라디언트 색상 보간 헬퍼 */
  _lerpGradient(colors, stops, t) {
    let i = 0;
    while (i < stops.length - 2 && t > stops[i + 1]) i++;
    const t0 = stops[i], t1 = stops[i + 1];
    const f = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
    const c0 = colors[i], c1 = colors[i + 1];
    const r = Math.round(((c0 >> 16) & 0xFF) * (1 - f) + ((c1 >> 16) & 0xFF) * f);
    const g = Math.round(((c0 >> 8) & 0xFF) * (1 - f) + ((c1 >> 8) & 0xFF) * f);
    const b = Math.round((c0 & 0xFF) * (1 - f) + (c1 & 0xFF) * f);
    return (r << 16) | (g << 8) | b;
  }
}
