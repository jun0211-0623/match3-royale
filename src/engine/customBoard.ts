// Custom match-3 engine — no external dependencies
// Row-major: orbs[row][col], row 0 = top of board

export type SpecialType = 'line-h' | 'line-v' | 'bomb' | 'rainbow';

export interface SpecialGem {
  type: SpecialType;
  gemType: number;
}

export interface MatchGroup {
  cells: [number, number][];   // [row, col][]
  gemType: number;
  specialType: SpecialType | null;
  spawnAt: [number, number] | null;  // where special gem spawns
}

export interface EvalResult {
  matches: MatchGroup[];
  allMatched: [number, number][];   // ALL matched cells (for dying animation)
  cleared: [number, number][];      // cells removed by gravity (NOT spawn positions)
  colCounts: Map<number, number>;   // column → cleared count (for fall animation)
  spawned: Array<{ row: number; col: number; gemType: number; type: SpecialType }>;
}

export class CustomBoard {
  rows: number;
  cols: number;
  types: number[];
  orbs: number[][];

  constructor(rows: number, cols: number, types: number[]) {
    this.rows = rows;
    this.cols = cols;
    this.types = types;
    do {
      this.orbs = this._generate();
      this._removeMatches();
    } while (!this._hasPotentialMove());
  }

  private _rand(): number {
    return this.types[Math.floor(Math.random() * this.types.length)];
  }

