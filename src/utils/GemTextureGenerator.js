import { GAME_CONFIG } from '../config.js';

const S = GAME_CONFIG.BOARD.GEM_SIZE; // 72
const R = 14; // border radius

function lerpColor(c1, c2, t) {
  const r = ((c1 >> 16) & 0xff) + (((c2 >> 16) & 0xff) - ((c1 >> 16) & 0xff)) * t;
  const g = ((c1 >> 8) & 0xff) + (((c2 >> 8) & 0xff) - ((c1 >> 8) & 0xff)) * t;
  const b = (c1 & 0xff) + ((c2 & 0xff) - (c1 & 0xff)) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}

// ─── JSX 스타일 젬 렌더러 ──────────────────────

function drawGem(g, p) {
  // 1. 드롭 섀도
  g.fillStyle(0x000000, 0.25);
  g.fillRoundedRect(3, 5, S - 4, S - 3, R);

  // 2. 메인 바디 (base)
  g.fillStyle(p.base, 1);
  g.fillRoundedRect(2, 2, S - 4, S - 4, R);

  // 3. 135도 대각선 그라데이션 시뮬레이션
  // 좌상단 → 메인(어두움) → 우하단(밝음)
  // 좌상단 밝은 존
  g.fillStyle(p.light, 0.3);
  g.fillRoundedRect(2, 2, S * 0.55, S * 0.55, { tl: R, tr: 4, bl: 4, br: 0 });

  // 중앙 어두운 존
  g.fillStyle(p.dark, 0.2);
  g.fillRoundedRect(S * 0.2, S * 0.2, S * 0.6, S * 0.6, 6);

  // 우하단 밝은 존
  g.fillStyle(p.light, 0.18);
  g.fillRoundedRect(S * 0.45, S * 0.45, S * 0.53, S * 0.53, { tl: 0, tr: 4, bl: 4, br: R });

  // 4. 좌상단 원형 샤인 (JSX 스타일)
  g.fillStyle(0xffffff, 0.2);
  g.fillCircle(18, 17, 16);
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(16, 15, 10);

  // 5. 하단 그림자 그라데이션
  g.fillStyle(0x000000, 0.12);
  g.fillRoundedRect(2, S * 0.6, S - 4, S * 0.4 - 2, { tl: 0, tr: 0, bl: R, br: R });

  // 6. 상단 이너 하이라이트 (inset)
  g.fillStyle(0xffffff, 0.2);
  g.fillRoundedRect(6, 4, S - 12, 4, 2);

  // 7. 미세 보더
  g.lineStyle(1, 0xffffff, 0.05);
  g.strokeRoundedRect(2, 2, S - 4, S - 4, R);
}

// ─── 일반 젬 텍스처 6색 생성 ─────────────────────

export function generateGemTextures(scene) {
  const colors = GAME_CONFIG.COLORS;
  const g = scene.add.graphics();

  colors.forEach((colorName) => {
    const p = GAME_CONFIG.COLOR_PALETTE[colorName];
    g.clear();
    drawGem(g, p);
    g.generateTexture(`gem_${colorName}`, S, S);
  });

  g.destroy();
}

// ─── 특수 블록 텍스처 생성 ───────────────────────

