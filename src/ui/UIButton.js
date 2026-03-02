/**
 * 통합 버튼 컴포넌트
 * 둥근 모서리 + 그림자 + hover/press 피드백
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

    // 그림자
    this.shadow = scene.add.graphics().setDepth(depth);
    this.shadow.fillStyle(0x000000, 0.25);
    this.shadow.fillRoundedRect(
      x - width / 2 + 2, y - height / 2 + shadowOffset,
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
    this.bg.fillStyle(color, 1);
    this.bg.fillRoundedRect(
      this._x - this._w / 2,
      this._y - this._h / 2 + yOff,
      this._w, this._h, this._radius
    );
  }

  _darken(hex, amount) {
    const r = Math.max(0, ((hex >> 16) & 0xff) * (1 - amount)) | 0;
    const g = Math.max(0, ((hex >> 8) & 0xff) * (1 - amount)) | 0;
    const b = Math.max(0, (hex & 0xff) * (1 - amount)) | 0;
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
    [this.shadow, this.bg, this.hitArea, this.label].forEach(obj => {
      if (obj && obj.active) obj.destroy();
    });
  }
}
