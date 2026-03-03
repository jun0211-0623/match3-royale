import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { SaveManager } from '../managers/SaveManager.js';
import { LevelManager } from '../managers/LevelManager.js';
import { UIButton } from '../ui/UIButton.js';
import { fadeToScene, fadeIn } from '../utils/SceneTransitions.js';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create() {
    fadeIn(this);
    const cx = GAME_CONFIG.WIDTH / 2;
    const W = GAME_CONFIG.WIDTH;
    const saveData = SaveManager.load();
    const totalLevels = LevelManager.getTotalLevels();
    const worlds = LevelManager.getWorlds();

    // ─── 스크롤 영역 계산 ─────────────────────
    const nodeSpacingY = 90;
    const headerHeight = 80;
    const mapPadTop = 160;
    const mapPadBottom = 120;
    const totalHeight = mapPadTop + totalLevels * nodeSpacingY + worlds.length * headerHeight + mapPadBottom;

    // 카메라 바운드
    this.cameras.main.setBounds(0, 0, W, totalHeight);

    // 배경 (스크롤 영역 전체)
    const bgTiles = Math.ceil(totalHeight / GAME_CONFIG.HEIGHT) + 1;
    for (let i = 0; i < bgTiles; i++) {
      this.add.image(cx, i * GAME_CONFIG.HEIGHT + GAME_CONFIG.HEIGHT / 2, 'bg_gradient');
    }

    // ─── 고정 UI (카메라 무시) ─────────────────
    const uiCam = this.cameras.add(0, 0, W, GAME_CONFIG.HEIGHT);
    uiCam.setScroll(0, 0);

    // 뒤로가기 (고정 UI → depth 높게)
    const backBtn = this.add.text(30, 30, '< 뒤로', {
      fontSize: '24px', color: '#ffffff',
    }).setInteractive({ useHandCursor: true }).setDepth(100).setScrollFactor(0);
    backBtn.on('pointerup', () => fadeToScene(this, 'Menu'));

    // 코인 (고정)
    this.add.text(W - 30, 30, `💰 ${saveData.coins}`, {
      fontSize: '22px', color: '#f1c40f',
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

    // 타이틀 (고정)
    this.add.text(cx, 80, '월드맵', {
      fontSize: '36px', fontStyle: 'bold', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    // ─── 경로 포인트 계산 (지그재그) ──────────
    const marginX = 120;
    const maxX = W - marginX;
    const points = [];
    let curY = totalHeight - mapPadBottom;

    let levelIdx = 0;
    worlds.forEach((world, wi) => {
      const levelStart = world.levels[0];
      const levelEnd = world.levels[1];
      const count = levelEnd - levelStart + 1;

      // 월드 헤더 Y
      const headerY = curY;
      curY -= headerHeight;

      // 월드 헤더
      this.add.text(cx, headerY, `${world.icon} ${world.name}`, {
        fontSize: '28px', fontStyle: 'bold', color: '#ffffff',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5);

      // 지그재그 경로로 레벨 배치
      for (let i = 0; i < count; i++) {
        const posInRow = i % 5;
        const rowIdx = Math.floor(i / 5);
        const goingRight = rowIdx % 2 === 0;

        const t = posInRow / 4;
        const x = goingRight
          ? marginX + t * (maxX - marginX)
          : maxX - t * (maxX - marginX);

        curY -= nodeSpacingY;
        points.push({ x, y: curY, level: levelStart + i, worldIdx: wi });
        levelIdx++;
      }

      curY -= 20; // 월드 간 여백
    });

    // ─── 경로 라인 (점선) ────────────────────
    const pathGfx = this.add.graphics();
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      // 같은 월드 내만 연결
      if (prev.worldIdx === cur.worldIdx) {
        this.drawDottedLine(pathGfx, prev.x, prev.y, cur.x, cur.y, 0x555577, 0.5);
      }
    }

    // ─── 레벨 노드 ──────────────────────────
    const nodeSize = 80;
    let currentLevelY = 0;

    points.forEach(({ x, y, level }, i) => {
      const isUnlocked = level <= saveData.unlockedLevel;
      const isCurrent = level === saveData.unlockedLevel;
      const stars = saveData.levelStars[level] || 0;
      const world = worlds[points[i].worldIdx];

      if (isCurrent) currentLevelY = y;

      let bgColor = 0x333344;
      if (isCurrent) bgColor = 0xe67e22;
      else if (isUnlocked && stars >= 3) bgColor = 0xf1c40f;
      else if (isUnlocked) bgColor = world.bgColor || 0x3498db;

      if (isUnlocked) {
        const btn = new UIButton(this, x, y, nodeSize, nodeSize, {
          text: `${level}`,
          fontSize: '28px',
          bgColor,
          radius: nodeSize / 2,
          shadowOffset: 3,
          glow: isCurrent,
          glowColor: 0xe67e22,
          onClick: () => fadeToScene(this, 'Game', { level }),
        });

        // 순차 등장
        [btn.bg, btn.label, btn.shadow].forEach(el => el.setAlpha(0));
        this.tweens.add({
          targets: [btn.bg, btn.label, btn.shadow, btn.hitArea],
          alpha: 1, duration: 200, delay: i * 25,
        });

        // 별
        if (stars > 0) {
          const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
          const starText = this.add.text(x, y + nodeSize / 2 + 8, starStr, {
            fontSize: '13px', color: '#f1c40f',
          }).setOrigin(0.5).setAlpha(0);
          this.tweens.add({
            targets: starText, alpha: 1, duration: 200, delay: i * 25 + 80,
          });
        }
      } else {
        // 잠긴 레벨
        const g = this.add.graphics();
        g.fillStyle(0x222233, 0.5);
        g.fillCircle(x, y, nodeSize / 2);
        g.lineStyle(1, 0x333344, 0.3);
        g.strokeCircle(x, y, nodeSize / 2);
        const lock = this.add.text(x, y, '🔒', { fontSize: '22px' }).setOrigin(0.5);

        [g, lock].forEach(el => el.setAlpha(0));
        this.tweens.add({
          targets: [g, lock], alpha: 0.7, duration: 200, delay: i * 25,
        });
      }
    });

    // ─── 현재 레벨로 스크롤 ─────────────────
    const targetScroll = Math.max(0, currentLevelY - GAME_CONFIG.HEIGHT / 2);
    this.cameras.main.setScroll(0, targetScroll);

    // ─── 드래그 스크롤 ─────────────────────
    this._dragStartY = 0;
    this._scrollStartY = 0;
    this._isDragging = false;

    this.input.on('pointerdown', (pointer) => {
      this._dragStartY = pointer.y;
      this._scrollStartY = this.cameras.main.scrollY;
      this._isDragging = true;
    });

    this.input.on('pointermove', (pointer) => {
      if (!this._isDragging || !pointer.isDown) return;
      const dy = this._dragStartY - pointer.y;
      const newScroll = Phaser.Math.Clamp(
        this._scrollStartY + dy,
        0,
        totalHeight - GAME_CONFIG.HEIGHT
      );
      this.cameras.main.setScroll(0, newScroll);
    });

    this.input.on('pointerup', () => {
      this._isDragging = false;
    });

    // UI 카메라에서 스크롤 제외
    uiCam.ignore(this.children.list.filter(c => c.scrollFactorX !== 0));
    this.cameras.main.ignore([backBtn,
      ...this.children.list.filter(c => c.scrollFactorX === 0 && c !== backBtn)
    ].filter(Boolean));
  }

  drawDottedLine(graphics, x1, y1, x2, y2, color, alpha) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dotGap = 10;
    const steps = Math.floor(dist / dotGap);

    graphics.fillStyle(color, alpha);
    for (let i = 0; i < steps; i += 2) {
      const t = i / steps;
      graphics.fillCircle(x1 + dx * t, y1 + dy * t, 2);
    }
  }
}
