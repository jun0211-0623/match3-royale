import { useState, useCallback, useRef } from 'react';
import { CustomBoard } from '../engine/customBoard';
import type { SpecialType, SpecialGem, MatchGroup } from '../engine/customBoard';
import { GEM_CONFIG } from '../constants/gems';

const BOARD_SIZE = 8;
const CELL_PX = 60;

const T_SWAP  = 210;
const T_DIE   = 260;
const T_FALL  = 300;
const T_PAUSE = 40;

const COMBO_MULT = [1, 1.5, 2, 3];
const INITIAL_MOVES = 25;

const STAGE_TARGETS = [500, 1000, 1800, 3000, 5000];
function getTarget(stage: number): number {
  return stage <= STAGE_TARGETS.length ? STAGE_TARGETS[stage - 1] : Math.floor(stage * 1200);
}
function getStars(score: number, target: number): number {
  if (score >= target * 2) return 3;
  if (score >= target * 1.5) return 2;
  return 1;
}
function getLiveStars(score: number, target: number): number {
  if (score >= target * 2) return 3;
  if (score >= target * 1.5) return 2;
  if (score >= target) return 1;
  return 0;
}

// ── 특수 효과 범위 계산 → [row, col][] ────────────────────────────────
function buildEffectPositions(
  type: SpecialType,
  displayRow: number,
  displayCol: number,
  board: CustomBoard,
  targetRow: number,
  targetCol: number,
): [number, number][] {
  const pos: [number, number][] = [];
  switch (type) {
    case 'line-h':
      for (let c = 0; c < BOARD_SIZE; c++) pos.push([displayRow, c]);
      break;
    case 'line-v':
      for (let r = 0; r < BOARD_SIZE; r++) pos.push([r, displayCol]);
      break;
    case 'bomb':
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const r = displayRow + dr, c = displayCol + dc;
          if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) pos.push([r, c]);
        }
      break;
    case 'rainbow': {
      // 대상 셀의 색상과 같은 모든 보석 제거
      const gemType = board.orbs[targetRow][targetCol];
      for (let r = 0; r < BOARD_SIZE; r++)
        for (let c = 0; c < BOARD_SIZE; c++)
          if (board.orbs[r][c] === gemType) pos.push([r, c]);
      break;
    }
  }
  return pos;
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// row-major 직접 복사
function toDisplay(board: CustomBoard): number[][] {
  return board.orbs.map(row => [...row]);
}

function makeStyles(): React.CSSProperties[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, (): React.CSSProperties => ({}))
  );
}

function isAdj(r1: number, c1: number, r2: number, c2: number) {
  return (Math.abs(r1 - r2) === 1 && c1 === c2) || (Math.abs(c1 - c2) === 1 && r1 === r2);
}

function calcMatchScore(matches: MatchGroup[], comboIdx: number): number {
  const mult = COMBO_MULT[Math.min(comboIdx, 3)];
  let total = 0;
  matches.forEach(match => {
    const len = match.cells.length;
    const base = len >= 5 ? 200 : len === 4 ? 100 : 50;
    total += base * mult;
  });
  return Math.round(total);
}

