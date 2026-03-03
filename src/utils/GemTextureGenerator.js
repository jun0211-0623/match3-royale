import { GAME_CONFIG } from '../config.js';

const S = GAME_CONFIG.BOARD.GEM_SIZE; // 72

// ─── 유틸리티 ────────────────────────────────────

function lerpColor(c1, c2, t) {
  const r = ((c1 >> 16) & 0xff) + (((c2 >> 16) & 0xff) - ((c1 >> 16) & 0xff)) * t;
  const g = ((c1 >> 8) & 0xff) + (((c2 >> 8) & 0xff) - ((c1 >> 8) & 0xff)) * t;
  const b = (c1 & 0xff) + ((c2 & 0xff) - (c1 & 0xff)) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}

// ─── 10+ 레이어 젬 본체 ─────────────────────────

function drawGemBase(g, p) {
  // 1. 드롭 섀도 (부드러운 오프셋)
  g.fillStyle(p.darker, 0.35);
  g.fillRoundedRect(4, 6, S - 6, S - 5, 14);

  // 2. 아우터 베벨 (깊이감 외곽 링)
  g.fillStyle(p.darker, 0.7);
  g.fillRoundedRect(1, 1, S - 4, S - 4, 14);

  // 3. 메인 바디
  g.fillStyle(p.base, 1);
  g.fillRoundedRect(3, 3, S - 8, S - 8, 12);

  // 4. 하단 그라디언트 시뮬레이션 (4밴드 base→dark)
  const bandH = (S - 12) / 4;
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    const color = lerpColor(p.base, p.dark, t);
    const alpha = 0.1 + t * 0.25;
    g.fillStyle(color, alpha);
    g.fillRect(6, 5 + S / 2 + i * (bandH / 2), S - 14, bandH / 2 + 1);
  }

  // 5. 상단 그라디언트 (lighter→light 반투명)
  g.fillStyle(p.lighter, 0.35);
  g.fillRoundedRect(5, 4, S - 12, S / 2 - 8, { tl: 10, tr: 10, bl: 4, br: 4 });
  g.fillStyle(p.light, 0.15);
  g.fillRoundedRect(5, 4, S - 12, S / 2 - 4, { tl: 10, tr: 10, bl: 6, br: 6 });

  // 6. 내부 하이라이트 (인너 글로우)
  g.fillStyle(p.light, 0.12);
  g.fillRoundedRect(8, 8, S - 18, S - 18, 8);

  // 7. 글로시 하이라이트 (유리 반사 — 타원)
  g.fillStyle(p.rim, 0.3);
  g.fillEllipse(S * 0.38, S * 0.32, S * 0.48, S * 0.26);

  // 8. 메인 샤인 스팟
  g.fillStyle(0xffffff, 0.5);
  g.fillRoundedRect(12, 8, S / 4, S / 7, 5);

  // 9. 서브 샤인 도트
  g.fillStyle(0xffffff, 0.25);
  g.fillCircle(16, 22, 2.5);

  // 10. 림 라이트 (하단 우측 반사)
  g.fillStyle(p.light, 0.12);
  g.fillRoundedRect(S / 2, S - 15, S / 2 - 10, 5, { tl: 0, tr: 0, bl: 4, br: 4 });

  // 11. 미세 보더
  g.lineStyle(1, 0xffffff, 0.06);
  g.strokeRoundedRect(3, 3, S - 8, S - 8, 12);
}

// ─── 일반 젬 텍스처 6색 생성 ─────────────────────

export function generateGemTextures(scene) {
  const colors = GAME_CONFIG.COLORS;
  const g = scene.add.graphics();

  colors.forEach((colorName) => {
    const p = GAME_CONFIG.COLOR_PALETTE[colorName];
    g.clear();
    drawGemBase(g, p);
    g.generateTexture(`gem_${colorName}`, S, S);
  });

  g.destroy();
}

// ─── 특수 블록 텍스처 생성 ───────────────────────

