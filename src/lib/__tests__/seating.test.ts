import { describe, it, expect } from 'vitest';
import { computeFallbackHeight, sortPairsByHeight, distributeBenches } from '../seating';
import type { Pair, StudentMetaMap, LayoutConfig } from '../../types';

describe('computeFallbackHeight', () => {
  it('returns 150 for empty meta map', () => {
    expect(computeFallbackHeight({})).toBe(150);
  });

  it('returns 150 for meta map with all null heights', () => {
    const meta: StudentMetaMap = {
      1: { firstName: 'A', lastName: 'B', heightCm: null, gender: 'M' },
      2: { firstName: 'C', lastName: 'D', heightCm: null, gender: 'F' },
    };
    expect(computeFallbackHeight(meta)).toBe(150);
  });

  it('returns median for odd count of known heights', () => {
    const meta: StudentMetaMap = {
      1: { firstName: 'A', lastName: 'B', heightCm: 140, gender: 'M' },
      2: { firstName: 'C', lastName: 'D', heightCm: 150, gender: 'F' },
      3: { firstName: 'E', lastName: 'F', heightCm: 160, gender: 'M' },
    };
    expect(computeFallbackHeight(meta)).toBe(150);
  });

  it('returns average of middle two for even count', () => {
    const meta: StudentMetaMap = {
      1: { firstName: 'A', lastName: 'B', heightCm: 140, gender: 'M' },
      2: { firstName: 'C', lastName: 'D', heightCm: 150, gender: 'F' },
      3: { firstName: 'E', lastName: 'F', heightCm: 160, gender: 'M' },
      4: { firstName: 'G', lastName: 'H', heightCm: 170, gender: 'F' },
    };
    expect(computeFallbackHeight(meta)).toBe(155);
  });
});

describe('sortPairsByHeight', () => {
  it('sorts pairs by average height ascending', () => {
    const pairs: Pair[] = [[1, 2], [3, 4], [5, 6]];
    const meta: StudentMetaMap = {
      1: { firstName: 'A', lastName: 'B', heightCm: 170, gender: 'M' },
      2: { firstName: 'C', lastName: 'D', heightCm: 170, gender: 'F' }, // avg 170
      3: { firstName: 'E', lastName: 'F', heightCm: 130, gender: 'M' },
      4: { firstName: 'G', lastName: 'H', heightCm: 130, gender: 'F' }, // avg 130
      5: { firstName: 'I', lastName: 'J', heightCm: 150, gender: 'M' },
      6: { firstName: 'K', lastName: 'L', heightCm: 150, gender: 'F' }, // avg 150
    };
    const sorted = sortPairsByHeight(pairs, meta);
    expect(sorted).toEqual([[3, 4], [5, 6], [1, 2]]);
  });

  it('does not mutate original array', () => {
    const pairs: Pair[] = [[1, 2], [3, 4]];
    const meta: StudentMetaMap = {
      1: { firstName: 'A', lastName: 'B', heightCm: 170, gender: 'M' },
      2: { firstName: 'C', lastName: 'D', heightCm: 170, gender: 'F' },
      3: { firstName: 'E', lastName: 'F', heightCm: 130, gender: 'M' },
      4: { firstName: 'G', lastName: 'H', heightCm: 130, gender: 'F' },
    };
    const original = [...pairs];
    sortPairsByHeight(pairs, meta);
    expect(pairs).toEqual(original);
  });
});

describe('distributeBenches', () => {
  it('distributes evenly when divisible', () => {
    const config: LayoutConfig = { totalStudents: 12, rowCount: 3, studentsPerBench: 2, pairingMode: 'random' };
    expect(distributeBenches(config)).toEqual([2, 2, 2]);
  });

  it('distributes remainder to first rows', () => {
    const config: LayoutConfig = { totalStudents: 10, rowCount: 3, studentsPerBench: 2, pairingMode: 'random' };
    // 5 benches / 3 rows = 1 base + 2 remainder
    expect(distributeBenches(config)).toEqual([2, 2, 1]);
  });

  it('handles single row', () => {
    const config: LayoutConfig = { totalStudents: 8, rowCount: 1, studentsPerBench: 2, pairingMode: 'random' };
    expect(distributeBenches(config)).toEqual([4]);
  });

  it('handles odd student count (rounds up benches)', () => {
    const config: LayoutConfig = { totalStudents: 7, rowCount: 2, studentsPerBench: 2, pairingMode: 'random' };
    // 4 benches / 2 rows
    expect(distributeBenches(config)).toEqual([2, 2]);
  });

  it('total benches sums correctly', () => {
    const config: LayoutConfig = { totalStudents: 28, rowCount: 3, studentsPerBench: 2, pairingMode: 'random' };
    const rows = distributeBenches(config);
    const total = rows.reduce((s, r) => s + r, 0);
    expect(total).toBe(14); // ceil(28/2) = 14
  });
});
