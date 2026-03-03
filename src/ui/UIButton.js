/**
 * JSX 스타일 3D 버튼 컴포넌트
 * 하단 색상 바 + 상단 하이라이트 오버레이 + 프레스 피드백
 */
export class UIButton {
  constructor(scene, x, y, width, height, options = {}) {
    const {
      text = '',
      fontSize = '26px',
      bgColor = 0x3498db,
      textColor = '#ffffff',
      radius = 16,
      shadowOffset = 5,
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
    this._shadowOffset = shadowOffset;
    this._shadowColor = this._darken(bgColor, 0.4);

    // 하단 3D 섀도 바
    this.shadow = scene.add.graphics().setDepth(depth);
    this.shadow.fillStyle(this._shadowColor, 1);
    this.shadow.fillRoundedRect(
      x - width / 2, y - height / 2 + shadowOffset,
      width, height, radius
    );
    // 추가 소프트 섀도
    this.shadow.fillStyle(0x000000, 0.15);
    this.shadow.fillRoundedRect(
      x - width / 2, y - height / 2 + shadowOffset + 3,
      width + 2, height + 2, radius + 2
    );

    // 본체
    this.bg = scene.add.graphics().setDepth(depth + 1);
    this._drawBg(bgColor, 0);

    // 텍스트
    this.label = scene.add.text(x, y, text, {
      fontSize,
      fontStyle: 'bold',
      color: textColor,
    }).setOrigin(0.5).setDepth(depth + 2);
    // 텍스트 그림자
    this.label.setShadow(0, 2, 'rgba(0,0,0,0.3)', 4);

    // 투명 히트 영역
    this.hitArea = scene.add.rectangle(x, y, width, height + shadowOffset, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 3);

    // 글로우
    this._glowFx = null;
    if (glow && this.hitArea.preFX) {
      this._glowFx = this.hitArea.preFX.addGlow(glowColor, 3, 0, false, 0.05, 8);
    }

    // 이벤트
    this.hitArea.on('pointerover', () => {
      this._drawBg(this._lighten(this._bgColor, 0.08), 0);
    });

    this.hitArea.on('pointerout', () => {
      this._drawBg(this._bgColor, 0);
      this.label.setPosition(x, y);
    });

    this.hitArea.on('pointerdown', () => {
      this._drawBg(this._bgColor, shadowOffset - 1);
      this.label.setPosition(x, y + shadowOffset - 1);
    });

    this.hitArea.on('pointerup', () => {
      this._drawBg(this._bgColor, 0);
      this.label.setPosition(x, y);
      if (onClick) onClick();
    });
  }

  _drawBg(color, yOff) {
    this.bg.clear();
    const x = this._x - this._w / 2;
    const y = this._y - this._h / 2 + yOff;
    const w = this._w;
    const h = this._h;
    const r = this._radius;

    // 메인 바디 (3-stop 그라데이션 시뮬)
    const lighter = this._lighten(color, 0.15);
    const darker = this._darken(color, 0.2);

    // 상단 밝은 영역
    this.bg.fillStyle(lighter, 1);
    this.bg.fillRoundedRect(x, y, w, h, r);

    // 중간 메인 색상
    this.bg.fillStyle(color, 1);
    this.bg.fillRoundedRect(x, y + h * 0.3, w, h * 0.7, { tl: 0, tr: 0, bl: r, br: r });

    // 하단 어두운 영역
    this.bg.fillStyle(darker, 0.6);
    this.bg.fillRoundedRect(x, y + h * 0.65, w, h * 0.35, { tl: 0, tr: 0, bl: r, br: r });

    // 상단 하이라이트 오버레이 (유리 반사)
    this.bg.fillStyle(0xffffff, 0.15);
    this.bg.fillRoundedRect(x, y, w, h * 0.5, { tl: r, tr: r, bl: 0, br: 0 });

    // 얇은 상단 에지 라인
    this.bg.fillStyle(0xffffff, 0.2);
    this.bg.fillRoundedRect(x + 4, y + 2, w - 8, 3, 2);
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
    this._shadowColor = this._darken(color, 0.4);
    this.shadow.clear();
    this.shadow.fillStyle(this._shadowColor, 1);
    this.shadow.fillRoundedRect(
      this._x - this._w / 2, this._y - this._h / 2 + this._shadowOffset,
      this._w, this._h, this._radius
    );
    this._drawBg(color, 0);
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
