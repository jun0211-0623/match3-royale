import { GAME_CONFIG } from '../config.js';

const S = GAME_CONFIG.BOARD.GEM_SIZE; // 72

// ─── Shape Helpers ──────────────────────────────

function makeStarPoints(cx, cy, outerR, innerR) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
    pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  return pts;
}

function makeHexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 6;
    pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  return pts;
}

function makeDiamondPoints(cx, cy, hw, hh) {
  return [
    { x: cx, y: cy - hh },
    { x: cx + hw, y: cy },
    { x: cx, y: cy + hh },
    { x: cx - hw, y: cy },
  ];
}

function makeTriPoints(cx, cy, size) {
  const h = size * 0.44;
  return [
    { x: cx, y: cy - h - 1 },
    { x: cx + size * 0.48, y: cy + h },
    { x: cx - size * 0.48, y: cy + h },
  ];
}

// Color-to-shape mapping
const SHAPE_MAP = {
  red: 'circle',
  blue: 'diamond',
  green: 'roundedRect',
  yellow: 'star',
  purple: 'hexagon',
  orange: 'triangle',
};

function fillShape(g, shape, cx, cy, size) {
  const half = size / 2;
  switch (shape) {
    case 'circle':
      g.fillCircle(cx, cy, half);
      break;
    case 'diamond':
      g.fillPoints(makeDiamondPoints(cx, cy, half, half + 3), true);
      break;
    case 'roundedRect':
      g.fillRoundedRect(cx - half, cy - half, size, size, size * 0.22);
      break;
    case 'star':
      g.fillPoints(makeStarPoints(cx, cy, half + 1, half * 0.44), true);
      break;
    case 'hexagon':
      g.fillPoints(makeHexPoints(cx, cy, half), true);
      break;
    case 'triangle':
      g.fillPoints(makeTriPoints(cx, cy, size), true);
      break;
  }
}

function strokeShape(g, shape, cx, cy, size) {
  const half = size / 2;
  switch (shape) {
    case 'circle':
      g.strokeCircle(cx, cy, half);
      break;
    case 'diamond':
      g.strokePoints(makeDiamondPoints(cx, cy, half, half + 3), true);
      break;
    case 'roundedRect':
      g.strokeRoundedRect(cx - half, cy - half, size, size, size * 0.22);
      break;
    case 'star':
      g.strokePoints(makeStarPoints(cx, cy, half + 1, half * 0.44), true);
      break;
    case 'hexagon':
      g.strokePoints(makeHexPoints(cx, cy, half), true);
      break;
    case 'triangle':
      g.strokePoints(makeTriPoints(cx, cy, size), true);
      break;
  }
}

function lerpColor(c1, c2, t) {
  const r = ((c1 >> 16) & 0xff) + (((c2 >> 16) & 0xff) - ((c1 >> 16) & 0xff)) * t;
  const gv = ((c1 >> 8) & 0xff) + (((c2 >> 8) & 0xff) - ((c1 >> 8) & 0xff)) * t;
  const b = (c1 & 0xff) + ((c2 & 0xff) - (c1 & 0xff)) * t;
  return (Math.round(r) << 16) | (Math.round(gv) << 8) | Math.round(b);
}

// ─── 3D Gem Renderer ───────────────────────────

