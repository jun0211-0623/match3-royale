import { useState, useCallback, useRef } from 'react';
import { Board } from '../engine';
import { evaluate as evaluateDirect } from '../engine/evaluate';
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

// ── 특수 보석 ─────────────────────────────────────────────────────
type SpecialType = 'line-h' | 'line-v' | 'rainbow' | 'bomb';
interface SpecialGem { type: SpecialType; gemType: number; }

// match[i] = [col, row] (엔진 좌표)
function detectSpecialType(match: number[][]): SpecialType | null {
  const len = match.length;
  if (len < 4) return null;
  const cols = new Set(match.map(m => m[0]));
  const rows = new Set(match.map(m => m[1]));
  if (len >= 5 && (rows.size === 1 || cols.size === 1)) return 'rainbow'; // 5개 직선
  if (len >= 5) return 'bomb';                                              // L/T 자
  if (rows.size === 1) return 'line-h';                                     // 4개 가로
  if (cols.size === 1) return 'line-v';                                     // 4개 세로
  return null;
}

// 매치 중심 → [displayRow, displayCol]
function getMatchCenter(match: number[][]): [number, number] {
  const mid = match[Math.floor(match.length / 2)];
  return [mid[1], mid[0]]; // engine [col, row] → display [row, col]
}

// 특수 효과 범위 계산 → 엔진 형식 [col, row][]
function buildEffectPositions(
  type: SpecialType,
  displayRow: number,
  displayCol: number,
  board: Board,
  targetRow: number,
  targetCol: number,
): number[][] {
  const pos: number[][] = [];
  switch (type) {
    case 'line-h':
      for (let c = 0; c < BOARD_SIZE; c++) pos.push([c, displayRow]);
      break;
    case 'line-v':
      for (let r = 0; r < BOARD_SIZE; r++) pos.push([displayCol, r]);
      break;
    case 'bomb':
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const r = displayRow + dr, c = displayCol + dc;
          if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) pos.push([c, r]);
        }
      break;
    case 'rainbow': {
      const gemType = board.orbs[targetCol][targetRow] as number;
      for (let c = 0; c < BOARD_SIZE; c++)
        for (let r = 0; r < BOARD_SIZE; r++)
          if (board.orbs[c][r] === gemType) pos.push([c, r]);
      break;
    }
  }
  return pos;
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

function toDisplay(board: Board): number[][] {
  return Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => board.orbs[col][row] as number)
  );
}

function getMatchedPositions(board: Board): [number, number][] {
  const pos: [number, number][] = [];
  board.matches.forEach(match =>
    match.forEach(([engCol, engRow]) => pos.push([engRow, engCol]))
  );
  return pos;
}

function makeStyles(): React.CSSProperties[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, (): React.CSSProperties => ({}))
  );
}

function isAdj(r1: number, c1: number, r2: number, c2: number) {
  return (Math.abs(r1 - r2) === 1 && c1 === c2) || (Math.abs(c1 - c2) === 1 && r1 === r2);
}

function calcMatchScore(board: Board, comboIdx: number): number {
  const mult = COMBO_MULT[Math.min(comboIdx, 3)];
  let total = 0;
  board.matches.forEach((match: number[][]) => {
    const len = match.length;
    const base = len >= 5 ? 200 : len === 4 ? 100 : 50;
    total += base * mult;
  });
  return Math.round(total);
}