export function generateSpecialTextures(scene) {
  const colors = GAME_CONFIG.COLORS;
  const g = scene.add.graphics();
  const cx = S / 2, cy = S / 2;

  // ── 로켓 (가로/세로 × 6색) ──
  colors.forEach((colorName) => {
    const p = GAME_CONFIG.COLOR_PALETTE[colorName];

    ['h', 'v'].forEach((dir) => {
      g.clear();
      drawGem(g, p);

      // 스트릭 라인
      [{ w: 14, a: 0.1 }, { w: 8, a: 0.2 }, { w: 3, a: 0.4 }].forEach(({ w, a }) => {
        g.fillStyle(0xffffff, a);
        if (dir === 'h') g.fillRect(6, cy - w / 2, S - 12, w);
        else g.fillRect(cx - w / 2, 6, w, S - 12);
      });

      // 화살표
      g.fillStyle(0xffffff, 0.85);
      if (dir === 'h') {
        g.fillTriangle(6, cy, 20, cy - 10, 20, cy + 10);
        g.fillTriangle(S - 6, cy, S - 20, cy - 10, S - 20, cy + 10);
      } else {
        g.fillTriangle(cx, 6, cx - 10, 20, cx + 10, 20);
        g.fillTriangle(cx, S - 6, cx - 10, S - 20, cx + 10, S - 20);
      }

      g.lineStyle(1.5, 0xffffff, 0.4);
      g.strokeRoundedRect(2, 2, S - 4, S - 4, R);

      g.generateTexture(`special_rocket_${dir}_${colorName}`, S, S);
    });
  });

  // ── 폭탄 (6색) ──
  colors.forEach((colorName) => {
    const p = GAME_CONFIG.COLOR_PALETTE[colorName];
    g.clear();
    drawGem(g, p);

    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const thick = i % 2 === 0;
      g.lineStyle(thick ? 2.5 : 1.5, 0xffffff, thick ? 0.6 : 0.35);
      const innerR = 7, outerR = thick ? S / 2 - 8 : S / 2 - 14;
      g.lineBetween(
        cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR,
        cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR
      );
    }

    g.fillStyle(0xffffff, 0.15); g.fillCircle(cx, cy, 10);
    g.fillStyle(0xffffff, 0.35); g.fillCircle(cx, cy, 7);
    g.fillStyle(0xffffff, 0.85); g.fillCircle(cx, cy, 4);

    g.fillStyle(0xffffff, 0.9); g.fillCircle(cx, 7, 2.5);
    g.lineStyle(1.5, 0xffffff, 0.5); g.lineBetween(cx, 10, cx, 16);

    g.lineStyle(2.5, 0xff4444, 0.8);
    g.strokeRoundedRect(2, 2, S - 4, S - 4, R);

    g.generateTexture(`special_bomb_${colorName}`, S, S);
  });

  // ── 무지개 ──
  g.clear();
  g.fillStyle(0xddddef, 0.4);
  g.fillRoundedRect(4, 6, S - 6, S - 5, R);
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(2, 2, S - 4, S - 4, R);

  const rainbowColors = [0xFF1744, 0xFFC400, 0x00E676, 0x2979FF, 0xD500F9, 0xFF6D00];
  const bandW = (S + 10) / rainbowColors.length;
  rainbowColors.forEach((color, i) => {
    g.fillStyle(color, 0.35);
    const x0 = -5 + i * bandW;
    g.fillTriangle(x0, 6, x0 + bandW, 6, x0 + bandW - 12, S - 6);
    g.fillTriangle(x0, 6, x0 + bandW - 12, S - 6, x0 - 12, S - 6);
  });

  g.fillStyle(0xffffff, 0.3);
  g.fillEllipse(cx, cy - S * 0.08, S * 0.6, S * 0.35);
  g.fillStyle(0xffffff, 0.5);
  g.fillEllipse(cx - S * 0.05, cy - S * 0.17, S * 0.25, S * 0.1);

  const d = 10;
  g.fillStyle(0xffffff, 0.5);
  g.fillTriangle(cx, cy - d, cx + d, cy, cx, cy + d);
  g.fillTriangle(cx, cy - d, cx - d, cy, cx, cy + d);

  g.lineStyle(3, 0xFFD54F, 0.9);
  g.strokeRoundedRect(2, 2, S - 4, S - 4, R);

  g.generateTexture('special_rainbow', S, S);
  g.destroy();
}

// ─── 파티클 텍스처 ──────────────────────────────

export function generateParticleTextures(scene) {
  const g = scene.add.graphics();

  g.clear();
  g.fillStyle(0xffffff, 1); g.fillCircle(4, 4, 4);
  g.generateTexture('particle_circle', 8, 8);

  g.clear();
  g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 6, 6);
  g.generateTexture('particle_square', 6, 6);

  g.clear();
  g.fillStyle(0xffffff, 1); g.fillRoundedRect(0, 0, 12, 3, 1);
  g.generateTexture('particle_spark', 12, 4);

  g.clear();
  g.fillStyle(0xffffff, 0.3); g.fillCircle(8, 8, 8);
  g.fillStyle(0xffffff, 0.5); g.fillCircle(8, 8, 5);
  g.fillStyle(0xffffff, 0.8); g.fillCircle(8, 8, 2);
  g.generateTexture('particle_glow', 16, 16);

  g.destroy();
}