function drawGem3D(g, p, colorName) {
  const shape = SHAPE_MAP[colorName];
  const cx = S / 2, cy = S / 2;

  // 1. Drop shadow (soft, offset)
  g.fillStyle(0x000000, 0.3);
  fillShape(g, shape, cx + 2, cy + 3, S - 6);

  // 2. Outer bevel ring (gives 3D depth)
  g.fillStyle(p.darker, 0.9);
  fillShape(g, shape, cx, cy + 1, S - 2);

  // 3. Main body fill
  g.fillStyle(p.base, 1);
  fillShape(g, shape, cx, cy, S - 8);

  // 4. Inner gradient: dark bottom zone
  g.fillStyle(p.dark, 0.3);
  fillShape(g, shape, cx, cy + 5, S - 22);

  // 5. Mid-body color transition band
  g.fillStyle(lerpColor(p.base, p.dark, 0.25), 0.15);
  fillShape(g, shape, cx, cy + 3, S - 18);

  // 6. Upper light zone (large soft glow)
  g.fillStyle(p.lighter, 0.4);
  g.fillEllipse(cx, cy - S * 0.06, S * 0.66, S * 0.46);

  // 7. Glossy dome (bright upper bubble)
  g.fillStyle(p.rim, 0.3);
  g.fillEllipse(cx, cy - S * 0.12, S * 0.5, S * 0.3);

  // 8. Primary specular highlight
  g.fillStyle(0xffffff, 0.6);
  g.fillEllipse(cx - S * 0.05, cy - S * 0.18, S * 0.3, S * 0.14);

  // 9. Specular sub-dot
  g.fillStyle(0xffffff, 0.3);
  g.fillCircle(cx - S * 0.14, cy + S * 0.02, 2.5);

  // 10. Bottom rim light (reflection from below)
  g.fillStyle(p.light, 0.15);
  g.fillEllipse(cx + S * 0.04, cy + S * 0.24, S * 0.34, S * 0.08);

  // 11. Inner border highlight
  g.lineStyle(1.5, p.light, 0.12);
  strokeShape(g, shape, cx, cy, S - 8);

  // 12. Subtle outer edge glow
  g.lineStyle(1, 0xffffff, 0.06);
  strokeShape(g, shape, cx, cy, S - 4);
}

// ─── 일반 젬 텍스처 6색 생성 ─────────────────────

export function generateGemTextures(scene) {
  const colors = GAME_CONFIG.COLORS;
  const g = scene.add.graphics();

  colors.forEach((colorName) => {
    const p = GAME_CONFIG.COLOR_PALETTE[colorName];
    g.clear();
    drawGem3D(g, p, colorName);
    g.generateTexture(`gem_${colorName}`, S, S);
  });

  g.destroy();
}

// ─── 특수 블록 텍스처 생성 ───────────────────────