export default function GameBoard() {
  const boardRef        = useRef(new Board(BOARD_SIZE, BOARD_SIZE, [0, 1, 2, 3, 4, 5, 6]));
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
    boardRef.current        = new Board(BOARD_SIZE, BOARD_SIZE, [0, 1, 2, 3, 4, 5, 6]);
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
      return true; // cleared
    }
    return false;
  }, []);

  // ─── 연쇄 루프 (공통) ────────────────────────────────────────
  const runCascadeLoop = useCallback(async (
    board: Board,
    comboIdxStart: number,
  ): Promise<number> => {
    let comboIdx  = comboIdxStart;
    let totalScore = 0;

    while (board.hasMatch()) {
      const gained = calcMatchScore(board, comboIdx);
      totalScore += gained;

      if (comboIdx > 0) {
        const mult = COMBO_MULT[Math.min(comboIdx, 3)];
        setComboText(`COMBO ×${mult}`);
        setComboKey(k => k + 1);
      }

      // 매치 전 특수 보석 감지
      const currentMatches = board.matches as number[][][];
      const newSpecials: Array<{ dr: number; dc: number; type: SpecialType; gemType: number }> = [];
      currentMatches.forEach((match: number[][]) => {
        const sType = detectSpecialType(match);
        if (sType) {
          const gt = board.orbs[match[0][0]][match[0][1]] as number;
          const [dr, dc] = getMatchCenter(match);
          newSpecials.push({ dr, dc, type: sType, gemType: gt });
        }
      });

      const dying = getMatchedPositions(board);
      const colCounts = new Map<number, number>();
      dying.forEach(([, c]) => colCounts.set(c, (colCounts.get(c) ?? 0) + 1));

      // 죽는 위치의 특수 보석 제거
      dying.forEach(([r, c]) => specialGemsRef.current.delete(`${r},${c}`));

      // 소멸 애니메이션
      const dieTr = `transform ${T_DIE}ms ease-in, opacity ${T_DIE}ms ease-in`;
      const s2 = makeStyles();
      dying.forEach(([r, c]) => {
        s2[r][c] = { transform: 'scale(0) rotate(20deg)', opacity: 0, transition: dieTr };
      });
      setStyles(s2);
      await sleep(T_DIE);

      board.evaluate();
      board.resetAttic();
      const newDisplay = toDisplay(board);

      // 새 특수 보석 스폰
      newSpecials.forEach(({ dr, dc, type, gemType }) => {
        specialGemsRef.current.set(`${dr},${dc}`, { type, gemType });
      });
      setSpecialGems(new Map(specialGemsRef.current));

      // 낙하 시작
      const s3 = makeStyles();
      colCounts.forEach((count, col) => {
        for (let r = 0; r < count; r++)
          s3[r][col] = { transform: `translateY(-${CELL_PX * (count - r)}px)`, opacity: 0, transition: 'none' };
      });
      setDisplay(newDisplay);
      setStyles(s3);
      await sleep(T_PAUSE);

      // 낙하 진입
      const s4 = makeStyles();
      let maxDelay = 0;
      colCounts.forEach((count, col) => {
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
    const addRange = (positions: number[][]) => {
      positions.forEach(([c, r]) => posSet.add(`${r},${c}`));
    };

    if (srcSpecial) addRange(buildEffectPositions(srcSpecial.type, sr, sc, board, tr, tc));
    if (tgtSpecial) addRange(buildEffectPositions(tgtSpecial.type, tr, tc, board, sr, sc));
    // 두 셀 모두 포함
    posSet.add(`${sr},${sc}`);
    posSet.add(`${tr},${tc}`);

    // 특수 보석 제거
    specialGemsRef.current.delete(`${sr},${sc}`);
    specialGemsRef.current.delete(`${tr},${tc}`);
    setSpecialGems(new Map(specialGemsRef.current));

    // 엔진 형식 [col, row][]
    const fakeMatch: number[][] = [...posSet].map(key => {
      const [r, c] = key.split(',').map(Number);
      return [c, r];
    });

    // 소멸 애니메이션
    const dieTr = `transform ${T_DIE}ms ease-in, opacity ${T_DIE}ms ease-in`;
    const s = makeStyles();
    posSet.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      s[r][c] = { transform: 'scale(0) rotate(20deg)', opacity: 0, transition: dieTr };
    });
    setStyles(s);
    await sleep(T_DIE);

    // 컬럼별 제거 수
    const colCounts = new Map<number, number>();
    fakeMatch.forEach(([engCol]) => colCounts.set(engCol, (colCounts.get(engCol) ?? 0) + 1));

    // 직접 평가 (엔진 하위 함수 호출)
    const [newOrbs] = evaluateDirect(board.orbs, [fakeMatch], board.attic.orbs);
    board.orbs = newOrbs;
    board.resetAttic();

    // 낙하 시작
    const s3 = makeStyles();
    colCounts.forEach((count, col) => {
      for (let r = 0; r < count; r++)
        s3[r][col] = { transform: `translateY(-${CELL_PX * (count - r)}px)`, opacity: 0, transition: 'none' };
    });
    setDisplay(toDisplay(board));
    setStyles(s3);
    await sleep(T_PAUSE);

    // 낙하 진입
    const s4 = makeStyles();
    let maxDelay = 0;
    colCounts.forEach((count, col) => {
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

    // ② 엔진 스왑
    board.swap([[sc, sr], [tc, tr]]);

    if (!board.hasMatch()) {
      // ③ 매치 없음
      board.swap([[tc, tr], [sc, sr]]);
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
