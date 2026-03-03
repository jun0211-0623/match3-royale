/**
 * Web Audio API 기반 사운드 매니저
 * 외부 오디오 파일 없이 합성음으로 효과음 생성
 * 모바일 오디오 자동재생 정책 대응 (첫 인터랙션 시 unlock)
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.soundOn = true;
    this.bgmOn = true;
    this.bgmOsc = null;
    this.bgmGain = null;
    this._unlocked = false;

    this._loadSettings();
  }

  _loadSettings() {
    try {
      const s = localStorage.getItem('match3_soundOn');
      if (s !== null) this.soundOn = s === 'true';
      const b = localStorage.getItem('match3_bgmOn');
      if (b !== null) this.bgmOn = b === 'true';
    } catch (e) { /* ignore */ }
  }

  _saveSettings() {
    try {
      localStorage.setItem('match3_soundOn', String(this.soundOn));
      localStorage.setItem('match3_bgmOn', String(this.bgmOn));
    } catch (e) { /* ignore */ }
  }

  /** 첫 사용자 인터랙션 시 호출 (모바일 unlock) */
  unlock() {
    if (this._unlocked) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this._unlocked = true;
    } catch (e) {
      console.warn('AudioManager: WebAudio not available');
    }
  }

  _ensureCtx() {
    if (!this.ctx) this.unlock();
    return this.ctx;
  }

  // ─── 효과음 합성 ─────────────────────────────

  /** 매치 사운드 (콤보에 따라 피치 상승) */
  playMatch(combo = 1) {
    if (!this.soundOn) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;

    const baseFreq = 440 + (combo - 1) * 80; // C5 ~ 콤보마다 상승
    this._playTone(baseFreq, 0.12, 'sine', 0.3);
    this._playTone(baseFreq * 1.25, 0.1, 'sine', 0.2, 0.06);
  }

  /** 특수블록 생성 사운드 */
  playSpecialCreate() {
    if (!this.soundOn) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;

    this._playTone(600, 0.08, 'square', 0.15);
    this._playTone(800, 0.1, 'sine', 0.2, 0.08);
    this._playTone(1000, 0.12, 'sine', 0.15, 0.16);
  }

  /** 특수블록 폭발 사운드 */
  playSpecialExplode() {
    if (!this.soundOn) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;

    this._playNoise(0.2, 0.3);
    this._playTone(200, 0.15, 'sawtooth', 0.2);
    this._playTone(100, 0.25, 'sine', 0.15, 0.1);
  }

  /** 스와이프 사운드 */
  playSwipe() {
    if (!this.soundOn) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;

    this._playTone(300, 0.05, 'sine', 0.1);
  }

  /** 잘못된 스와이프 */
  playInvalidSwap() {
    if (!this.soundOn) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;

    this._playTone(200, 0.1, 'square', 0.15);
    this._playTone(150, 0.1, 'square', 0.12, 0.1);
  }

  /** 레벨 클리어 */
  playClear() {
    if (!this.soundOn) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;

    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      this._playTone(freq, 0.2, 'sine', 0.25, i * 0.12);
    });
  }

  /** 레벨 실패 */
  playFail() {
    if (!this.soundOn) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;

    this._playTone(300, 0.3, 'sine', 0.2);
    this._playTone(250, 0.4, 'sine', 0.15, 0.2);
  }

  /** 버튼 클릭 */
  playClick() {
    if (!this.soundOn) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;

    this._playTone(800, 0.04, 'sine', 0.12);
  }

  /** 코인 획득 */
  playCoin() {
    if (!this.soundOn) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;

    this._playTone(1200, 0.06, 'sine', 0.15);
    this._playTone(1600, 0.08, 'sine', 0.12, 0.06);
  }

  // ─── 장애물 사운드 ────────────────────────────

  /** 얼음 깨짐 */
  playIceCrack() {
    if (!this.soundOn) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;
    this._playTone(2000, 0.08, 'sine', 0.15);
    this._playTone(3000, 0.05, 'sine', 0.1, 0.03);
  }

  /** 체인 끊김 */
  playChainBreak() {
    if (!this.soundOn) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;
    this._playNoise(0.1, 0.15);
    this._playTone(400, 0.08, 'sawtooth', 0.12);
  }

  /** 나무 부서짐 */
  playWoodSmash() {
    if (!this.soundOn) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;
    this._playNoise(0.15, 0.2);
    this._playTone(150, 0.12, 'sawtooth', 0.15);
  }

  // ─── BGM (단순 루프) ──────────────────────────

  startBGM() {
    if (!this.bgmOn) return;
    const ctx = this._ensureCtx();
    if (!ctx || this.bgmOsc) return;

    // 간단한 앰비언트 BGM (저음 드론)
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.value = 0.04;
    this.bgmGain.connect(ctx.destination);

    this.bgmOsc = ctx.createOscillator();
    this.bgmOsc.type = 'sine';
    this.bgmOsc.frequency.value = 110; // A2

    // LFO로 미세한 변화
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.5;
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(this.bgmOsc.frequency);
    lfo.start();
    this._bgmLfo = lfo;

    this.bgmOsc.connect(this.bgmGain);
    this.bgmOsc.start();
  }

  stopBGM() {
    if (this.bgmOsc) {
      try { this.bgmOsc.stop(); } catch (e) { /* ignore */ }
      this.bgmOsc = null;
    }
    if (this._bgmLfo) {
      try { this._bgmLfo.stop(); } catch (e) { /* ignore */ }
      this._bgmLfo = null;
    }
    this.bgmGain = null;
  }

  // ─── 토글 ────────────────────────────────────

  toggleSound() {
    this.soundOn = !this.soundOn;
    this._saveSettings();
    return this.soundOn;
  }

  toggleBGM() {
    this.bgmOn = !this.bgmOn;
    if (this.bgmOn) {
      this.startBGM();
    } else {
      this.stopBGM();
    }
    this._saveSettings();
    return this.bgmOn;
  }

  // ─── 내부 헬퍼 ───────────────────────────────

  _playTone(freq, duration, type = 'sine', volume = 0.2, delay = 0) {
    const ctx = this.ctx;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.01);
  }

  _playNoise(duration, volume = 0.1) {
    const ctx = this.ctx;
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }
}

/** 싱글턴 인스턴스 */
export const audioManager = new AudioManager();