export function generateSpecialTextures(scene) {
  const colors = GAME_CONFIG.COLORS;
  const g = scene.add.graphics();
  const cx = S / 2, cy = S / 2;

  // ─── 로켓 (가로/세로 × 6색) ─────────────────
  colors.forEach((colorName) => {
    const p = GAME_CONFIG.COLOR_PALETTE[colorName];
    const shape = SHAPE_MAP[colorName];

    ['h', 'v'].forEach((dir) => {
      g.clear();
      drawGem3D(g, p, colorName);

      // Streak lines
      [{ w: 14, a: 0.12 }, { w: 8, a: 0.22 }, { w: 3, a: 0.4 }].forEach(({ w, a }) => {
        g.fillStyle(0xffffff, a);
        if (dir === 'h') g.fillRect(6, cy - w / 2, S - 12, w);
        else g.fillRect(cx - w / 2, 6, w, S - 12);
      });

      // Arrows
      g.fillStyle(0xffffff, 0.85);
      if (dir === 'h') {
        g.fillTriangle(6, cy, 20, cy - 10, 20, cy + 10);
        g.fillTriangle(S - 6, cy, S - 20, cy - 10, S - 20, cy + 10);
      } else {
        g.fillTriangle(cx, 6, cx - 10, 20, cx + 10, 20);
        g.fillTriangle(cx, S - 6, cx - 10, S - 20, cx + 10, S - 20);
      }

      // Bright border
      g.lineStyle(1.5, 0xffffff, 0.45);
      strokeShape(g, shape, cx, cy, S - 4);
      g.lineStyle(1, p.light, 0.3);
      strokeShape(g, shape, cx, cy, S - 8);

      g.generateTexture(`special_rocket_${dir}_${colorName}`, S, S);
    });
  });

  // ─── 폭탄 (6색) ──────────────────────────────
  colors.forEach((colorName) => {
    const p = GAME_CONFIG.COLOR_PALETTE[colorName];
    const shape = SHAPE_MAP[colorName];
    g.clear();
    drawGem3D(g, p, colorName);

    // 12-direction radial lines
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

    // Concentric center circles
    g.fillStyle(0xffffff, 0.15); g.fillCircle(cx, cy, 10);
    g.fillStyle(0xffffff, 0.35); g.fillCircle(cx, cy, 7);
    g.fillStyle(0xffffff, 0.85); g.fillCircle(cx, cy, 4);

    // Fuse spark
    g.fillStyle(0xffffff, 0.9); g.fillCircle(cx, 7, 2.5);
    g.lineStyle(1.5, 0xffffff, 0.5); g.lineBetween(cx, 10, cx, 16);

    // Danger border
    g.lineStyle(2.5, 0xff4444, 0.8);
    strokeShape(g, shape, cx, cy, S - 4);
    g.lineStyle(1, 0xff8800, 0.35);
    strokeShape(g, shape, cx, cy, S - 8);

    g.generateTexture(`special_bomb_${colorName}`, S, S);
  });

  // ─── 무지개 ──────────────────────────────────
  g.clear();

  // Crystal base (circle shape)
  g.fillStyle(0xddddef, 0.4);
  g.fillCircle(cx + 2, cy + 3, S / 2 - 3);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx, cy, S / 2 - 4);

  // Rainbow diagonal bands
  const rainbowColors = [0xe74c3c, 0xf39c12, 0xf1c40f, 0x2ecc71, 0x3498db, 0x9b59b6];
  const bandW = (S + 10) / rainbowColors.length;
  rainbowColors.forEach((color, i) => {
    g.fillStyle(color, 0.38);
    const x0 = -5 + i * bandW;
    g.fillTriangle(x0, 6, x0 + bandW, 6, x0 + bandW - 12, S - 6);
    g.fillTriangle(x0, 6, x0 + bandW - 12, S - 6, x0 - 12, S - 6);
    if (i > 0) {
      g.lineStyle(0.5, 0xffffff, 0.2);
      g.lineBetween(x0, 6, x0 - 12, S - 6);
    }
  });

  // Star rays from center
  g.lineStyle(1, 0xffffff, 0.3);
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6;
    g.lineBetween(cx, cy, cx + Math.cos(angle) * S / 3, cy + Math.sin(angle) * S / 3);
  }

  // Gloss overlay
  g.fillStyle(0xffffff, 0.3);
  g.fillEllipse(cx, cy - S * 0.08, S * 0.6, S * 0.35);
  g.fillStyle(0xffffff, 0.55);
  g.fillEllipse(cx - S * 0.05, cy - S * 0.18, S * 0.26, S * 0.12);

  // Center diamond
  const d = 10;
  g.fillStyle(0xffffff, 0.5);
  g.fillTriangle(cx, cy - d, cx + d, cy, cx, cy + d);
  g.fillTriangle(cx, cy - d, cx - d, cy, cx, cy + d);

  // Gold border
  g.lineStyle(3, 0xf1c40f, 0.9);
  g.strokeCircle(cx, cy, S / 2 - 4);
  g.lineStyle(1.5, 0xffd700, 0.5);
  g.strokeCircle(cx, cy, S / 2 - 6);

  g.generateTexture('special_rainbow', S, S);
  g.destroy();
}

// ─── 파티클 텍스처 생성 ─────────────────────────

export function generateParticleTextures(scene) {
  const g = scene.add.graphics();

  // Soft circle (8×8)
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(4, 4, 4);
  g.generateTexture('particle_circle', 8, 8);

  // Square (6×6)
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 0, 6, 6);
  g.generateTexture('particle_square', 6, 6);

  // Spark (12×4)
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(0, 0, 12, 3, 1);
  g.generateTexture('particle_spark', 12, 4);

  // Soft glow (16×16, 3-layer)
  g.clear();
  g.fillStyle(0xffffff, 0.3); g.fillCircle(8, 8, 8);
  g.fillStyle(0xffffff, 0.5); g.fillCircle(8, 8, 5);
  g.fillStyle(0xffffff, 0.8); g.fillCircle(8, 8, 2);
  g.generateTexture('particle_glow', 16, 16);

  g.destroy();
}

// ─── 장애물 텍스처 생성 ─────────────────────────

