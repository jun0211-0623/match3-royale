import './App.css';
import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import GameScreen from './components/GameScreen';
import SettingsScreen from './components/SettingsScreen';
import DailyRewardModal from './components/DailyRewardModal';

// 배경 파티클 20개 (MD 디자인 규칙)
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: `${4 + Math.random() * 8}px`,
  duration: `${5 + Math.random() * 8}s`,
  delay: `${Math.random() * 5}s`,
  color: ['#FFD54F', '#D500F9', '#00E5FF', '#FF1744', '#00E676'][i % 5],
}));

type Screen = 'home' | 'game' | 'settings';

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [showDaily, setShowDaily] = useState(false);
  const coins = 1500;
  const level = 12;

  return (
    <div className="app">
      {/* 배경 파티클 — 항상 렌더 */}
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="bg-particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* ── 홈 화면 ── */}
      {screen === 'home' && (
        <HomeScreen
          onPlay={() => setScreen('game')}
          onSettings={() => setScreen('settings')}
          onDailyReward={() => setShowDaily(true)}
          coins={coins}
          level={level}
        />
      )}

      {/* ── 게임 뷰 ── */}
      {screen === 'game' && (
        <GameScreen
          onBack={() => setScreen('home')}
          coins={coins}
          level={level}
        />
      )}

      {/* ── 설정 화면 ── */}
      {screen === 'settings' && (
        <SettingsScreen onBack={() => setScreen('home')} />
      )}

      {/* ── 일일 보상 모달 ── */}
      {showDaily && screen === 'home' && (
        <DailyRewardModal onClose={() => setShowDaily(false)} />
      )}
    </div>
  );
}

export default App;
