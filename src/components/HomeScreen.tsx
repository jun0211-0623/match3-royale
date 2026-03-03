interface Props {
  onPlay: () => void;
  onSettings: () => void;
  onDailyReward: () => void;
  coins: number;
  level: number;
}

export default function HomeScreen({ onPlay, onSettings, onDailyReward, coins, level }: Props) {
  return (
    <div className="home-screen">

      {/* ── 상단 바 ── */}
      <div className="home-topbar">
        <div className="home-coin">
          <span className="coin-gem">🪙</span>
          <span className="coin-amount">{coins.toLocaleString()}</span>
        </div>
        <button className="home-settings-btn" onClick={onSettings}>⚙</button>
        <div className="home-lv">Lv.{level}</div>
      </div>

      {/* ── 타이틀 ── */}
      <div className="title-section home-title-anim">
        <div className="title-glow" />
        <span className="crown">♛</span>
        <h1 className="title">
          <span className="title-match">MATCH 3</span>
          <span className="title-royale">ROYALE</span>
        </h1>
      </div>

      {/* ── 버튼 그룹 ── */}
      <div className="home-buttons">

        {/* PLAY */}
        <button className="home-btn btn-play" onClick={onPlay}>
          <span className="home-btn-label">▶&nbsp;&nbsp;PLAY</span>
        </button>

        {/* 일일 도전 */}
        <button className="home-btn btn-daily" onClick={onDailyReward}>
          <span className="home-btn-label">
            ⭐&nbsp;일일 도전
            <span className="new-badge">NEW</span>
          </span>
        </button>

        {/* 토너먼트 */}
        <button className="home-btn btn-tournament">
          <span className="home-btn-label">🏆&nbsp;토너먼트</span>
        </button>

      </div>

      {/* ── 하단 네비게이션 ── */}
      <nav className="bottom-nav">
        <button className="nav-item nav-active">
          <span className="nav-icon">🏠</span>
          <span className="nav-label">홈</span>
        </button>
        <button className="nav-item">
          <span className="nav-icon">🗺️</span>
          <span className="nav-label">모험</span>
        </button>
        <button className="nav-item">
          <span className="nav-icon">👥</span>
          <span className="nav-label">친구</span>
        </button>
        <button className="nav-item">
          <span className="nav-icon">🛍️</span>
          <span className="nav-label">상점</span>
        </button>
      </nav>

    </div>
  );
}