export default function GameBoard() {
  const boardRef        = useRef(new CustomBoard(BOARD_SIZE, BOARD_SIZE, [0, 1, 2, 3, 4, 5, 6]));
  const scoreRef        = useRef(0);
  const stageRef        = useRef(1);
  const stageClearedRef = useRef(false);
  const specialGemsRef  = useRef<Map<string, SpecialGem>>(new Map());

  const [display, setDisplay]     = useState<number[][]>(() => toDisplay(boardRef.current));
  const [styles, setStyles]       = useState<React.CSSProperties[][]>(makeStyles);
  const [selected, setSelected]   = useState<[number, number] | null>(null);
  const [busy, setBusy]           = useState(false);
  const [score, setScore]         = useState(0);
  const [moves, setMoves]         = useState(INITIAL_MOVES);
  const [stage, setStage]         = useState(1);
  const [gameOver, setGameOver]   = useState(false);
  const [stageCleared, setStageCleared] = useState(false);
  const [clearedStars, setClearedStars] = useState(0);
  const [comboText, setComboText] = useState('');
  const [comboKey, setComboKey]   = useState(0);
  const [scoreKey, setScoreKey]   = useState(0);
  const [specialGems, setSpecialGems] = useState<Map<string, SpecialGem>>(new Map());

  // ─── 리셋 공통 ──────────────────────────────────────────────────
  const initState = useCallback((targetStage: number) => {
    boardRef.current        = new CustomBoard(BOARD_SIZE, BOARD_SIZE, [0, 1, 2, 3, 4, 5, 6]);
    scoreRef.current        = 0;
    stageRef.current        = targetStage;
    stageClearedRef.current = false;
    specialGemsRef.current.clear();
    setDisplay(toDisplay(boardRef.current));
    setStyles(makeStyles());
    setSelected(null);
    setBusy(false);
    setScore(0);
    setMoves(INITIAL_MOVES);
    setStage(targetStage);
    setGameOver(false);
    setStageCleared(false);
    setClearedStars(0);
    setComboText('');
    setSpecialGems(new Map());
  }, []);

  const resetGame = useCallback(() => initState(1), [initState]);
  const nextStage = useCallback(() => initState(stageRef.current + 1), [initState]);

  // ─── 공통 점수/클리어 처리 ────────────────────────────────────
  const applyScore = useCallback((gained: number): boolean => {
    if (gained <= 0) return false;
    const newScore = scoreRef.current + gained;
    scoreRef.current = newScore;
    setScore(prev => prev + gained);
    setScoreKey(k => k + 1);
    const target = getTarget(stageRef.current);
    if (!stageClearedRef.current && newScore >= target) {
      stageClearedRef.current = true;
      setClearedStars(getStars(newScore, target));
      setStageCleared(true);
      return true;
    }
    return false;
  }, []);

  // ─── 연쇄 루프 (공통) ────────────────────────────────────────
  const runCascadeLoop = useCallback(async (
    board: CustomBoard,
    comboIdxStart: number,
  ): Promise<number> => {
    let comboIdx  = comboIdxStart;
    let totalScore = 0;

    while (board.hasMatch()) {
      // 현재 매치 평가 (점수 + 특수보석 탐지 + 중력 적용 통합)
      const result = board.evaluate();
      const gained = calcMatchScore(result.matches, comboIdx);
      totalScore += gained;

      if (comboIdx > 0) {
        const mult = COMBO_MULT[Math.min(comboIdx, 3)];
        setComboText(`COMBO ×${mult}`);
        setComboKey(k => k + 1);
      }

      // 소멸 애니메이션 (매치된 모든 셀 + 스폰 위치 포함)
      const dieTr = `transform ${T_DIE}ms ease-in, opacity ${T_DIE}ms ease-in`;
      const s2 = makeStyles();
      result.allMatched.forEach(([r, c]) => {
        s2[r][c] = { transform: 'scale(0) rotate(20deg)', opacity: 0, transition: dieTr };
      });
      setStyles(s2);
      await sleep(T_DIE);

      // 특수 보석 상태 업데이트: cleared 제거, spawned 추가
      result.cleared.forEach(([r, c]) => specialGemsRef.current.delete(`${r},${c}`));
      result.spawned.forEach(({ row, col }) => specialGemsRef.current.delete(`${row},${col}`));
      result.spawned.forEach(({ row, col, type, gemType }) => {
        specialGemsRef.current.set(`${row},${col}`, { type, gemType });
      });
      setSpecialGems(new Map(specialGemsRef.current));

      const newDisplay = toDisplay(board);

      // 낙하 시작 (새 보석은 화면 위에서 내려옴, 스폰 보석은 팝인)
      const s3 = makeStyles();
      result.colCounts.forEach((count, col) => {
        for (let r = 0; r < count; r++)
          s3[r][col] = { transform: `translateY(-${CELL_PX * count}px)`, opacity: 0, transition: 'none' };
      });
      // 스폰 위치: 축소 상태에서 시작
      result.spawned.forEach(({ row, col }) => {
        s3[row][col] = { transform: 'scale(0)', opacity: 0, transition: 'none' };
      });
      setDisplay(newDisplay);
      setStyles(s3);
      await sleep(T_PAUSE);

      // 낙하 + 스폰 팝인 애니메이션
      const s4 = makeStyles();
      let maxDelay = 0;
      result.colCounts.forEach((count, col) => {
        for (let r = 0; r < count; r++) {
          const delay = (count - 1 - r) * 35;
          maxDelay = Math.max(maxDelay, delay);
          s4[r][col] = {
            transform: 'none',
            opacity: 1,
            transition: `transform ${T_FALL}ms cubic-bezier(0.18,0.89,0.32,1.2) ${delay}ms, opacity ${T_FALL * 0.5}ms ease ${delay}ms`,
          };
        }
      });
      // 스폰 보석: 탄성 팝인
      result.spawned.forEach(({ row, col }) => {
        s4[row][col] = {
          transform: 'scale(1)',
          opacity: 1,
          transition: `transform ${Math.round(T_FALL * 0.7)}ms cubic-bezier(0.34,1.56,0.64,1), opacity ${Math.round(T_FALL * 0.4)}ms ease`,
        };
      });
      setStyles(s4);
      await sleep(T_FALL + maxDelay + T_PAUSE);

      comboIdx++;
    }

    setComboText('');
    return totalScore;
  }, []);

  // ─── 특수 보석 발동 ───────────────────────────────────────────
  const runSpecialTurn = useCallback(async (
    sr: number, sc: number,
    tr: number, tc: number,
    srcSpecial: SpecialGem | undefined,
    tgtSpecial: SpecialGem | undefined,
    isLastMove: boolean,
  ) => {
    const board = boardRef.current;

    // 효과 범위 수집 (중복 제거)
    const posSet = new Set<string>();
    const addRange = (positions: [number, number][]) => {
      positions.forEach(([r, c]) => posSet.add(`${r},${c}`));
    };

    if (srcSpecial) addRange(buildEffectPositions(srcSpecial.type, sr, sc, board, tr, tc));
    if (tgtSpecial) addRange(buildEffectPositions(tgtSpecial.type, tr, tc, board, sr, sc));
    posSet.add(`${sr},${sc}`);
    posSet.add(`${tr},${tc}`);

    // 효과 범위 내 특수 보석 모두 제거
    posSet.forEach(key => specialGemsRef.current.delete(key));
    setSpecialGems(new Map(specialGemsRef.current));

    // 소멸 애니메이션
    const dieTr = `transform ${T_DIE}ms ease-in, opacity ${T_DIE}ms ease-in`;
    const s = makeStyles();
    posSet.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      s[r][c] = { transform: 'scale(0) rotate(20deg)', opacity: 0, transition: dieTr };
    });
    setStyles(s);
    await sleep(T_DIE);

    // 커스텀 엔진으로 해당 셀 제거
    const cells: [number, number][] = [...posSet].map(key => {
      const [r, c] = key.split(',').map(Number);
      return [r, c];
    });
    const result = board.clearCells(cells);

    const newDisplay = toDisplay(board);

    // 낙하 시작
    const s3 = makeStyles();
    result.colCounts.forEach((count, col) => {
      for (let r = 0; r < count; r++)
        s3[r][col] = { transform: `translateY(-${CELL_PX * count}px)`, opacity: 0, transition: 'none' };
    });
    setDisplay(newDisplay);
    setStyles(s3);
    await sleep(T_PAUSE);

    // 낙하 진입
    const s4 = makeStyles();
    let maxDelay = 0;
    result.colCounts.forEach((count, col) => {
      for (let r = 0; r < count; r++) {
        const delay = (count - 1 - r) * 35;
        maxDelay = Math.max(maxDelay, delay);
        s4[r][col] = {
          transform: 'none',
          opacity: 1,
          transition: `transform ${T_FALL}ms cubic-bezier(0.18,0.89,0.32,1.2) ${delay}ms, opacity ${T_FALL * 0.5}ms ease ${delay}ms`,
        };
      }
    });
    setStyles(s4);
    await sleep(T_FALL + maxDelay + T_PAUSE);

    // 연쇄 루프 (특수 효과 이후)
    const cascadeScore = await runCascadeLoop(board, 1);

    if (board.needsShuffle()) {
      board.shuffle();
      setDisplay(toDisplay(board));
    }

    const cleared = applyScore(cascadeScore);
    setStyles(makeStyles());
    if (!cleared) {
      if (isLastMove && !stageClearedRef.current) setGameOver(true);
      setBusy(false);
    } else {
      setBusy(false);
    }
  }, [runCascadeLoop, applyScore]);

  // ─── 일반 턴 ────────────────────────────────────────────────────
  const runTurn = useCallback(async (
    sr: number, sc: number,
    tr: number, tc: number,
    isLastMove: boolean,
  ) => {
    const board = boardRef.current;

    // ① 스왑 슬라이드
    const dx = (tc - sc) * CELL_PX;
    const dy = (tr - sr) * CELL_PX;
    const swapTr = `transform ${T_SWAP}ms cubic-bezier(0.4,0,0.2,1)`;
    const s1 = makeStyles();
    s1[sr][sc] = { transform: `translate(${dx}px,${dy}px)`,   transition: swapTr };
    s1[tr][tc] = { transform: `translate(${-dx}px,${-dy}px)`, transition: swapTr };
    setStyles(s1);
    await sleep(T_SWAP);

    // ② 엔진 스왑 (row-major)
    board.swap(sr, sc, tr, tc);

    if (!board.hasMatch()) {
      // ③ 매치 없음 → 되돌리기
      board.swap(tr, tc, sr, sc);
      setDisplay(toDisplay(board));
      const shk = makeStyles();
      shk[sr][sc] = { animation: 'gem-shake 0.35s ease' };
      shk[tr][tc] = { animation: 'gem-shake 0.35s ease' };
      setStyles(shk);
      await sleep(380);

    } else {
      setDisplay(toDisplay(board));
      setStyles(makeStyles());
      await sleep(T_PAUSE);

      // ④ 연쇄 루프
      const totalScore = await runCascadeLoop(board, 0);

      if (board.needsShuffle()) {
        board.shuffle();
        setDisplay(toDisplay(board));
      }

      const cleared = applyScore(totalScore);
      if (cleared) {
        setStyles(makeStyles());
        setBusy(false);
        return;
      }
    }

    setStyles(makeStyles());
    if (isLastMove && !stageClearedRef.current) setGameOver(true);
    setBusy(false);
  }, [runCascadeLoop, applyScore]);

  // ─── 클릭 핸들러 ────────────────────────────────────────────────
  const handleClick = useCallback((row: number, col: number) => {
    if (busy || gameOver || stageCleared) return;
    if (!selected) { setSelected([row, col]); return; }

    const [sr, sc] = selected;
    if (sr === row && sc === col) { setSelected(null); return; }
    if (!isAdj(sr, sc, row, col)) { setSelected([row, col]); return; }

    setSelected(null);
    setBusy(true);

    const newMoves = moves - 1;
    setMoves(newMoves);

    const srcSpecial = specialGemsRef.current.get(`${sr},${sc}`);
    const tgtSpecial = specialGemsRef.current.get(`${row},${col}`);

    if (srcSpecial || tgtSpecial) {
      runSpecialTurn(sr, sc, row, col, srcSpecial, tgtSpecial, newMoves <= 0);
    } else {
      runTurn(sr, sc, row, col, newMoves <= 0);
    }
  }, [busy, selected, runTurn, runSpecialTurn, moves, gameOver, stageCleared]);

  // ─── 렌더 ───────────────────────────────────────────────────────
  const target    = getTarget(stage);
  const liveStars = getLiveStars(score, target);
  const progress  = Math.min(100, (score / target) * 100);

  const SPECIAL_ICON: Record<SpecialType, string> = {
    'line-h': '⟺', 'line-v': '⟕', 'rainbow': '✦', 'bomb': '✸',
  };

  return (
    <div className="board-wrapper">

      {/* ── HUD ── */}
      <div className="hud">
        <div className="hud-panel">
          <div className="hud-label">이동</div>
          <div className={`hud-value${moves <= 5 ? ' moves-critical' : ''}`}>{moves}</div>
        </div>

        <div className="hud-center">
          <div className="stage-badge">STAGE {stage}</div>
          <div className="live-stars">
            {[1, 2, 3].map(i => (
              <span key={i} className={i <= liveStars ? 'star-on' : 'star-off'}>★</span>
            ))}
          </div>
          {comboText && (
            <div className="combo-toast" key={comboKey}>{comboText}</div>
          )}
        </div>

        <div className="hud-panel">
          <div className="hud-label">점수</div>
          <div className="hud-value score-value" key={`score-${scoreKey}`}>
            {score.toLocaleString()}
          </div>
        </div>
      </div>

      {/* ── 점수 프로그레스 바 ── */}
      <div className="progress-wrap">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-text">
          {score.toLocaleString()} / {target.toLocaleString()}
        </div>
      </div>

      {/* ── 게임 보드 ── */}
      <div className="board-container">
        <div className="board-grid">
          {display.map((rowArr, row) =>
            rowArr.map((gemType, col) => {
              const gem        = GEM_CONFIG[gemType] ?? GEM_CONFIG[0];
              const isSel      = selected?.[0] === row && selected?.[1] === col;
              const isAdjSel   = selected && !isSel && isAdj(selected[0], selected[1], row, col);
              const specialGem = specialGems.get(`${row},${col}`);

              return (
                <div
                  key={`${row}-${col}`}
                  className={`gem-cell${isSel ? ' gem-selected' : ''}${isAdjSel ? ' gem-adjacent' : ''}${busy || gameOver || stageCleared ? ' gem-locked' : ''}`}
                  style={{ '--gem-glow': gem.glow, ...styles[row][col] } as React.CSSProperties}
                  onClick={() => handleClick(row, col)}
                >
                  <div
                    className="gem-body"
                    style={{
                      background: gem.gradient,
                      boxShadow: `0 4px 0 ${gem.shadow}, 0 0 14px ${gem.glow}`,
                    }}
                  >
                    <div
                      className="gem-highlight"
                      style={{ background: `radial-gradient(ellipse at 35% 28%, ${gem.highlight} 0%, transparent 60%)` }}
                    />
                    <div className="gem-shadow-overlay" />
                  </div>

                  {/* 특수 보석 오버레이 */}
                  {specialGem && (
                    <div className={`special-overlay special-${specialGem.type}`}>
                      {SPECIAL_ICON[specialGem.type]}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── 스테이지 클리어 모달 ── */}
      {stageCleared && (
        <div className="modal-overlay">
          <div className="stage-clear-modal">
            <div className="clear-stars-row">
              {[1, 2, 3].map(i => (
                <span
                  key={i}
                  className={`clear-star ${i <= clearedStars ? 'clear-star-on' : 'clear-star-off'}`}
                  style={{ animationDelay: `${(i - 1) * 0.22}s` }}
                >★</span>
              ))}
            </div>
            <h2 className="stage-clear-title">STAGE CLEAR!</h2>
            <div className="stage-clear-sub">{stage}단계 클리어!</div>
            <div className="modal-score-row">
              <span className="modal-score-label">최종 점수</span>
              <span className="modal-score-value">{score.toLocaleString()}</span>
            </div>
            <button className="btn-next-stage" onClick={nextStage}>
              <span className="btn-next-inner">다음 스테이지 →</span>
            </button>
            <button className="btn-ghost" onClick={resetGame}>처음부터</button>
          </div>
        </div>
      )}

      {/* ── 게임 오버 모달 ── */}
      {gameOver && (
        <div className="modal-overlay">
          <div className="game-over-modal">
            <div className="game-over-icon">💀</div>
            <h2 className="game-over-title">GAME OVER</h2>
            <div className="modal-score-row">
              <span className="modal-score-label">최종 점수</span>
              <span className="modal-score-value">{score.toLocaleString()}</span>
            </div>
            <button className="btn-restart" onClick={resetGame}>
              <span className="btn-restart-inner">다시 시작</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
