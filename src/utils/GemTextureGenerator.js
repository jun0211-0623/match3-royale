import { GAME_CONFIG } from '../config.js';

const S = GAME_CONFIG.BOARD.GEM_SIZE; // 72

/** 기본 젬 본체 그리기 (공통) */
function drawGemBase(g, p) {
  // 그림자 (오른쪽 아래 오프셋)
  g.fillStyle(p.dark, 0.5);
  g.fillRoundedRect(3, 5, S - 6, S - 5, 12);

  // 본체
  g.fillStyle(p.base, 1);
  g.fillRoundedRect(2, 2, S - 6, S - 6, 12);

  // 하단 어둡게 (입체감)
  g.fillStyle(0x000000, 0.12);
  g.fillRoundedRect(4, S / 2, S - 10, S / 2 - 6, { tl: 0, tr: 0, bl: 10, br: 10 });

  // 상단 하이라이트
  g.fillStyle(p.light, 0.4);
  g.fillRoundedRect(6, 4, S - 14, S / 2 - 10, { tl: 10, tr: 10, bl: 4, br: 4 });

  // 반짝임 점 (좌상단)
  g.fillStyle(p.shine, 0.6);
  g.fillRoundedRect(10, 7, S / 3.5, S / 6, 4);

  // 테두리
  g.lineStyle(1.5, 0xffffff, 0.12);
  g.strokeRoundedRect(2, 2, S - 6, S - 6, 12);
}

/** 일반 젬 텍스처 6색 생성 */
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

/** 특수 블록 텍스처 생성 */
export function generateSpecialTextures(scene) {
  const colors = GAME_CONFIG.COLORS;
  const g = scene.add.graphics();

  // ─── 로켓 (가로/세로 × 6색) ─────────────────
  colors.forEach((colorName) => {
    const p = GAME_CONFIG.COLOR_PALETTE[colorName];

    ['h', 'v'].forEach((dir) => {
      g.clear();
      drawGemBase(g, p);

      // 방향 스트라이프 (밝은 반투명)
      g.fillStyle(0xffffff, 0.25);
      if (dir === 'h') {
        g.fillRect(6, S / 2 - 5, S - 12, 10);
      } else {
        g.fillRect(S / 2 - 5, 6, 10, S - 12);
      }

      // 화살표 (양 끝)
      g.fillStyle(0xffffff, 0.85);
      if (dir === 'h') {
        g.fillTriangle(8, S / 2, 18, S / 2 - 8, 18, S / 2 + 8);
        g.fillTriangle(S - 8, S / 2, S - 18, S / 2 - 8, S - 18, S / 2 + 8);
      } else {
        g.fillTriangle(S / 2, 8, S / 2 - 8, 18, S / 2 + 8, 18);
        g.fillTriangle(S / 2, S - 8, S / 2 - 8, S - 18, S / 2 + 8, S - 18);
      }

      // 강조 테두리
      g.lineStyle(2, 0xffffff, 0.5);
      g.strokeRoundedRect(2, 2, S - 6, S - 6, 12);

      g.generateTexture(`special_rocket_${dir}_${colorName}`, S, S);
    });
  });

  // ─── 폭탄 (6색) ──────────────────────────────
  colors.forEach((colorName) => {
    const p = GAME_CONFIG.COLOR_PALETTE[colorName];
    g.clear();
    drawGemBase(g, p);

    const cx = S / 2, cy = S / 2;

    // 방사선 (8방향)
    g.lineStyle(2.5, 0xffffff, 0.7);
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const innerR = 7;
      const outerR = S / 2 - 10;
      g.lineBetween(
        cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR,
        cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR
      );
    }

    // 중앙 원
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(cx, cy, 6);

    // 위험 테두리 (빨강)
    g.lineStyle(2.5, 0xff4444, 0.85);
    g.strokeRoundedRect(2, 2, S - 6, S - 6, 12);

    g.generateTexture(`special_bomb_${colorName}`, S, S);
  });

  // ─── 무지개 ──────────────────────────────────
  g.clear();

  // 하얀 크리스탈 베이스
  g.fillStyle(0xeeeeff, 0.4);
  g.fillRoundedRect(3, 5, S - 6, S - 5, 12);
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(2, 2, S - 6, S - 6, 12);

  // 무지개 밴드 (대각선)
  const rainbowColors = [0xe74c3c, 0xf39c12, 0xf1c40f, 0x2ecc71, 0x3498db, 0x9b59b6];
  const bandW = (S - 12) / rainbowColors.length;
  rainbowColors.forEach((color, i) => {
    g.fillStyle(color, 0.3);
    g.fillRect(6 + i * bandW, 6, bandW, S - 12);
  });

  // 광택 오버레이
  g.fillStyle(0xffffff, 0.35);
  g.fillRoundedRect(6, 4, S - 14, S / 2 - 10, { tl: 10, tr: 10, bl: 4, br: 4 });

  // 반짝임 점
  g.fillStyle(0xffffff, 0.7);
  g.fillRoundedRect(10, 7, S / 3.5, S / 6, 4);

  // 골드 테두리
  g.lineStyle(2.5, 0xf1c40f, 0.9);
  g.strokeRoundedRect(2, 2, S - 6, S - 6, 12);

  g.generateTexture('special_rainbow', S, S);

  g.destroy();
}