export function generateSpecialTextures(scene) {
  const colors = GAME_CONFIG.COLORS;
  const g = scene.add.graphics();

  // ─── 로켓 (가로/세로 × 6색) ─────────────────
  colors.forEach((colorName) => {
    const p = GAME_CONFIG.COLOR_PALETTE[colorName];

    ['h', 'v'].forEach((dir) => {
      g.clear();
      drawGemBase(g, p);

      // 3겹 그라디언트 스트릭 (넓은→좁은, 투명→밝은)
      const stripes = [
        { w: 16, a: 0.12 },
        { w: 10, a: 0.2 },
        { w: 4, a: 0.35 },
      ];
      stripes.forEach(({ w, a }) => {
        g.fillStyle(0xffffff, a);
        if (dir === 'h') {
          g.fillRect(6, S / 2 - w / 2, S - 12, w);
        } else {
          g.fillRect(S / 2 - w / 2, 6, w, S - 12);
        }
      });

      // 화살표 (양 끝, 더 큰 22px)
      g.fillStyle(0xffffff, 0.85);
      if (dir === 'h') {
        g.fillTriangle(6, S / 2, 20, S / 2 - 10, 20, S / 2 + 10);
        g.fillTriangle(S - 6, S / 2, S - 20, S / 2 - 10, S - 20, S / 2 + 10);
      } else {
        g.fillTriangle(S / 2, 6, S / 2 - 10, 20, S / 2 + 10, 20);
        g.fillTriangle(S / 2, S - 6, S / 2 - 10, S - 20, S / 2 + 10, S - 20);
      }

      // 배기 도트 (양 끝)
      g.fillStyle(0xffffff, 0.35);
      if (dir === 'h') {
        g.fillCircle(10, S / 2, 2);
        g.fillCircle(S - 10, S / 2, 2);
      } else {
        g.fillCircle(S / 2, 10, 2);
        g.fillCircle(S / 2, S - 10, 2);
      }

      // 이중 보더
      g.lineStyle(1.5, 0xffffff, 0.45);
      g.strokeRoundedRect(2, 2, S - 6, S - 6, 12);
      g.lineStyle(1, p.light, 0.3);
      g.strokeRoundedRect(4, 4, S - 10, S - 10, 10);

      g.generateTexture(`special_rocket_${dir}_${colorName}`, S, S);
    });
  });

  // ─── 폭탄 (6색) ──────────────────────────────
  colors.forEach((colorName) => {
    const p = GAME_CONFIG.COLOR_PALETTE[colorName];
    g.clear();
    drawGemBase(g, p);

    const cx = S / 2, cy = S / 2;

    // 12방향 방사선 (교대 두께)
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const thick = i % 2 === 0;
      g.lineStyle(thick ? 2.5 : 1.5, 0xffffff, thick ? 0.65 : 0.4);
      const innerR = 7;
      const outerR = thick ? S / 2 - 8 : S / 2 - 14;
      g.lineBetween(
        cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR,
        cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR
      );
    }

    // 3중 동심원 (외→내)
    g.fillStyle(0xffffff, 0.15);
    g.fillCircle(cx, cy, 10);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(cx, cy, 7);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(cx, cy, 4);

    // 퓨즈 스파크 (상단)
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(cx, 7, 2.5);
    g.lineStyle(1.5, 0xffffff, 0.5);
    g.lineBetween(cx, 10, cx, 16);

    // 이중 위험 보더
    g.lineStyle(2.5, 0xff4444, 0.8);
    g.strokeRoundedRect(2, 2, S - 6, S - 6, 12);
    g.lineStyle(1, 0xff8800, 0.35);
    g.strokeRoundedRect(4, 4, S - 10, S - 10, 10);

    g.generateTexture(`special_bomb_${colorName}`, S, S);
  });

  // ─── 무지개 ──────────────────────────────────
  g.clear();

  // 하얀 크리스탈 베이스
  g.fillStyle(0xddddef, 0.4);
  g.fillRoundedRect(4, 6, S - 6, S - 5, 14);
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(3, 3, S - 8, S - 8, 12);

  // 대각선 무지개 밴드 + 구분선
  const rainbowColors = [0xe74c3c, 0xf39c12, 0xf1c40f, 0x2ecc71, 0x3498db, 0x9b59b6];
  const bandW = (S + 10) / rainbowColors.length;
  rainbowColors.forEach((color, i) => {
    g.fillStyle(color, 0.35);
    const x0 = -5 + i * bandW;
    // 대각선 평행사변형
    g.fillTriangle(x0, 6, x0 + bandW, 6, x0 + bandW - 12, S - 6);
    g.fillTriangle(x0, 6, x0 + bandW - 12, S - 6, x0 - 12, S - 6);
    // 구분선
    if (i > 0) {
      g.lineStyle(0.5, 0xffffff, 0.2);
      g.lineBetween(x0, 6, x0 - 12, S - 6);
    }
  });

  // 별 방사 패턴 (중앙에서 6방향)
  const ccx = S / 2, ccy = S / 2;
  g.lineStyle(1, 0xffffff, 0.3);
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6;
    const len = S / 3;
    g.lineBetween(ccx, ccy, ccx + Math.cos(angle) * len, ccy + Math.sin(angle) * len);
  }

  // 이중 광택 오버레이
  g.fillStyle(0xffffff, 0.3);
  g.fillRoundedRect(5, 4, S - 12, S / 2 - 8, { tl: 10, tr: 10, bl: 4, br: 4 });
  g.fillStyle(0xffffff, 0.5);
  g.fillRoundedRect(12, 8, S / 4, S / 7, 5);

  // 중앙 다이아몬드
  g.fillStyle(0xffffff, 0.45);
  const d = 10;
  g.fillTriangle(ccx, ccy - d, ccx + d, ccy, ccx, ccy + d);
  g.fillTriangle(ccx, ccy - d, ccx - d, ccy, ccx, ccy + d);

  // 두꺼운 골드 보더 + 내부 보더
  g.lineStyle(3, 0xf1c40f, 0.9);
  g.strokeRoundedRect(2, 2, S - 6, S - 6, 12);
  g.lineStyle(1, 0xffd700, 0.4);
  g.strokeRoundedRect(4, 4, S - 10, S - 10, 10);

  g.generateTexture('special_rainbow', S, S);

  g.destroy();
}