export function generateObstacleTextures(scene) {
  const g = scene.add.graphics();
  const obs = GAME_CONFIG.OBSTACLES;

  // ── 얼음 (frozen: 2레이어) ──
  g.clear();
  // Base ice plate
  g.fillStyle(obs.ice.colors.base, 0.55);
  g.fillRoundedRect(2, 2, S - 4, S - 4, 12);
  // Upper frost glow
  g.fillStyle(obs.ice.colors.frost, 0.35);
  g.fillRoundedRect(4, 4, S - 8, S / 2 - 4, { tl: 10, tr: 10, bl: 2, br: 2 });
  // Frost crystal lines
  g.lineStyle(1.5, 0xffffff, 0.4);
  g.lineBetween(10, 10, S / 2, S / 2);
  g.lineBetween(S - 10, 10, S / 2, S / 2);
  g.lineBetween(S / 2, S / 2, 10, S - 10);
  g.lineBetween(S / 2, S / 2, S - 10, S - 10);
  // Crystal sparkle dots
  g.fillStyle(0xffffff, 0.65);
  g.fillCircle(S / 2, S / 2, 3);
  g.fillCircle(14, 14, 2);
  g.fillCircle(S - 14, 14, 2);
  // Shine
  g.fillStyle(obs.ice.colors.shine, 0.6);
  g.fillRoundedRect(10, 7, S / 4, S / 7, 4);
  // Border
  g.lineStyle(2, obs.ice.colors.border, 0.7);
  g.strokeRoundedRect(2, 2, S - 4, S - 4, 12);
  g.generateTexture('obstacle_ice_frozen', S, S);

  // ── 얼음 (cracked: 1레이어) ──
  g.clear();
  g.fillStyle(obs.ice.colors.crack, 0.35);
  g.fillRoundedRect(2, 2, S - 4, S - 4, 12);
  // Crack lines
  g.lineStyle(2, 0xffffff, 0.7);
  g.lineBetween(S / 2, S * 0.2, S / 2 - 8, S / 2);
  g.lineBetween(S / 2 - 8, S / 2, S / 2 + 4, S * 0.75);
  g.lineStyle(1.5, 0xffffff, 0.5);
  g.lineBetween(S / 2 - 8, S / 2, S * 0.25, S / 2 + 6);
  g.lineBetween(S / 2 - 8, S / 2, S * 0.7, S / 2 - 4);
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(S * 0.3, S * 0.3, 2);
  g.fillCircle(S * 0.65, S * 0.6, 1.5);
  g.lineStyle(1.5, obs.ice.colors.border, 0.4);
  g.strokeRoundedRect(2, 2, S - 4, S - 4, 12);
  g.generateTexture('obstacle_ice_cracked', S, S);

  // ── 체인 ──
  g.clear();
  const mid = S / 2;
  g.lineStyle(4, obs.chain.colors.base, 0.85);
  g.lineBetween(8, 8, S - 8, S - 8);
  g.lineBetween(S - 8, 8, 8, S - 8);
  g.lineStyle(3.5, obs.chain.colors.base, 0.75);
  g.lineBetween(mid, 6, mid, S - 6);
  g.lineBetween(6, mid, S - 6, mid);
  const nodes = [[mid, mid], [14, 14], [S - 14, 14], [14, S - 14], [S - 14, S - 14], [mid, 8], [mid, S - 8], [8, mid], [S - 8, mid]];
  nodes.forEach(([nx, ny]) => {
    g.fillStyle(obs.chain.colors.link, 0.9);
    g.fillCircle(nx, ny, 4);
    g.fillStyle(obs.chain.colors.shine, 0.5);
    g.fillCircle(nx - 1, ny - 1, 2);
  });
  g.lineStyle(1.5, obs.chain.colors.dark, 0.5);
  g.strokeRoundedRect(3, 3, S - 6, S - 6, 10);
  g.generateTexture('obstacle_chain', S, S);

  // ── 나무상자 (full: 2레이어) ──
  g.clear();
  g.fillStyle(obs.wood.colors.base, 1);
  g.fillRoundedRect(2, 2, S - 4, S - 4, 6);
  g.lineStyle(1, obs.wood.colors.grain, 0.45);
  for (let y = 10; y < S - 8; y += 8) {
    const wobble = Math.sin(y * 0.3) * 3;
    g.lineBetween(6, y + wobble, S - 6, y - wobble);
  }
  g.lineStyle(2.5, obs.wood.colors.dark, 0.7);
  g.lineBetween(mid, 4, mid, S - 4);
  g.lineBetween(4, mid, S - 4, mid);
  [[14, 14], [S - 14, 14], [14, S - 14], [S - 14, S - 14]].forEach(([nx, ny]) => {
    g.fillStyle(obs.wood.colors.nail, 0.8);
    g.fillCircle(nx, ny, 3);
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(nx - 0.5, ny - 0.5, 1.5);
  });
  g.fillStyle(obs.wood.colors.light, 0.2);
  g.fillRoundedRect(5, 4, S - 12, S / 2 - 8, { tl: 5, tr: 5, bl: 2, br: 2 });
  g.lineStyle(2.5, obs.wood.colors.border, 0.85);
  g.strokeRoundedRect(2, 2, S - 4, S - 4, 6);
  g.generateTexture('obstacle_wood_full', S, S);

  // ── 나무상자 (damaged: 1레이어) ──
  g.clear();
  g.fillStyle(obs.wood.colors.light, 1);
  g.fillRoundedRect(2, 2, S - 4, S - 4, 6);
  g.lineStyle(1, obs.wood.colors.grain, 0.35);
  for (let y = 10; y < S - 8; y += 10) {
    g.lineBetween(6, y, S - 6, y);
  }
  g.lineStyle(2.5, obs.wood.colors.dark, 0.8);
  g.lineBetween(mid - 3, S * 0.15, mid + 5, S * 0.55);
  g.lineBetween(mid + 5, S * 0.55, mid - 8, S * 0.85);
  g.lineStyle(1.5, obs.wood.colors.dark, 0.5);
  g.lineBetween(mid + 5, S * 0.55, S * 0.75, S * 0.45);
  [[14, mid], [S - 14, mid]].forEach(([nx, ny]) => {
    g.fillStyle(obs.wood.colors.nail, 0.8);
    g.fillCircle(nx, ny, 2.5);
  });
  g.lineStyle(2, obs.wood.colors.border, 0.6);
  g.strokeRoundedRect(2, 2, S - 4, S - 4, 6);
  g.generateTexture('obstacle_wood_damaged', S, S);

  g.destroy();
}

