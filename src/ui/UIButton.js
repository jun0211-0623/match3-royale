/**
 * 통합 버튼 컴포넌트
 * 그라디언트 시뮬레이션 + 소프트 섀도 + hover/press 피드백 + 글로우 옵션
 */
export class UIButton {
  constructor(scene, x, y, width, height, options = {}) {
    const {
      text = '',
      fontSize = '26px',
      bgColor = 0x3498db,
      textColor = '#ffffff',
      radius = 14,
      shadowOffset = 4,
      depth = 0,
      onClick = null,
      glow = false,
      glowColor = 0xffffff,
    } = options;

    this.scene = scene;
    this._x = x;
    this._y = y;
    this._w = width;
    this._h = height;
    this._radius = radius;
    this._bgColor = bgColor;
    this._hoverColor = this._darken(bgColor, 0.12);
    this._pressColor = this._darken(bgColor, 0.22);
    this._shadowOffset = shadowOffset;

    // 소프트 섀도 (2겹)
    this.shadow = scene.add.graphics().setDepth(depth);
    this.shadow.fillStyle(0x000000, 0.08);
    this.shadow.fillRoundedRect(
      x - width / 2, y - height / 2 + shadowOffset + 2,
      width + 2, height + 2, radius + 2
    );
    this.shadow.fillStyle(0x000000, 0.18);
    this.shadow.fillRoundedRect(
      x - width / 2 + 1, y - height / 2 + shadowOffset,
      width, height, radius
    );

    // 본체
    this.bg = scene.add.graphics().setDepth(depth + 1);
    this._drawBg(bgColor);

    // 텍스트
    this.label = scene.add.text(x, y, text, {
      fontSize,
      fontStyle: 'bold',
      color: textColor,
    }).setOrigin(0.5).setDepth(depth + 2);

    // 투명 히트 영역
    this.hitArea = scene.add.rectangle(x, y, width, height, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 3);

    // 글로우 (선택적)
    this._glowFx = null;
    if (glow && this.hitArea.preFX) {
      this._glowFx = this.hitArea.preFX.addGlow(glowColor, 3, 0, false, 0.05, 8);
    }

    // 이벤트
    this.hitArea.on('pointerover', () => {
      this._drawBg(this._hoverColor);
    });

    this.hitArea.on('pointerout', () => {
      this._drawBg(this._bgColor);
      this.label.setPosition(x, y);
    });

    this.hitArea.on('pointerdown', () => {
      this._drawBg(this._pressColor, 2);
      this.label.setPosition(x, y + 2);
    });

    this.hitArea.on('pointerup', () => {
      this._drawBg(this._bgColor);
      this.label.setPosition(x, y);
      if (onClick) onClick();
    });
  }

  _drawBg(color, yOff = 0) {
    this.bg.clear();
    const x = this._x - this._w / 2;
    const y = this._y - this._h / 2 + yOff;
    const w = this._w;
    const h = this._h;
    const r = this._radius;

    // 메인 필
    this.bg.fillStyle(color, 1);
    this.bg.fillRoundedRect(x, y, w, h, r);

    // 상단 하이라이트 밴드
    const lighter = this._lighten(color, 0.2);
    this.bg.fillStyle(lighter, 0.3);
    this.bg.fillRoundedRect(x + 2, y + 1, w - 4, h / 2 - 2,
      { tl: r - 2, tr: r - 2, bl: 0, br: 0 });

    // 하단 다크 밴드
    const darker = this._darken(color, 0.15);
    this.bg.fillStyle(darker, 0.4);
    this.bg.fillRoundedRect(x + 2, y + h / 2, w - 4, h / 2 - 2,
      { tl: 0, tr: 0, bl: r - 2, br: r - 2 });

    // 얇은 상단 에지 라인
    this.bg.fillStyle(0xffffff, 0.15);
    this.bg.fillRoundedRect(x + 4, y + 2, w - 8, 3, 2);

    // 미세 보더
    this.bg.lineStyle(1, 0xffffff, 0.06);
    this.bg.strokeRoundedRect(x, y, w, h, r);
  }

  _darken(hex, amount) {
    const r = Math.max(0, ((hex >> 16) & 0xff) * (1 - amount)) | 0;
    const g = Math.max(0, ((hex >> 8) & 0xff) * (1 - amount)) | 0;
    const b = Math.max(0, (hex & 0xff) * (1 - amount)) | 0;
    return (r << 16) | (g << 8) | b;
  }

  _lighten(hex, amount) {
    const r = Math.min(255, ((hex >> 16) & 0xff) * (1 + amount)) | 0;
    const g = Math.min(255, ((hex >> 8) & 0xff) * (1 + amount)) | 0;
    const b = Math.min(255, (hex & 0xff) * (1 + amount)) | 0;
    return (r << 16) | (g << 8) | b;
  }

  setText(text) {
    this.label.setText(text);
  }

  setColor(color) {
    this._bgColor = color;
    this._hoverColor = this._darken(color, 0.12);
    this._pressColor = this._darken(color, 0.22);
    this._drawBg(color);
  }

  destroy() {
    if (this._glowFx && this.hitArea && this.hitArea.preFX) {
      this.hitArea.preFX.remove(this._glowFx);
    }
    [this.shadow, this.bg, this.hitArea, this.label].forEach(obj => {
      if (obj && obj.active) obj.destroy();
    });
  }
}
