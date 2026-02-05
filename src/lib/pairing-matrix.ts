import type { Round } from '../types';

export interface CoverageStats {
  /** matrix[a][b] = round index when they were paired, or -1 */
  matrix: number[][];
  paired: number;
  total: number;
  percentage: number;
}

/**
 * Build an n×n matrix showing which round each pair of students met.
 * Only considers completed rounds.
 */
export function computeCoverageStats(
  n: number,
  allRounds: Round[],
  completedIndices: number[],
): CoverageStats {
  // Initialize matrix with -1
  const matrix: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(n + 1).fill(-1),
  );

  let paired = 0;
  for (const ri of completedIndices) {
    const round = allRounds[ri];
    if (!round) continue;
    for (const [a, b] of round.pairs) {
      if (matrix[a][b] === -1) {
        matrix[a][b] = ri;
        matrix[b][a] = ri;
        paired++;
      }
    }
  }

  const total = (n * (n - 1)) / 2;
  return {
    matrix,
    paired,
    total,
    percentage: total > 0 ? (paired / total) * 100 : 0,
  };
}