// ─── 장애물 텍스처 ──────────────────────────────

export function generateObstacleTextures(scene) {
  const g = scene.add.graphics();
  const obs = GAME_CONFIG.OBSTACLES;
  const mid = S / 2;

  // 얼음 frozen
  g.clear();
  g.fillStyle(obs.ice.colors.base, 0.55);
  g.fillRoundedRect(2, 2, S - 4, S - 4, 12);
  g.fillStyle(obs.ice.colors.frost, 0.35);
  g.fillRoundedRect(4, 4, S - 8, S / 2 - 4, { tl: 10, tr: 10, bl: 2, br: 2 });
  g.lineStyle(1.5, 0xffffff, 0.4);
  g.lineBetween(10, 10, mid, mid); g.lineBetween(S - 10, 10, mid, mid);
  g.lineBetween(mid, mid, 10, S - 10); g.lineBetween(mid, mid, S - 10, S - 10);
  g.fillStyle(0xffffff, 0.65);
  g.fillCircle(mid, mid, 3); g.fillCircle(14, 14, 2); g.fillCircle(S - 14, 14, 2);
  g.fillStyle(obs.ice.colors.shine, 0.6);
  g.fillRoundedRect(10, 7, S / 4, S / 7, 4);
  g.lineStyle(2, obs.ice.colors.border, 0.7);
  g.strokeRoundedRect(2, 2, S - 4, S - 4, 12);
  g.generateTexture('obstacle_ice_frozen', S, S);

  // 얼음 cracked
  g.clear();
  g.fillStyle(obs.ice.colors.crack, 0.35);
  g.fillRoundedRect(2, 2, S - 4, S - 4, 12);
  g.lineStyle(2, 0xffffff, 0.7);
  g.lineBetween(mid, S * 0.2, mid - 8, mid);
  g.lineBetween(mid - 8, mid, mid + 4, S * 0.75);
  g.lineStyle(1.5, 0xffffff, 0.5);
  g.lineBetween(mid - 8, mid, S * 0.25, mid + 6);
  g.lineBetween(mid - 8, mid, S * 0.7, mid - 4);
  g.lineStyle(1.5, obs.ice.colors.border, 0.4);
  g.strokeRoundedRect(2, 2, S - 4, S - 4, 12);
  g.generateTexture('obstacle_ice_cracked', S, S);

  // 체인
  g.clear();
  g.lineStyle(4, obs.chain.colors.base, 0.85);
  g.lineBetween(8, 8, S - 8, S - 8); g.lineBetween(S - 8, 8, 8, S - 8);
  g.lineStyle(3.5, obs.chain.colors.base, 0.75);
  g.lineBetween(mid, 6, mid, S - 6); g.lineBetween(6, mid, S - 6, mid);
  [[mid, mid], [14, 14], [S - 14, 14], [14, S - 14], [S - 14, S - 14], [mid, 8], [mid, S - 8], [8, mid], [S - 8, mid]].forEach(([nx, ny]) => {
    g.fillStyle(obs.chain.colors.link, 0.9); g.fillCircle(nx, ny, 4);
    g.fillStyle(obs.chain.colors.shine, 0.5); g.fillCircle(nx - 1, ny - 1, 2);
  });
  g.lineStyle(1.5, obs.chain.colors.dark, 0.5);
  g.strokeRoundedRect(3, 3, S - 6, S - 6, 10);
  g.generateTexture('obstacle_chain', S, S);

  // 나무 full
  g.clear();
  g.fillStyle(obs.wood.colors.base, 1);
  g.fillRoundedRect(2, 2, S - 4, S - 4, 6);
  g.lineStyle(1, obs.wood.colors.grain, 0.45);
  for (let y = 10; y < S - 8; y += 8) {
    const w = Math.sin(y * 0.3) * 3;
    g.lineBetween(6, y + w, S - 6, y - w);
  }
  g.lineStyle(2.5, obs.wood.colors.dark, 0.7);
  g.lineBetween(mid, 4, mid, S - 4); g.lineBetween(4, mid, S - 4, mid);
  [[14, 14], [S - 14, 14], [14, S - 14], [S - 14, S - 14]].forEach(([nx, ny]) => {
    g.fillStyle(obs.wood.colors.nail, 0.8); g.fillCircle(nx, ny, 3);
    g.fillStyle(0xffffff, 0.4); g.fillCircle(nx - 0.5, ny - 0.5, 1.5);
  });
  g.fillStyle(obs.wood.colors.light, 0.2);
  g.fillRoundedRect(5, 4, S - 12, S / 2 - 8, { tl: 5, tr: 5, bl: 2, br: 2 });
  g.lineStyle(2.5, obs.wood.colors.border, 0.85);
  g.strokeRoundedRect(2, 2, S - 4, S - 4, 6);
  g.generateTexture('obstacle_wood_full', S, S);

  // 나무 damaged
  g.clear();
  g.fillStyle(obs.wood.colors.light, 1);
  g.fillRoundedRect(2, 2, S - 4, S - 4, 6);
  g.lineStyle(1, obs.wood.colors.grain, 0.35);
  for (let y = 10; y < S - 8; y += 10) g.lineBetween(6, y, S - 6, y);
  g.lineStyle(2.5, obs.wood.colors.dark, 0.8);
  g.lineBetween(mid - 3, S * 0.15, mid + 5, S * 0.55);
  g.lineBetween(mid + 5, S * 0.55, mid - 8, S * 0.85);
  g.lineStyle(1.5, obs.wood.colors.dark, 0.5);
  g.lineBetween(mid + 5, S * 0.55, S * 0.75, S * 0.45);
  [[14, mid], [S - 14, mid]].forEach(([nx, ny]) => {
    g.fillStyle(obs.wood.colors.nail, 0.8); g.fillCircle(nx, ny, 2.5);
  });
  g.lineStyle(2, obs.wood.colors.border, 0.6);
  g.strokeRoundedRect(2, 2, S - 4, S - 4, 6);
  g.generateTexture('obstacle_wood_damaged', S, S);

  g.destroy();
}

