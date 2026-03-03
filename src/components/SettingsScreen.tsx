import { useState } from 'react';

interface Props {
  onBack: () => void;
}

interface ToggleRowProps {
  icon: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ icon, label, value, onChange }: ToggleRowProps) {
  return (
    <div className="settings-row" onClick={() => onChange(!value)}>
      <div className="settings-row-left">
        <span className="settings-row-icon">{icon}</span>
        <span className="settings-row-label">{label}</span>
      </div>
      <button
        className={`toggle-switch${value ? ' toggle-on' : ''}`}
        onClick={(e) => { e.stopPropagation(); onChange(!value); }}
        aria-pressed={value}
      >
        <span className="toggle-knob" />
      </button>
    </div>
  );
}

const LANGUAGES = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '中文',   flag: '🇨🇳' },
];

const LINKS = [
  { icon: '📄', label: '이용약관' },
  { icon: '🔒', label: '개인정보처리방침' },
  { icon: '💬', label: '고객지원' },
];

export default function SettingsScreen({ onBack }: Props) {
  const [bgMusic,   setBgMusic]   = useState(true);
  const [sfx,       setSfx]       = useState(true);
  const [vibration, setVibration] = useState(true);
  const [language,  setLanguage]  = useState('ko');
  const [showLang,  setShowLang]  = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === language)!;

  return (
    <div className="settings-screen">

      {/* ── 헤더 ── */}
      <div className="settings-header">
        <button className="gv-back-btn" onClick={onBack}>‹ 홈</button>
        <h2 className="settings-title">⚙ 설정</h2>
        <div className="settings-header-spacer" />
      </div>

      {/* ── 스크롤 컨텐츠 ── */}
      <div className="settings-body">

        {/* 사운드 섹션 */}
        <div className="settings-section">
          <p className="settings-section-title">🔊 사운드</p>
          <div className="settings-card">
            <ToggleRow icon="🎵" label="배경음악"   value={bgMusic}   onChange={setBgMusic} />
            <div className="settings-divider" />
            <ToggleRow icon="🔔" label="효과음"     value={sfx}       onChange={setSfx} />
            <div className="settings-divider" />
            <ToggleRow icon="📳" label="진동"       value={vibration} onChange={setVibration} />
          </div>
        </div>

        {/* 언어 섹션 */}
        <div className="settings-section">
          <p className="settings-section-title">🌐 언어</p>
          <div className="settings-card">
            <div
              className="settings-row settings-row-pressable"
              onClick={() => setShowLang(v => !v)}
            >
              <div className="settings-row-left">
                <span className="settings-row-icon">{currentLang.flag}</span>
                <span className="settings-row-label">{currentLang.label}</span>
              </div>
              <span className="settings-chevron">{showLang ? '▲' : '▼'}</span>
            </div>
            {showLang && (
              <div className="lang-options">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    className={`lang-option${lang.code === language ? ' lang-selected' : ''}`}
                    onClick={() => { setLanguage(lang.code); setShowLang(false); }}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                    {lang.code === language && <span className="lang-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 정보 섹션 */}
        <div className="settings-section">
          <p className="settings-section-title">ℹ️ 정보</p>
          <div className="settings-card">
            {LINKS.map((link, i) => (
              <div key={link.label}>
                <div className="settings-row settings-row-pressable settings-row-link">
                  <div className="settings-row-left">
                    <span className="settings-row-icon">{link.icon}</span>
                    <span className="settings-row-label">{link.label}</span>
                  </div>
                  <span className="settings-chevron">›</span>
                </div>
                {i < LINKS.length - 1 && <div className="settings-divider" />}
              </div>
            ))}
          </div>
        </div>

        {/* 버전 */}
        <div className="settings-version">
          <span className="version-crown">♛</span>
          <span className="version-name">MATCH 3 ROYALE</span>
          <span className="version-num">v1.0.0</span>
        </div>

      </div>
    </div>
  );
}
