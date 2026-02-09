import { describe, it, expect } from 'vitest';
import { computeCoverageStats } from '../pairing-matrix';
import { generateAllRounds } from '../round-robin';

describe('computeCoverageStats', () => {
  it('returns zero coverage with no completed rounds', () => {
    const rounds = generateAllRounds(4);
    const stats = computeCoverageStats(4, rounds, []);
    expect(stats.paired).toBe(0);
    expect(stats.percentage).toBe(0);
    expect(stats.total).toBe(6); // C(4,2) = 6
  });

  it('counts pairs correctly after one round', () => {
    const rounds = generateAllRounds(4);
    const stats = computeCoverageStats(4, rounds, [0]);
    expect(stats.paired).toBe(2); // 4/2 = 2 pairs in one round
    expect(stats.total).toBe(6);
  });

  it('achieves 100% coverage after all rounds', () => {
    const n = 6;
    const rounds = generateAllRounds(n);
    const allIndices = rounds.map((_, i) => i);
    const stats = computeCoverageStats(n, rounds, allIndices);
    expect(stats.paired).toBe(15); // C(6,2) = 15
    expect(stats.percentage).toBe(100);
  });

  it('matrix is symmetric', () => {
    const n = 6;
    const rounds = generateAllRounds(n);
    const stats = computeCoverageStats(n, rounds, [0, 1]);
    for (let a = 1; a <= n; a++) {
      for (let b = 1; b <= n; b++) {
        expect(stats.matrix[a][b]).toBe(stats.matrix[b][a]);
      }
    }
  });

  it('diagonal is always -1', () => {
    const n = 4;
    const rounds = generateAllRounds(n);
    const stats = computeCoverageStats(n, rounds, [0, 1, 2]);
    for (let i = 1; i <= n; i++) {
      expect(stats.matrix[i][i]).toBe(-1);
    }
  });

  it('records the correct round index in matrix', () => {
    const n = 4;
    const rounds = generateAllRounds(n);
    const stats = computeCoverageStats(n, rounds, [0]);
    for (const [a, b] of rounds[0].pairs) {
      expect(stats.matrix[a][b]).toBe(0);
      expect(stats.matrix[b][a]).toBe(0);
    }
  });

  it('does not double count repeated pairings', () => {
    const n = 6;
    const rounds = generateAllRounds(n);
    // Complete all rounds
    const allIndices = rounds.map((_, i) => i);
    const stats = computeCoverageStats(n, rounds, allIndices);
    // Since round-robin produces unique pairs, we should get exactly C(n,2)
    expect(stats.paired).toBe((n * (n - 1)) / 2);
  });
});