// ─── 배경 텍스처 (JSX 딥퍼플 스타일) ─────────────

export function generateBackgroundTexture(scene) {
  const W = GAME_CONFIG.WIDTH;
  const H = GAME_CONFIG.HEIGHT;
  const g = scene.add.graphics();

  // JSX 배경: #0A0E27 → #1A1145 → #2D1B69 → #1A1145
  const stops = [
    { t: 0, r: 10, g: 14, b: 39 },
    { t: 0.3, r: 26, g: 17, b: 69 },
    { t: 0.6, r: 45, g: 27, b: 105 },
    { t: 1.0, r: 26, g: 17, b: 69 },
  ];
  const steps = 40;
  const bandH = Math.ceil(H / steps);

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    let r, gv, b;
    for (let j = 0; j < stops.length - 1; j++) {
      if (t >= stops[j].t && t <= stops[j + 1].t) {
        const lt = (t - stops[j].t) / (stops[j + 1].t - stops[j].t);
        r = Math.round(stops[j].r + (stops[j + 1].r - stops[j].r) * lt);
        gv = Math.round(stops[j].g + (stops[j + 1].g - stops[j].g) * lt);
        b = Math.round(stops[j].b + (stops[j + 1].b - stops[j].b) * lt);
        break;
      }
    }
    g.fillStyle((r << 16) | (gv << 8) | b, 1);
    g.fillRect(0, i * bandH, W, bandH + 1);
  }

  // 중앙 보라 래디얼 글로우
  for (let i = 0; i < 10; i++) {
    g.fillStyle(0x8B5CF6, 0.008);
    g.fillCircle(W / 2, H * 0.35, 300 - i * 25);
  }

  // 미세 도트 패턴
  g.fillStyle(0xffffff, 0.008);
  for (let py = 0; py < H; py += 40) {
    for (let px = 0; px < W; px += 40) {
      g.fillCircle(px + (Math.floor(py / 40) % 2 === 0 ? 0 : 20), py, 1.5);
    }
  }

  // 비네트
  g.fillStyle(0x000000, 0.15); g.fillRect(0, 0, W, 35);
  g.fillStyle(0x000000, 0.08); g.fillRect(0, 35, W, 35);
  g.fillStyle(0x000000, 0.06); g.fillRect(0, H - 70, W, 35);
  g.fillStyle(0x000000, 0.15); g.fillRect(0, H - 35, W, 35);

  g.generateTexture('bg_gradient', W, H);
  g.destroy();
}