  private _generate(): number[][] {
    return Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => this._rand())
    );
  }

  // ── O(n²) match check ──────────────────────────────────────────────
  hasMatch(): boolean {
    for (let r = 0; r < this.rows; r++) {
      let cnt = 1;
      for (let c = 1; c < this.cols; c++) {
        if (this.orbs[r][c] === this.orbs[r][c - 1]) { if (++cnt >= 3) return true; }
        else cnt = 1;
      }
    }
    for (let c = 0; c < this.cols; c++) {
      let cnt = 1;
      for (let r = 1; r < this.rows; r++) {
        if (this.orbs[r][c] === this.orbs[r - 1][c]) { if (++cnt >= 3) return true; }
        else cnt = 1;
      }
    }
    return false;
  }

  // ── Find all match groups ──────────────────────────────────────────
  findMatches(): MatchGroup[] {
    interface Run { cells: [number, number][]; gemType: number; dir: 'h' | 'v'; }
    const runs: Run[] = [];

    // Horizontal runs ≥ 3
    for (let r = 0; r < this.rows; r++) {
      let s = 0;
      while (s < this.cols) {
        let e = s + 1;
        while (e < this.cols && this.orbs[r][e] === this.orbs[r][s]) e++;
        if (e - s >= 3) {
          const cells: [number, number][] = [];
          for (let c = s; c < e; c++) cells.push([r, c]);
          runs.push({ cells, gemType: this.orbs[r][s], dir: 'h' });
        }
        s = e;
      }
    }

    // Vertical runs ≥ 3
    for (let c = 0; c < this.cols; c++) {
      let s = 0;
      while (s < this.rows) {
        let e = s + 1;
        while (e < this.rows && this.orbs[e][c] === this.orbs[s][c]) e++;
        if (e - s >= 3) {
          const cells: [number, number][] = [];
          for (let r = s; r < e; r++) cells.push([r, c]);
          runs.push({ cells, gemType: this.orbs[s][c], dir: 'v' });
        }
        s = e;
      }
    }

    // Merge overlapping H+V runs transitively → bomb groups
    const mergedIdx = new Set<number>();
    const groups: MatchGroup[] = [];

    for (let i = 0; i < runs.length; i++) {
      if (mergedIdx.has(i)) continue;

      // BFS: collect all runs that overlap (H↔V pairs only)
      const groupIdxs = new Set<number>([i]);
      let changed = true;
      while (changed) {
        changed = false;
        for (let j = 0; j < runs.length; j++) {
          if (groupIdxs.has(j)) continue;
          const hasOverlap = [...groupIdxs].some(gi => {
            if (runs[gi].dir === runs[j].dir) return false;
            return runs[gi].cells.some(([r1, c1]) =>
              runs[j].cells.some(([r2, c2]) => r1 === r2 && c1 === c2)
            );
          });
          if (hasOverlap) { groupIdxs.add(j); changed = true; }
        }
      }

      if (groupIdxs.size > 1) {
        // Build bomb group: merge cells, find intersection
        const cellKeys = new Set<string>();
        const allCells: [number, number][] = [];
        groupIdxs.forEach(gi => {
          mergedIdx.add(gi);
          runs[gi].cells.forEach(cell => {
            const key = `${cell[0]},${cell[1]}`;
            if (!cellKeys.has(key)) { cellKeys.add(key); allCells.push(cell); }
          });
        });

        // Find intersection (H cell that also appears in a V run)
        let intersection: [number, number] | null = null;
        const hIdxs = [...groupIdxs].filter(gi => runs[gi].dir === 'h');
        const vIdxs = [...groupIdxs].filter(gi => runs[gi].dir === 'v');
        outer: for (const hi of hIdxs) {
          for (const [r1, c1] of runs[hi].cells) {
            for (const vi of vIdxs) {
              for (const [r2, c2] of runs[vi].cells) {
                if (r1 === r2 && c1 === c2) { intersection = [r1, c1]; break outer; }
              }
            }
          }
        }
        mergedIdx.add(i);
        groups.push({ cells: allCells, gemType: runs[i].gemType, specialType: 'bomb', spawnAt: intersection });
      }
    }

    // Add non-merged runs with individual special types
    for (let i = 0; i < runs.length; i++) {
      if (mergedIdx.has(i)) continue;
      const run = runs[i];
      const len = run.cells.length;
      let special: SpecialType | null = null;
      let spawnAt: [number, number] | null = null;
      if (len >= 5) {
        special = 'rainbow';
        spawnAt = run.cells[Math.floor((len - 1) / 2)];
      } else if (len === 4) {
        special = run.dir === 'h' ? 'line-h' : 'line-v';
        spawnAt = run.cells[Math.floor((len - 1) / 2)];
      }
      groups.push({ cells: run.cells, gemType: run.gemType, specialType: special, spawnAt });
    }

    return groups;
  }

  // ── Evaluate: clear matches, spawn specials, apply gravity ─────────
  evaluate(): EvalResult {
    const matches = this.findMatches();
    if (matches.length === 0) {
      return { matches, allMatched: [], cleared: [], colCounts: new Map(), spawned: [] };
    }

    // Spawn map: "row,col" → { gemType, type }
    const spawnMap = new Map<string, { gemType: number; type: SpecialType }>();
    matches.forEach(m => {
      if (m.specialType && m.spawnAt) {
        const [sr, sc] = m.spawnAt;
        spawnMap.set(`${sr},${sc}`, { gemType: m.gemType, type: m.specialType });
      }
    });

    // clearSet: all matched cells EXCEPT spawn positions (spawns stay in place)
    const clearSet = new Set<string>();
    matches.forEach(m => {
      m.cells.forEach(([r, c]) => {
        const key = `${r},${c}`;
        if (!spawnMap.has(key)) clearSet.add(key);
      });
    });

    // allMatched = clearSet + spawn positions (for dying animation)
    const allMatched: [number, number][] = [];
    clearSet.forEach(key => { const [r, c] = key.split(',').map(Number); allMatched.push([r, c]); });
    spawnMap.forEach((_, key) => { const [r, c] = key.split(',').map(Number); allMatched.push([r, c]); });

    // colCounts: cleared (non-spawn) cells per column — drives fall animation
    const colCounts = new Map<number, number>();
    clearSet.forEach(key => {
      const c = parseInt(key.split(',')[1]);
      colCounts.set(c, (colCounts.get(c) ?? 0) + 1);
    });

    // Apply gravity: surviving gems fall down, new gems fill top
    const newOrbs = this.orbs.map(row => [...row]);
    for (let c = 0; c < this.cols; c++) {
      const count = colCounts.get(c) ?? 0;
      if (count === 0) continue;
      const surviving: number[] = [];
      for (let r = this.rows - 1; r >= 0; r--) {
        if (!clearSet.has(`${r},${c}`)) surviving.push(newOrbs[r][c]);
      }
      let ri = this.rows - 1;
      for (const gem of surviving) newOrbs[ri--][c] = gem;
      while (ri >= 0) newOrbs[ri--][c] = this._rand();
    }

    // Overwrite spawn positions with the correct special gem color
    spawnMap.forEach(({ gemType }, key) => {
      const [r, c] = key.split(',').map(Number);
      newOrbs[r][c] = gemType;
    });

    this.orbs = newOrbs;

    const cleared: [number, number][] = [];
    clearSet.forEach(key => { const [r, c] = key.split(',').map(Number); cleared.push([r, c]); });

    const spawned: EvalResult['spawned'] = [];
    spawnMap.forEach(({ gemType, type }, key) => {
      const [r, c] = key.split(',').map(Number);
      spawned.push({ row: r, col: c, gemType, type });
    });

    return { matches, allMatched, cleared, colCounts, spawned };
  }

  // ── Clear specific cells (special gem activation) ──────────────────
  clearCells(cells: [number, number][]): EvalResult {
    const clearSet = new Set<string>(cells.map(([r, c]) => `${r},${c}`));
    const colCounts = new Map<number, number>();
    clearSet.forEach(key => {
      const c = parseInt(key.split(',')[1]);
      colCounts.set(c, (colCounts.get(c) ?? 0) + 1);
    });

    const newOrbs = this.orbs.map(row => [...row]);
    for (let c = 0; c < this.cols; c++) {
      const count = colCounts.get(c) ?? 0;
      if (count === 0) continue;
      const surviving: number[] = [];
      for (let r = this.rows - 1; r >= 0; r--) {
        if (!clearSet.has(`${r},${c}`)) surviving.push(newOrbs[r][c]);
      }
      let ri = this.rows - 1;
      for (const gem of surviving) newOrbs[ri--][c] = gem;
      while (ri >= 0) newOrbs[ri--][c] = this._rand();
    }

    this.orbs = newOrbs;
    return { matches: [], allMatched: cells, cleared: cells, colCounts, spawned: [] };
  }

  // ── Swap two cells ─────────────────────────────────────────────────
  swap(r1: number, c1: number, r2: number, c2: number): void {
    const tmp = this.orbs[r1][c1];
    this.orbs[r1][c1] = this.orbs[r2][c2];
    this.orbs[r2][c2] = tmp;
  }

  // ── Deadlock detection ─────────────────────────────────────────────
  needsShuffle(): boolean {
    return !this._hasPotentialMove();
  }

  private _hasPotentialMove(): boolean {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (c + 1 < this.cols) {
          this.swap(r, c, r, c + 1);
          const has = this.hasMatch();
          this.swap(r, c, r, c + 1);
          if (has) return true;
        }
        if (r + 1 < this.rows) {
          this.swap(r, c, r + 1, c);
          const has = this.hasMatch();
          this.swap(r, c, r + 1, c);
          if (has) return true;
        }
      }
    }
    return false;
  }

  // ── Shuffle (Fisher-Yates + remove initial matches) ────────────────
  shuffle(): void {
    let attempts = 0;
    do {
      const flat = this.orbs.flat();
      for (let i = flat.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flat[i], flat[j]] = [flat[j], flat[i]];
      }
      for (let r = 0; r < this.rows; r++)
        for (let c = 0; c < this.cols; c++)
          this.orbs[r][c] = flat[r * this.cols + c];
      this._removeMatches();
    } while (!this._hasPotentialMove() && ++attempts < 20);
  }

  // Remove initial matches by replacing mid-cell with a different type
  private _removeMatches(): void {
    let iters = 0;
    while (this.hasMatch() && iters++ < 200) {
      const matches = this.findMatches();
      if (!matches.length) break;
      const [r, c] = matches[0].cells[Math.floor(matches[0].cells.length / 2)];
      const cur = this.orbs[r][c];
      const others = this.types.filter(t => t !== cur);
      this.orbs[r][c] = others.length ? others[Math.floor(Math.random() * others.length)] : this._rand();
    }
  }
}
