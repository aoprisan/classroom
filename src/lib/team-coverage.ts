import type { TeamRound } from '../types';

export interface TeamCoverageStats {
  /** matrix[a][b] = round index when they first shared a team, or -1 */
  matrix: number[][];
  paired: number;
  total: number;
  percentage: number;
}

/**
 * Build an n×n matrix showing which round each pair of students
 * first shared a team. Only considers completed rounds.
 */
export function computeTeamCoverageStats(
  n: number,
  allRounds: TeamRound[],
  completedIndices: number[],
): TeamCoverageStats {
  const matrix: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(n + 1).fill(-1),
  );

  let paired = 0;
  for (const ri of completedIndices) {
    const round = allRounds[ri];
    if (!round) continue;
    for (const team of round.teams) {
      for (let i = 0; i < team.length; i++) {
        for (let j = i + 1; j < team.length; j++) {
          const a = team[i];
          const b = team[j];
          if (matrix[a][b] === -1) {
            matrix[a][b] = ri;
            matrix[b][a] = ri;
            paired++;
          }
        }
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
