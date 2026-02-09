import { describe, it, expect } from 'vitest';
import { computeTeamCoverageStats } from '../team-coverage';
import { generateTeamRounds } from '../team-rounds';

describe('computeTeamCoverageStats', () => {
  it('returns zero coverage with no completed rounds', () => {
    const rounds = generateTeamRounds(6, 3);
    const stats = computeTeamCoverageStats(6, rounds, []);
    expect(stats.paired).toBe(0);
    expect(stats.percentage).toBe(0);
    expect(stats.total).toBe(15); // C(6,2)
  });

  it('counts team members as paired after one round', () => {
    const rounds = generateTeamRounds(6, 3);
    const stats = computeTeamCoverageStats(6, rounds, [0]);
    // 2 teams of 3: each team produces C(3,2) = 3 pairs, total 6
    expect(stats.paired).toBe(6);
  });

  it('matrix is symmetric', () => {
    const n = 8;
    const rounds = generateTeamRounds(n, 4);
    const stats = computeTeamCoverageStats(n, rounds, [0, 1]);
    for (let a = 1; a <= n; a++) {
      for (let b = 1; b <= n; b++) {
        expect(stats.matrix[a][b]).toBe(stats.matrix[b][a]);
      }
    }
  });

  it('diagonal is always -1', () => {
    const n = 6;
    const rounds = generateTeamRounds(n, 3);
    const stats = computeTeamCoverageStats(n, rounds, [0]);
    for (let i = 1; i <= n; i++) {
      expect(stats.matrix[i][i]).toBe(-1);
    }
  });

  it('coverage increases with more rounds', () => {
    const n = 8;
    const rounds = generateTeamRounds(n, 2);
    const stats1 = computeTeamCoverageStats(n, rounds, [0]);
    const stats2 = computeTeamCoverageStats(n, rounds, [0, 1]);
    expect(stats2.paired).toBeGreaterThanOrEqual(stats1.paired);
    expect(stats2.percentage).toBeGreaterThanOrEqual(stats1.percentage);
  });

  it('percentage calculation is correct', () => {
    const n = 4;
    const rounds = generateTeamRounds(n, 2);
    const stats = computeTeamCoverageStats(n, rounds, [0]);
    const expected = (stats.paired / stats.total) * 100;
    expect(stats.percentage).toBeCloseTo(expected);
  });
});
