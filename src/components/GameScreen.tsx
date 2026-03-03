import { useState } from 'react';
import GameBoard from './GameBoard';

interface Props {
  onBack: () => void;
  coins: number;
  level: number;
}

type PowerUpId = 'bomb' | 'rainbow' | 'thunder' | 'shuffle';

interface PowerUp {
  id: PowerUpId;
  icon: string;
  label: string;
  count: number;
  color: string;
}

const INITIAL_POWERUPS: PowerUp[] = [
  { id: 'bomb',    icon: '💣', label: '폭탄',  count: 2, color: '#FF5252' },
  { id: 'rainbow', icon: '🌈', label: '무지개', count: 1, color: '#FF8F00' },
  { id: 'thunder', icon: '⚡', label: '번개',  count: 3, color: '#FFD54F' },
  { id: 'shuffle', icon: '🔀', label: '셔플',  count: 2, color: '#40C4FF' },
];

export default function GameScreen({ onBack, coins, level }: Props) {
  const [powerUps, setPowerUps] = useState<PowerUp[]>(
    INITIAL_POWERUPS.map(p => ({ ...p }))
  );
  const [activePowerUp, setActivePowerUp] = useState<PowerUpId | null>(null);
  const [puToast, setPuToast] = useState('');

  const handlePowerUp = (id: PowerUpId) => {
    const pu = powerUps.find(p => p.id === id);
    if (!pu || pu.count === 0) return;

    if (activePowerUp === id) {
      // 두 번 누르면 취소
      setActivePowerUp(null);
      setPuToast('');
      return;
    }

    setActivePowerUp(id);
    const msg: Record<PowerUpId, string> = {
      bomb:    '💣 보석을 탭하세요!',
      rainbow: '🌈 색상을 선택하세요!',
      thunder: '⚡ 행을 탭하세요!',
      shuffle: '🔀 셔플 준비!',
    };
    setPuToast(msg[id]);

    // 셔플은 즉시 사용
    if (id === 'shuffle') {
      setPowerUps(prev =>
        prev.map(p => (p.id === id ? { ...p, count: p.count - 1 } : p))
      );
      setActivePowerUp(null);
      setTimeout(() => setPuToast(''), 1500);
    }
  };

  return (
    <div className="game-screen">

      {/* ── 상단 헤더 ── */}
      <div className="gs-header">
        <button className="gv-back-btn" onClick={onBack}>‹ 홈</button>
        <div className="gs-title-wrap">
          <span className="gs-level-badge">⚔️ Lv.{level}</span>
        </div>
        <div className="gv-coins">🪙 {coins.toLocaleString()}</div>
      </div>

      {/* 파워업 사용 중 토스트 */}
      {puToast && (
        <div className="pu-toast">{puToast}</div>
      )}

      {/* ── 게임 보드 영역 ── */}
      <div className="gs-board-area">
        <GameBoard />
      </div>

      {/* ── 파워업 바 ── */}
      <div className="powerup-bar">
        {powerUps.map(pu => (
          <button
            key={pu.id}
            className={[
              'powerup-btn',
              pu.count === 0      ? 'powerup-empty'  : '',
              activePowerUp === pu.id ? 'powerup-active' : '',
            ].join(' ').trim()}
            style={{ '--pu-color': pu.color } as React.CSSProperties}
            onClick={() => handlePowerUp(pu.id)}
            disabled={pu.count === 0}
          >
            <div className="powerup-inner">
              <span className="powerup-icon">{pu.icon}</span>
              <span className="powerup-label">{pu.label}</span>
            </div>
            <span className="powerup-count">×{pu.count}</span>
          </button>
        ))}
      </div>

    </div>
  );
}
