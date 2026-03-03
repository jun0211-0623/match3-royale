import { useState } from 'react';

interface Props {
  onClose: () => void;
}

// 오늘을 4번째 날(인덱스 3)로 설정 — 3일 누적, 오늘 미수령
const TODAY_INDEX = 3;

const REWARDS = [
  { icon: '🪙', label: '50',      sub: '코인' },
  { icon: '🪙', label: '100',     sub: '코인' },
  { icon: '💎', label: '다이아',  sub: '×1' },
  { icon: '🪙', label: '200',     sub: '코인' },
  { icon: '💣', label: '폭탄',    sub: '×3' },
  { icon: '🪙', label: '350',     sub: '코인' },
  { icon: '🌟', label: '황금열쇠', sub: '×1' },
];

type DayState = 'done' | 'today' | 'locked';

function dayState(i: number, claimed: boolean): DayState {
  if (i < TODAY_INDEX) return 'done';
  if (i === TODAY_INDEX) return claimed ? 'done' : 'today';
  return 'locked';
}

export default function DailyRewardModal({ onClose }: Props) {
  const [claimed, setClaimed] = useState(false);

  const handleClaim = () => {
    if (!claimed) setClaimed(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="daily-modal-v2" onClick={(e) => e.stopPropagation()}>

        {/* ── 헤더 ── */}
        <div className="daily-modal-header">
          <div className="daily-modal-crown">👑</div>
          <h2 className="daily-modal-title">일일 출석 보상</h2>
          <p className="daily-modal-sub">매일 접속하면 보상이 쌓여요!</p>
        </div>

        {/* ── 보상 그리드 (3열 + 마지막 1행 전체) ── */}
        <div className="daily-reward-grid">
          {REWARDS.slice(0, 6).map((r, i) => {
            const state = dayState(i, claimed);
            return (
              <div key={i} className={`daily-card daily-card-${state}`}>
                {state === 'done' && (
                  <div className="daily-card-done-overlay">✓</div>
                )}
                <span className="daily-card-day">DAY {i + 1}</span>
                <span className="daily-card-icon">{r.icon}</span>
                <span className="daily-card-label">{r.label}</span>
                <span className="daily-card-sub">{r.sub}</span>
                {state === 'today' && (
                  <div className="daily-today-ring" />
                )}
              </div>
            );
          })}

          {/* Day 7 — 풀 너비 특별 카드 */}
          {(() => {
            const state = dayState(6, claimed);
            return (
              <div className={`daily-card daily-card-jackpot daily-card-${state}`}>
                {state === 'done' && (
                  <div className="daily-card-done-overlay">✓</div>
                )}
                <span className="daily-card-day">DAY 7 · JACKPOT</span>
                <span className="daily-card-icon daily-jackpot-icon">
                  {REWARDS[6].icon}
                </span>
                <div className="daily-jackpot-info">
                  <span className="daily-card-label">{REWARDS[6].label}</span>
                  <span className="daily-card-sub">{REWARDS[6].sub}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── 진행 바 ── */}
        <div className="daily-progress-wrap">
          <div className="daily-progress-track">
            <div
              className="daily-progress-fill"
              style={{ width: `${((claimed ? TODAY_INDEX + 1 : TODAY_INDEX) / 7) * 100}%` }}
            />
          </div>
          <span className="daily-progress-label">
            {claimed ? TODAY_INDEX + 1 : TODAY_INDEX} / 7 일 완료
          </span>
        </div>

        {/* ── 받기 버튼 ── */}
        {claimed ? (
          <div className="daily-claimed-msg">
            ✅ 오늘 보상을 받았어요! 내일 또 오세요 🎉
          </div>
        ) : (
          <button className="btn-claim btn-claim-pulse" onClick={handleClaim}>
            🎁 오늘 보상 받기
          </button>
        )}

        {/* 닫기 */}
        <button className="daily-close-btn" onClick={onClose}>✕</button>

      </div>
    </div>
  );
}
