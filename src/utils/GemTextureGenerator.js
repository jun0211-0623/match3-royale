import { GAME_CONFIG } from '../config.js';

const S = GAME_CONFIG.BOARD.GEM_SIZE; // 72
const R = 17; // borderRadius: 10/42 * 72 ≈ 17 (JSX: borderRadius 10 at 42px)

// ─── Canvas 2D 유틸 ──────────────────────────────

function hexToCSS(hex, alpha = 1) {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return alpha < 1 ? `rgba(${r},${g},${b},${alpha})` : `rgb(${r},${g},${b})`;
}

function rrect(ctx, x, y, w, h, r) {
  if (typeof r === 'number') {
    r = { tl: r, tr: r, bl: r, br: r };
  }
  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + w - r.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
  ctx.lineTo(x + w, y + h - r.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
  ctx.lineTo(x + r.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();
}

// ─── JSX 젬 렌더러 (Canvas 2D) ──────────────────

function drawJSXGem(ctx, colors) {
  // JSX 젬 구조:
  // 1. background: linear-gradient(135deg, start 0%, mid 50%, end 100%)
  // 2. boxShadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.2)
  // 3. Shine: radial-gradient at top-left (14x14 at pos 4,3 in 42px)
  // 4. Bottom shadow: linear-gradient(transparent, rgba(0,0,0,0.15)) bottom 40%

  ctx.clearRect(0, 0, S, S);

  // Clip to rounded rect
  ctx.save();
  rrect(ctx, 1, 1, S - 2, S - 2, R);
  ctx.clip();

  // 1. 135deg linear gradient (top-left → bottom-right)
  const grad = ctx.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, colors.start);
  grad.addColorStop(0.5, colors.mid);
  grad.addColorStop(1, colors.end);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  // 2. Top-left shine (JSX: 14x14 radial at (4,3) scaled to 72px → (6.9, 5.1) radius ~12)
  const shineX = S * 0.095 + S * 0.167; // center X
  const shineY = S * 0.071 + S * 0.167; // center Y
  const shineR = S * 0.24; // outer radius
  const shineGrad = ctx.createRadialGradient(shineX, shineY, 0, shineX, shineY, shineR);
  shineGrad.addColorStop(0, 'rgba(255,255,255,0.5)');
  shineGrad.addColorStop(0.7, 'rgba(255,255,255,0)');
  ctx.fillStyle = shineGrad;
  ctx.fillRect(0, 0, S, S);

  // 3. Bottom shadow (JSX: bottom 40%, transparent → rgba(0,0,0,0.15))
  const botGrad = ctx.createLinearGradient(0, S * 0.6, 0, S);
  botGrad.addColorStop(0, 'rgba(0,0,0,0)');
  botGrad.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, S * 0.6, S, S * 0.4);

  ctx.restore(); // remove clip

  // 4. Inset top highlight (JSX: inset 0 1px 0 rgba(255,255,255,0.3))
  ctx.beginPath();
  ctx.moveTo(1 + R, 2);
  ctx.lineTo(S - 1 - R, 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 5. Subtle border
  rrect(ctx, 1, 1, S - 2, S - 2, R);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ─── 일반 젬 텍스처 6색 생성 ─────────────────────

export function generateGemTextures(scene) {
  const colors = GAME_CONFIG.COLORS;
  const gradients = GAME_CONFIG.COLOR_GRADIENT;

  colors.forEach((colorName) => {
    const g = gradients[colorName];
    const ct = scene.textures.createCanvas(`gem_${colorName}`, S, S);
    drawJSXGem(ct.context, g);
    ct.refresh();
  });
}

// ─── 특수 블록 텍스처 생성 (Canvas 2D) ───────────

export function generateSpecialTextures(scene) {
  const colors = GAME_CONFIG.COLORS;
  const gradients = GAME_CONFIG.COLOR_GRADIENT;
  const cx = S / 2, cy = S / 2;

  // ── 로켓 (가로/세로 × 6색) ──
  colors.forEach((colorName) => {
    const g = gradients[colorName];

    ['h', 'v'].forEach((dir) => {
      const ct = scene.textures.createCanvas(`special_rocket_${dir}_${colorName}`, S, S);
      const ctx = ct.context;
      drawJSXGem(ctx, g);

      // Streak lines
      [{ w: 14, a: 0.1 }, { w: 8, a: 0.2 }, { w: 3, a: 0.4 }].forEach(({ w, a }) => {
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        if (dir === 'h') ctx.fillRect(6, cy - w / 2, S - 12, w);
        else ctx.fillRect(cx - w / 2, 6, w, S - 12);
      });

      // Arrows
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      if (dir === 'h') {
        ctx.moveTo(6, cy); ctx.lineTo(20, cy - 10); ctx.lineTo(20, cy + 10); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(S - 6, cy); ctx.lineTo(S - 20, cy - 10); ctx.lineTo(S - 20, cy + 10); ctx.closePath(); ctx.fill();
      } else {
        ctx.moveTo(cx, 6); ctx.lineTo(cx - 10, 20); ctx.lineTo(cx + 10, 20); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx, S - 6); ctx.lineTo(cx - 10, S - 20); ctx.lineTo(cx + 10, S - 20); ctx.closePath(); ctx.fill();
      }

      // White border
      rrect(ctx, 2, 2, S - 4, S - 4, R);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ct.refresh();
    });
  });

  // ── 폭탄 (6색) ──
  colors.forEach((colorName) => {
    const g = gradients[colorName];
    const ct = scene.textures.createCanvas(`special_bomb_${colorName}`, S, S);
    const ctx = ct.context;
    drawJSXGem(ctx, g);

    // Radial lines
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const thick = i % 2 === 0;
      ctx.lineWidth = thick ? 2.5 : 1.5;
      ctx.strokeStyle = thick ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)';
      const innerR = 7, outerR = thick ? S / 2 - 8 : S / 2 - 14;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
      ctx.stroke();
    }

    // Center dot
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();

    // Fuse
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(cx, 7, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, 10); ctx.lineTo(cx, 16); ctx.stroke();

    // Red border
    rrect(ctx, 2, 2, S - 4, S - 4, R);
    ctx.strokeStyle = 'rgba(255,68,68,0.8)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ct.refresh();
  });

  // ── 무지개 ──
  const rct = scene.textures.createCanvas('special_rainbow', S, S);
  const rctx = rct.context;

  // White base
  rctx.save();
  rrect(rctx, 2, 2, S - 4, S - 4, R);
  rctx.clip();

  rctx.fillStyle = 'white';
  rctx.fillRect(0, 0, S, S);

  // Rainbow bands (diagonal)
  const rainbowHex = [0xFF1744, 0xFFC400, 0x00E676, 0x2979FF, 0xD500F9, 0x00E5FF];
  const bandW = (S + 10) / rainbowHex.length;
  rainbowHex.forEach((color, i) => {
    rctx.fillStyle = hexToCSS(color, 0.35);
    const x0 = -5 + i * bandW;
    rctx.beginPath();
    rctx.moveTo(x0, 6);
    rctx.lineTo(x0 + bandW, 6);
    rctx.lineTo(x0 + bandW - 12, S - 6);
    rctx.lineTo(x0 - 12, S - 6);
    rctx.closePath();
    rctx.fill();
  });

  // White shine ellipse
  rctx.fillStyle = 'rgba(255,255,255,0.3)';
  rctx.beginPath();
  rctx.ellipse(cx, cy - S * 0.08, S * 0.3, S * 0.175, 0, 0, Math.PI * 2);
  rctx.fill();
  rctx.fillStyle = 'rgba(255,255,255,0.5)';
  rctx.beginPath();
  rctx.ellipse(cx - S * 0.05, cy - S * 0.17, S * 0.125, S * 0.05, 0, 0, Math.PI * 2);
  rctx.fill();

  // Diamond shape center
  const d = 10;
  rctx.fillStyle = 'rgba(255,255,255,0.5)';
  rctx.beginPath();
  rctx.moveTo(cx, cy - d); rctx.lineTo(cx + d, cy); rctx.lineTo(cx, cy + d); rctx.lineTo(cx - d, cy);
  rctx.closePath();
  rctx.fill();

  rctx.restore();

  // Gold border
  rrect(rctx, 2, 2, S - 4, S - 4, R);
  rctx.strokeStyle = 'rgba(255,213,79,0.9)';
  rctx.lineWidth = 3;
  rctx.stroke();

  rct.refresh();
}

