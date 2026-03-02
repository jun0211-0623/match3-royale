/**
 * 레벨 데이터 (MVP: 15레벨)
 *
 * goals[].type: 'collect' (특정 색 블록 N개 제거)
 * stars: 남은 이동 횟수 기준 (one 이상=1별, two 이상=2별, three 이상=3별)
 * reward.coins: 클리어 보상 (별 배수 적용)
 */
export const LEVELS = [
  // ─── 튜토리얼 구간 (레벨 1~5): 색상 4개, 단일 목표 ───
  {
    level: 1,
    colors: 4,
    moves: 20,
    goals: [{ type: 'collect', color: 'red', count: 10 }],
    stars: { one: 1, two: 5, three: 10 },
    reward: { coins: 50 },
  },
  {
    level: 2,
    colors: 4,
    moves: 18,
    goals: [{ type: 'collect', color: 'blue', count: 12 }],
    stars: { one: 1, two: 4, three: 8 },
    reward: { coins: 60 },
  },
  {
    level: 3,
    colors: 4,
    moves: 18,
    goals: [{ type: 'collect', color: 'green', count: 15 }],
    stars: { one: 1, two: 4, three: 8 },
    reward: { coins: 60 },
  },
  {
    level: 4,
    colors: 4,
    moves: 16,
    goals: [{ type: 'collect', color: 'yellow', count: 14 }],
    stars: { one: 1, two: 3, three: 7 },
    reward: { coins: 70 },
  },
  {
    level: 5,
    colors: 4,
    moves: 15,
    goals: [{ type: 'collect', color: 'red', count: 16 }],
    stars: { one: 1, two: 3, three: 7 },
    reward: { coins: 70 },
  },

  // ─── 난이도 상승 (레벨 6~10): 색상 5개, 복합 목표 ───
  {
    level: 6,
    colors: 5,
    moves: 20,
    goals: [
      { type: 'collect', color: 'red', count: 10 },
      { type: 'collect', color: 'blue', count: 10 },
    ],
    stars: { one: 1, two: 5, three: 10 },
    reward: { coins: 80 },
  },
  {
    level: 7,
    colors: 5,
    moves: 18,
    goals: [
      { type: 'collect', color: 'green', count: 12 },
      { type: 'collect', color: 'yellow', count: 8 },
    ],
    stars: { one: 1, two: 4, three: 8 },
    reward: { coins: 80 },
  },
  {
    level: 8,
    colors: 5,
    moves: 16,
    goals: [
      { type: 'collect', color: 'blue', count: 14 },
      { type: 'collect', color: 'purple', count: 10 },
    ],
    stars: { one: 1, two: 3, three: 7 },
    reward: { coins: 90 },
  },
  {
    level: 9,
    colors: 5,
    moves: 18,
    goals: [
      { type: 'collect', color: 'red', count: 12 },
      { type: 'collect', color: 'green', count: 12 },
    ],
    stars: { one: 1, two: 4, three: 8 },
    reward: { coins: 90 },
  },
  {
    level: 10,
    colors: 5,
    moves: 15,
    goals: [
      { type: 'collect', color: 'yellow', count: 15 },
      { type: 'collect', color: 'blue', count: 10 },
    ],
    stars: { one: 1, two: 3, three: 6 },
    reward: { coins: 100 },
  },

  // ─── 특수 블록 구간 (레벨 11~15): 색상 6개, 고난도 ───
  {
    level: 11,
    colors: 6,
    moves: 22,
    goals: [
      { type: 'collect', color: 'red', count: 15 },
      { type: 'collect', color: 'purple', count: 12 },
    ],
    stars: { one: 1, two: 5, three: 10 },
    reward: { coins: 110 },
  },
  {
    level: 12,
    colors: 6,
    moves: 20,
    goals: [
      { type: 'collect', color: 'orange', count: 14 },
      { type: 'collect', color: 'green', count: 14 },
    ],
    stars: { one: 1, two: 4, three: 9 },
    reward: { coins: 110 },
  },
  {
    level: 13,
    colors: 6,
    moves: 18,
    goals: [
      { type: 'collect', color: 'blue', count: 15 },
      { type: 'collect', color: 'yellow', count: 12 },
      { type: 'collect', color: 'red', count: 8 },
    ],
    stars: { one: 1, two: 4, three: 8 },
    reward: { coins: 120 },
  },
  {
    level: 14,
    colors: 6,
    moves: 16,
    goals: [
      { type: 'collect', color: 'purple', count: 14 },
      { type: 'collect', color: 'orange', count: 14 },
    ],
    stars: { one: 1, two: 3, three: 7 },
    reward: { coins: 130 },
  },
  {
    level: 15,
    colors: 6,
    moves: 20,
    goals: [
      { type: 'collect', color: 'red', count: 15 },
      { type: 'collect', color: 'blue', count: 15 },
      { type: 'collect', color: 'green', count: 10 },
    ],
    stars: { one: 1, two: 5, three: 9 },
    reward: { coins: 150 },
  },
];