// ─── 배경 그라디언트 텍스처 생성 ─────────────────

export function generateBackgroundTexture(scene) {
  const W = GAME_CONFIG.WIDTH;
  const H = GAME_CONFIG.HEIGHT;
  const g = scene.add.graphics();

  // Multi-stop vertical gradient
  const stops = [
    { t: 0, r: 6, g: 10, b: 36 },
    { t: 0.3, r: 12, g: 14, b: 50 },
    { t: 0.6, r: 18, g: 10, b: 48 },
    { t: 1.0, r: 10, g: 8, b: 30 },
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

  // Subtle star field (deterministic pattern)
  const seed = 42;
  for (let i = 0; i < 50; i++) {
    const px = ((seed * (i + 1) * 7919) % 10007) / 10007 * W;
    const py = ((seed * (i + 1) * 6271) % 10007) / 10007 * H;
    const sr = 0.5 + ((seed * (i + 1) * 3571) % 100) / 100 * 1.5;
    const sa = 0.02 + ((seed * (i + 1) * 4219) % 100) / 100 * 0.06;
    g.fillStyle(0xffffff, sa);
    g.fillCircle(px, py, sr);
  }

  // Soft radial center glow
  for (let i = 0; i < 10; i++) {
    g.fillStyle(0x3498db, 0.006);
    g.fillCircle(W / 2, H * 0.42, 280 - i * 25);
  }

  // Dot pattern overlay
  g.fillStyle(0xffffff, 0.01);
  for (let py = 0; py < H; py += 40) {
    for (let px = 0; px < W; px += 40) {
      g.fillCircle(px + (Math.floor(py / 40) % 2 === 0 ? 0 : 20), py, 1.5);
    }
  }

  // Top vignette
  g.fillStyle(0x000000, 0.15);
  g.fillRect(0, 0, W, 35);
  g.fillStyle(0x000000, 0.08);
  g.fillRect(0, 35, W, 35);

  // Bottom vignette
  g.fillStyle(0x000000, 0.08);
  g.fillRect(0, H - 70, W, 35);
  g.fillStyle(0x000000, 0.18);
  g.fillRect(0, H - 35, W, 35);

  // Side vignettes
  for (let i = 0; i < 4; i++) {
    const a = 0.025 * (4 - i);
    const w = 12 + i * 8;
    g.fillStyle(0x000000, a);
    g.fillRect(0, 0, w, H);
    g.fillRect(W - w, 0, w, H);
  }

  g.generateTexture('bg_gradient', W, H);
  g.destroy();
}
