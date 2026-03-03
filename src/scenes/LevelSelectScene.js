import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { SaveManager } from '../managers/SaveManager.js';
import { LevelManager } from '../managers/LevelManager.js';
import { audioManager } from '../managers/AudioManager.js';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;
    const cx = W / 2;
    const saveData = SaveManager.load();
    const totalLevels = LevelManager.getTotalLevels();
    const worlds = LevelManager.getWorlds();

    // ─── 스크롤 영역 계산 ─────────────────────
    const nodeSpacingY = 100;
    const headerHeight = 80;
    const mapPadTop = 160;
    const mapPadBottom = 140;
    const totalHeight = mapPadTop + totalLevels * nodeSpacingY + worlds.length * headerHeight + mapPadBottom;

    // 전체 DOM 컨테이너
    const container = document.createElement('div');
    container.style.cssText = `
      width:${W}px;height:${H}px;position:relative;overflow:hidden;
      font-family:'Segoe UI',system-ui,sans-serif;
      background:linear-gradient(180deg,#0A0E27 0%,#1A1145 30%,#2D1B69 60%,#1A1145 100%);
    `;

    // 스크롤 가능한 내부 영역
    const scrollArea = document.createElement('div');
    scrollArea.style.cssText = `
      width:100%;height:100%;overflow-y:auto;overflow-x:hidden;
      -webkit-overflow-scrolling:touch;
      scrollbar-width:none;
    `;

    // 스크롤바 숨기기
    const style = document.createElement('style');
    style.textContent = `
      .m3l-scroll::-webkit-scrollbar { display:none; }
      @keyframes m3l-node-pop { from { transform:scale(0);opacity:0; } to { transform:scale(1);opacity:1; } }
    `;
    container.appendChild(style);
    scrollArea.className = 'm3l-scroll';

    // 스크롤 내용물
    const content = document.createElement('div');
    content.style.cssText = `width:100%;min-height:${totalHeight}px;position:relative;padding-top:120px;`;

    // ─── 경로 및 노드 렌더링 ──────────────────
    const marginX = 120;
    const maxX = W - marginX;
    const points = [];
    let curY = totalHeight - mapPadBottom;

    worlds.forEach((world, wi) => {
      const levelStart = world.levels[0];
      const levelEnd = world.levels[1];
      const count = levelEnd - levelStart + 1;

      const headerY = curY;
      curY -= headerHeight;

      // 월드 헤더
      const hdr = document.createElement('div');
      hdr.style.cssText = `position:absolute;left:50%;transform:translateX(-50%);top:${headerY - 18}px;
        display:flex;align-items:center;gap:8px;
        background:linear-gradient(135deg,rgba(255,215,0,0.12),rgba(255,152,0,0.08));
        border:1px solid rgba(255,215,0,0.2);border-radius:20px;padding:6px 20px;`;
      hdr.innerHTML = `<span style="font-size:20px;">${world.icon}</span><span style="color:#FFD54F;font-weight:800;font-size:16px;">${world.name}</span>`;
      content.appendChild(hdr);

      for (let i = 0; i < count; i++) {
        const posInRow = i % 5;
        const rowIdx = Math.floor(i / 5);
        const goingRight = rowIdx % 2 === 0;
        const t = posInRow / 4;
        const x = goingRight ? marginX + t * (maxX - marginX) : maxX - t * (maxX - marginX);
        curY -= nodeSpacingY;
        points.push({ x, y: curY, level: levelStart + i, worldIdx: wi });
      }
      curY -= 20;
    });

    // 점선 경로 (SVG)
    let pathSVG = `<svg style="position:absolute;top:0;left:0;width:${W}px;height:${totalHeight}px;pointer-events:none;">`;
    for (let i = 1; i < points.length; i++) {
      if (points[i - 1].worldIdx === points[i].worldIdx) {
        pathSVG += `<line x1="${points[i - 1].x}" y1="${points[i - 1].y}" x2="${points[i].x}" y2="${points[i].y}" stroke="rgba(167,139,250,0.25)" stroke-width="2" stroke-dasharray="6,6"/>`;
      }
    }
    pathSVG += '</svg>';
    content.insertAdjacentHTML('beforeend', pathSVG);

    // 레벨 노드
    let currentNodeTop = 0;
    points.forEach(({ x, y, level }, i) => {
      const isUnlocked = level <= saveData.unlockedLevel;
      const isCurrent = level === saveData.unlockedLevel;
      const stars = saveData.levelStars[level] || 0;

      if (isCurrent) currentNodeTop = y;

      const nodeSize = 64;
      const node = document.createElement('div');
      node.style.cssText = `position:absolute;left:${x - nodeSize / 2}px;top:${y - nodeSize / 2}px;
        width:${nodeSize}px;height:${nodeSize}px;border-radius:50%;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        cursor:${isUnlocked ? 'pointer' : 'default'};
        animation:m3l-node-pop 0.3s ease-out ${i * 0.02}s both;
        transition:transform 0.1s;`;

      if (isUnlocked) {
        let bg, shadow, border;
        if (isCurrent) {
          bg = 'linear-gradient(135deg,#FFA726,#EF6C00)';
          shadow = '0 4px 0 #BF360C,0 6px 16px rgba(239,108,0,0.4)';
          border = '2px solid rgba(255,215,0,0.5)';
        } else if (stars >= 3) {
          bg = 'linear-gradient(135deg,#FFD54F,#FF8F00)';
          shadow = '0 4px 0 #E65100,0 6px 12px rgba(255,143,0,0.3)';
          border = '2px solid rgba(255,215,0,0.3)';
        } else {
          bg = 'linear-gradient(135deg,#42A5F5,#1565C0)';
          shadow = '0 4px 0 #0D47A1,0 6px 12px rgba(21,101,192,0.3)';
          border = '2px solid rgba(66,165,245,0.3)';
        }
        node.style.background = bg;
        node.style.boxShadow = shadow;
        node.style.border = border;
        node.innerHTML = `
          <span style="font-size:22px;font-weight:900;color:white;text-shadow:0 1px 3px rgba(0,0,0,0.3);">${level}</span>
          ${stars > 0 ? `<div style="position:absolute;bottom:-16px;display:flex;gap:1px;">${'⭐'.repeat(stars)}</div>` : ''}
        `;
        node.dataset.level = level;
        node.className = 'm3l-level-node';
      } else {
        node.style.background = 'rgba(255,255,255,0.05)';
        node.style.border = '1px solid rgba(255,255,255,0.08)';
        node.innerHTML = `<span style="font-size:18px;opacity:0.4;">🔒</span>`;
      }
      content.appendChild(node);
    });

    scrollArea.appendChild(content);
    container.appendChild(scrollArea);

    // 고정 헤더
    const header = document.createElement('div');
    header.style.cssText = `position:absolute;top:0;left:0;right:0;z-index:10;
      background:linear-gradient(180deg,#0A0E27 0%,#0A0E27 60%,transparent 100%);
      padding:20px 16px 30px;display:flex;align-items:center;justify-content:space-between;`;
    header.innerHTML = `
      <button id="m3l-back" style="background:rgba(255,255,255,0.1);border:none;border-radius:12px;padding:10px 14px;cursor:pointer;color:white;font-size:18px;">←</button>
      <span style="color:white;font-size:24px;font-weight:900;">월드맵</span>
      <div style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.4);border-radius:20px;padding:6px 14px;border:1px solid rgba(255,215,0,0.15);">
        <span style="font-size:16px;">🪙</span>
        <span style="color:#FFD54F;font-weight:800;font-size:14px;font-family:monospace;">${saveData.coins.toLocaleString()}</span>
      </div>
    `;
    container.appendChild(header);

    // DOM에 추가
    this.domUI = this.add.dom(cx, H / 2, container);

    // 페이드 인
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.3s ease';
    this.time.delayedCall(50, () => { container.style.opacity = '1'; });

    // 현재 레벨로 스크롤
    this.time.delayedCall(100, () => {
      const scrollTarget = Math.max(0, currentNodeTop - H / 2);
      scrollArea.scrollTop = totalHeight - scrollTarget - H;
    });

    // 뒤로가기
    container.querySelector('#m3l-back').addEventListener('pointerup', () => {
      if (this._nav) return;
      this._nav = true;
      container.style.opacity = '0';
      this.time.delayedCall(300, () => this.scene.start('Menu'));
    });

    // 레벨 노드 클릭
    content.addEventListener('pointerup', (e) => {
      const node = e.target.closest('.m3l-level-node');
      if (!node || this._nav) return;
      const level = parseInt(node.dataset.level);
      if (!level || level > saveData.unlockedLevel) return;
      this._nav = true;
      audioManager.playClick();
      container.style.opacity = '0';
      this.time.delayedCall(300, () => this.scene.start('Game', { level }));
    });
  }
}