// ─── 파티클 텍스처 ──────────────────────────────

export function generateParticleTextures(scene) {
  // particle_circle
  let ct = scene.textures.createCanvas('particle_circle', 8, 8);
  let ctx = ct.context;
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.arc(4, 4, 4, 0, Math.PI * 2); ctx.fill();
  ct.refresh();

  // particle_square
  ct = scene.textures.createCanvas('particle_square', 6, 6);
  ctx = ct.context;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 6, 6);
  ct.refresh();

  // particle_spark
  ct = scene.textures.createCanvas('particle_spark', 12, 4);
  ctx = ct.context;
  ctx.fillStyle = 'white';
  rrect(ctx, 0, 0, 12, 3, 1);
  ctx.fill();
  ct.refresh();

  // particle_glow
  ct = scene.textures.createCanvas('particle_glow', 16, 16);
  ctx = ct.context;
  const glowGrad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  glowGrad.addColorStop(0, 'rgba(255,255,255,0.8)');
  glowGrad.addColorStop(0.3, 'rgba(255,255,255,0.5)');
  glowGrad.addColorStop(0.6, 'rgba(255,255,255,0.3)');
  glowGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, 16, 16);
  ct.refresh();
}

// ─── 장애물 텍스처 ──────────────────────────────

export function generateObstacleTextures(scene) {
  const obs = GAME_CONFIG.OBSTACLES;
  const mid = S / 2;

  // 얼음 frozen
  let ct = scene.textures.createCanvas('obstacle_ice_frozen', S, S);
  let ctx = ct.context;
  ctx.save();
  rrect(ctx, 2, 2, S - 4, S - 4, 12); ctx.clip();
  ctx.fillStyle = hexToCSS(obs.ice.colors.base, 0.55);
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = hexToCSS(obs.ice.colors.frost, 0.35);
  rrect(ctx, 4, 4, S - 8, S / 2 - 4, 10); ctx.fill();
  ctx.restore();
  // Crystal lines
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(10, 10); ctx.lineTo(mid, mid); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(S - 10, 10); ctx.lineTo(mid, mid); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mid, mid); ctx.lineTo(10, S - 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mid, mid); ctx.lineTo(S - 10, S - 10); ctx.stroke();
  // Sparkles
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath(); ctx.arc(mid, mid, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(14, 14, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(S - 14, 14, 2, 0, Math.PI * 2); ctx.fill();
  // Shine bar
  ctx.fillStyle = hexToCSS(obs.ice.colors.shine, 0.6);
  rrect(ctx, 10, 7, S / 4, S / 7, 4); ctx.fill();
  // Border
  rrect(ctx, 2, 2, S - 4, S - 4, 12);
  ctx.strokeStyle = hexToCSS(obs.ice.colors.border, 0.7); ctx.lineWidth = 2; ctx.stroke();
  ct.refresh();

  // 얼음 cracked
  ct = scene.textures.createCanvas('obstacle_ice_cracked', S, S);
  ctx = ct.context;
  ctx.save();
  rrect(ctx, 2, 2, S - 4, S - 4, 12); ctx.clip();
  ctx.fillStyle = hexToCSS(obs.ice.colors.crack, 0.35);
  ctx.fillRect(0, 0, S, S);
  ctx.restore();
  // Crack lines
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(mid, S * 0.2); ctx.lineTo(mid - 8, mid); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mid - 8, mid); ctx.lineTo(mid + 4, S * 0.75); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(mid - 8, mid); ctx.lineTo(S * 0.25, mid + 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mid - 8, mid); ctx.lineTo(S * 0.7, mid - 4); ctx.stroke();
  rrect(ctx, 2, 2, S - 4, S - 4, 12);
  ctx.strokeStyle = hexToCSS(obs.ice.colors.border, 0.4); ctx.lineWidth = 1.5; ctx.stroke();
  ct.refresh();

  // 체인
  ct = scene.textures.createCanvas('obstacle_chain', S, S);
  ctx = ct.context;
  ctx.strokeStyle = hexToCSS(obs.chain.colors.base, 0.85); ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(8, 8); ctx.lineTo(S - 8, S - 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(S - 8, 8); ctx.lineTo(8, S - 8); ctx.stroke();
  ctx.strokeStyle = hexToCSS(obs.chain.colors.base, 0.75); ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.moveTo(mid, 6); ctx.lineTo(mid, S - 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, mid); ctx.lineTo(S - 6, mid); ctx.stroke();
  // Link dots
  [[mid, mid], [14, 14], [S - 14, 14], [14, S - 14], [S - 14, S - 14], [mid, 8], [mid, S - 8], [8, mid], [S - 8, mid]].forEach(([nx, ny]) => {
    ctx.fillStyle = hexToCSS(obs.chain.colors.link, 0.9);
    ctx.beginPath(); ctx.arc(nx, ny, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hexToCSS(obs.chain.colors.shine, 0.5);
    ctx.beginPath(); ctx.arc(nx - 1, ny - 1, 2, 0, Math.PI * 2); ctx.fill();
  });
  rrect(ctx, 3, 3, S - 6, S - 6, 10);
  ctx.strokeStyle = hexToCSS(obs.chain.colors.dark, 0.5); ctx.lineWidth = 1.5; ctx.stroke();
  ct.refresh();

  // 나무 full
  ct = scene.textures.createCanvas('obstacle_wood_full', S, S);
  ctx = ct.context;
  ctx.save();
  rrect(ctx, 2, 2, S - 4, S - 4, 6); ctx.clip();
  ctx.fillStyle = hexToCSS(obs.wood.colors.base, 1);
  ctx.fillRect(0, 0, S, S);
  // Wood grain
  ctx.strokeStyle = hexToCSS(obs.wood.colors.grain, 0.45); ctx.lineWidth = 1;
  for (let y = 10; y < S - 8; y += 8) {
    const w = Math.sin(y * 0.3) * 3;
    ctx.beginPath(); ctx.moveTo(6, y + w); ctx.lineTo(S - 6, y - w); ctx.stroke();
  }
  // Cross planks
  ctx.strokeStyle = hexToCSS(obs.wood.colors.dark, 0.7); ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(mid, 4); ctx.lineTo(mid, S - 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4, mid); ctx.lineTo(S - 4, mid); ctx.stroke();
  // Nails
  [[14, 14], [S - 14, 14], [14, S - 14], [S - 14, S - 14]].forEach(([nx, ny]) => {
    ctx.fillStyle = hexToCSS(obs.wood.colors.nail, 0.8);
    ctx.beginPath(); ctx.arc(nx, ny, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.arc(nx - 0.5, ny - 0.5, 1.5, 0, Math.PI * 2); ctx.fill();
  });
  // Top highlight
  ctx.fillStyle = hexToCSS(obs.wood.colors.light, 0.2);
  rrect(ctx, 5, 4, S - 12, S / 2 - 8, 5); ctx.fill();
  ctx.restore();
  rrect(ctx, 2, 2, S - 4, S - 4, 6);
  ctx.strokeStyle = hexToCSS(obs.wood.colors.border, 0.85); ctx.lineWidth = 2.5; ctx.stroke();
  ct.refresh();

  // 나무 damaged
  ct = scene.textures.createCanvas('obstacle_wood_damaged', S, S);
  ctx = ct.context;
  ctx.save();
  rrect(ctx, 2, 2, S - 4, S - 4, 6); ctx.clip();
  ctx.fillStyle = hexToCSS(obs.wood.colors.light, 1);
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = hexToCSS(obs.wood.colors.grain, 0.35); ctx.lineWidth = 1;
  for (let y = 10; y < S - 8; y += 10) { ctx.beginPath(); ctx.moveTo(6, y); ctx.lineTo(S - 6, y); ctx.stroke(); }
  // Crack
  ctx.strokeStyle = hexToCSS(obs.wood.colors.dark, 0.8); ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(mid - 3, S * 0.15); ctx.lineTo(mid + 5, S * 0.55); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mid + 5, S * 0.55); ctx.lineTo(mid - 8, S * 0.85); ctx.stroke();
  ctx.strokeStyle = hexToCSS(obs.wood.colors.dark, 0.5); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(mid + 5, S * 0.55); ctx.lineTo(S * 0.75, S * 0.45); ctx.stroke();
  // Nails
  [[14, mid], [S - 14, mid]].forEach(([nx, ny]) => {
    ctx.fillStyle = hexToCSS(obs.wood.colors.nail, 0.8);
    ctx.beginPath(); ctx.arc(nx, ny, 2.5, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();
  rrect(ctx, 2, 2, S - 4, S - 4, 6);
  ctx.strokeStyle = hexToCSS(obs.wood.colors.border, 0.6); ctx.lineWidth = 2; ctx.stroke();
  ct.refresh();
}

// ─── 배경 텍스처 (JSX 딥퍼플 스타일) ─────────────

export function generateBackgroundTexture(scene) {
  const W = GAME_CONFIG.WIDTH;
  const H = GAME_CONFIG.HEIGHT;

  const ct = scene.textures.createCanvas('bg_gradient', W, H);
  const ctx = ct.context;

  // JSX background: linear-gradient(180deg, #0A0E27 0%, #0F1538 40%, #1A1145 100%)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#0A0E27');
  bgGrad.addColorStop(0.3, '#1A1145');
  bgGrad.addColorStop(0.6, '#2D1B69');
  bgGrad.addColorStop(1, '#1A1145');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Radial purple glow (center)
  const glowGrad = ctx.createRadialGradient(W / 2, H * 0.35, 0, W / 2, H * 0.35, 300);
  glowGrad.addColorStop(0, 'rgba(139,92,246,0.08)');
  glowGrad.addColorStop(1, 'rgba(139,92,246,0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle dot pattern
  ctx.fillStyle = 'rgba(255,255,255,0.008)';
  for (let py = 0; py < H; py += 40) {
    for (let px = 0; px < W; px += 40) {
      ctx.beginPath();
      ctx.arc(px + (Math.floor(py / 40) % 2 === 0 ? 0 : 20), py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Vignette
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, 0, W, 35);
  ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, 35, W, 35);
  ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(0, H - 70, W, 35);
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, H - 35, W, 35);

  ct.refresh();
}