// ─── 파티클 텍스처 생성 ─────────────────────────

export function generateParticleTextures(scene) {
  const g = scene.add.graphics();

  // 소프트 원 (8×8)
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(4, 4, 4);
  g.generateTexture('particle_circle', 8, 8);

  // 사각 (6×6)
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 0, 6, 6);
  g.generateTexture('particle_square', 6, 6);

  // 스파크 (12×4)
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(0, 0, 12, 3, 1);
  g.generateTexture('particle_spark', 12, 4);

  // 소프트 글로우 (16×16, 3겹 원)
  g.clear();
  g.fillStyle(0xffffff, 0.3);
  g.fillCircle(8, 8, 8);
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(8, 8, 5);
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(8, 8, 2);
  g.generateTexture('particle_glow', 16, 16);

  g.destroy();
}

// ─── 장애물 텍스처 생성 ─────────────────────────

export function generateObstacleTextures(scene) {
  const g = scene.add.graphics();
  const obs = GAME_CONFIG.OBSTACLES;

  // ── 얼음 (frozen: 2레이어) ──
  g.clear();
  g.fillStyle(obs.ice.colors.base, 0.5);
  g.fillRoundedRect(2, 2, S - 4, S - 4, 12);
  // 서리 패턴
  g.fillStyle(obs.ice.colors.frost, 0.3);
  g.fillRoundedRect(4, 4, S - 8, S / 2 - 4, { tl: 10, tr: 10, bl: 2, br: 2 });
  // 대각 서리 라인
  g.lineStyle(1.5, 0xffffff, 0.35);
  g.lineBetween(10, 10, S / 2, S / 2);
  g.lineBetween(S - 10, 10, S / 2, S / 2);
  g.lineBetween(S / 2, S / 2, 10, S - 10);
  g.lineBetween(S / 2, S / 2, S - 10, S - 10);
  // 빙결 결정 도트
  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(S / 2, S / 2, 3);
  g.fillCircle(14, 14, 2);
  g.fillCircle(S - 14, 14, 2);
  // 샤인
  g.fillStyle(obs.ice.colors.shine, 0.55);
  g.fillRoundedRect(10, 7, S / 4, S / 7, 4);
  // 보더
  g.lineStyle(2, obs.ice.colors.border, 0.6);
  g.strokeRoundedRect(2, 2, S - 4, S - 4, 12);
  g.generateTexture('obstacle_ice_frozen', S, S);

  // ── 얼음 (cracked: 1레이어) ──
  g.clear();
  g.fillStyle(obs.ice.colors.crack, 0.35);
  g.fillRoundedRect(2, 2, S - 4, S - 4, 12);
  // 균열 라인
  g.lineStyle(2, 0xffffff, 0.7);
  g.lineBetween(S / 2, S * 0.2, S / 2 - 8, S / 2);
  g.lineBetween(S / 2 - 8, S / 2, S / 2 + 4, S * 0.75);
  g.lineStyle(1.5, 0xffffff, 0.5);
  g.lineBetween(S / 2 - 8, S / 2, S * 0.25, S / 2 + 6);
  g.lineBetween(S / 2 - 8, S / 2, S * 0.7, S / 2 - 4);
  // 파편 도트
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(S * 0.3, S * 0.3, 2);
  g.fillCircle(S * 0.65, S * 0.6, 1.5);
  // 보더
  g.lineStyle(1.5, obs.ice.colors.border, 0.4);
  g.strokeRoundedRect(2, 2, S - 4, S - 4, 12);
  g.generateTexture('obstacle_ice_cracked', S, S);

  // ── 체인 ──
  g.clear();
  // 체인 X패턴 링크
  const mid = S / 2;
  // 대각선 체인
  g.lineStyle(4, obs.chain.colors.base, 0.85);
  g.lineBetween(8, 8, S - 8, S - 8);
  g.lineBetween(S - 8, 8, 8, S - 8);
  // 십자 체인
  g.lineStyle(3.5, obs.chain.colors.base, 0.75);
  g.lineBetween(mid, 6, mid, S - 6);
  g.lineBetween(6, mid, S - 6, mid);
  // 링크 노드 (교차점)
  const nodes = [[mid, mid], [14, 14], [S - 14, 14], [14, S - 14], [S - 14, S - 14], [mid, 8], [mid, S - 8], [8, mid], [S - 8, mid]];
  nodes.forEach(([nx, ny]) => {
    g.fillStyle(obs.chain.colors.link, 0.9);
    g.fillCircle(nx, ny, 4);
    g.fillStyle(obs.chain.colors.shine, 0.5);
    g.fillCircle(nx - 1, ny - 1, 2);
  });
  // 어둡게 테두리
  g.lineStyle(1.5, obs.chain.colors.dark, 0.5);
  g.strokeRoundedRect(3, 3, S - 6, S - 6, 10);
  g.generateTexture('obstacle_chain', S, S);

  // ── 나무상자 (full: 2레이어) ──
  g.clear();
  // 메인 나무 바디
  g.fillStyle(obs.wood.colors.base, 1);
  g.fillRoundedRect(2, 2, S - 4, S - 4, 6);
  // 나무결 가로 라인
  g.lineStyle(1, obs.wood.colors.grain, 0.45);
  for (let y = 10; y < S - 8; y += 8) {
    const wobble = Math.sin(y * 0.3) * 3;
    g.lineBetween(6, y + wobble, S - 6, y - wobble);
  }
  // 십자 판자 라인
  g.lineStyle(2.5, obs.wood.colors.dark, 0.7);
  g.lineBetween(mid, 4, mid, S - 4);
  g.lineBetween(4, mid, S - 4, mid);
  // 못 4개 (모서리)
  [[14, 14], [S - 14, 14], [14, S - 14], [S - 14, S - 14]].forEach(([nx, ny]) => {
    g.fillStyle(obs.wood.colors.nail, 0.8);
    g.fillCircle(nx, ny, 3);
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(nx - 0.5, ny - 0.5, 1.5);
  });
  // 하이라이트
  g.fillStyle(obs.wood.colors.light, 0.2);
  g.fillRoundedRect(5, 4, S - 12, S / 2 - 8, { tl: 5, tr: 5, bl: 2, br: 2 });
  // 보더
  g.lineStyle(2.5, obs.wood.colors.border, 0.85);
  g.strokeRoundedRect(2, 2, S - 4, S - 4, 6);
  g.generateTexture('obstacle_wood_full', S, S);

  // ── 나무상자 (damaged: 1레이어) ──
  g.clear();
  g.fillStyle(obs.wood.colors.light, 1);
  g.fillRoundedRect(2, 2, S - 4, S - 4, 6);
  // 나무결
  g.lineStyle(1, obs.wood.colors.grain, 0.35);
  for (let y = 10; y < S - 8; y += 10) {
    g.lineBetween(6, y, S - 6, y);
  }
  // 균열
  g.lineStyle(2.5, obs.wood.colors.dark, 0.8);
  g.lineBetween(mid - 3, S * 0.15, mid + 5, S * 0.55);
  g.lineBetween(mid + 5, S * 0.55, mid - 8, S * 0.85);
  g.lineStyle(1.5, obs.wood.colors.dark, 0.5);
  g.lineBetween(mid + 5, S * 0.55, S * 0.75, S * 0.45);
  // 못 2개
  [[14, mid], [S - 14, mid]].forEach(([nx, ny]) => {
    g.fillStyle(obs.wood.colors.nail, 0.8);
    g.fillCircle(nx, ny, 2.5);
  });
  // 보더 (깨진)
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

  // 세로 그라디언트 (네이비 → 다크 퍼플) — 20밴드
  const steps = 20;
  const bandH = Math.ceil(H / steps);
  const topColor = { r: 10, g: 10, b: 30 };
  const bottomColor = { r: 28, g: 12, b: 50 };

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = Math.round(topColor.r + (bottomColor.r - topColor.r) * t);
    const gv = Math.round(topColor.g + (bottomColor.g - topColor.g) * t);
    const b = Math.round(topColor.b + (bottomColor.b - topColor.b) * t);
    const color = (r << 16) | (gv << 8) | b;
    g.fillStyle(color, 1);
    g.fillRect(0, i * bandH, W, bandH + 1);
  }

  // 미세한 도트 패턴 오버레이
  g.fillStyle(0xffffff, 0.012);
  for (let py = 0; py < H; py += 40) {
    for (let px = 0; px < W; px += 40) {
      g.fillCircle(px + (Math.floor(py / 40) % 2 === 0 ? 0 : 20), py, 1.5);
    }
  }

  // 상단 비네트
  g.fillStyle(0x000000, 0.12);
  g.fillRect(0, 0, W, 50);
  g.fillStyle(0x000000, 0.06);
  g.fillRect(0, 50, W, 50);

  // 하단 비네트
  g.fillStyle(0x000000, 0.06);
  g.fillRect(0, H - 80, W, 40);
  g.fillStyle(0x000000, 0.15);
  g.fillRect(0, H - 40, W, 40);

  g.generateTexture('bg_gradient', W, H);
  g.destroy();
}
