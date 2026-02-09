import { describe, it, expect } from 'vitest';
import { generateAllRounds } from '../round-robin';

describe('generateAllRounds', () => {
  it('generates n-1 rounds for even student count', () => {
    const rounds = generateAllRounds(4);
    expect(rounds).toHaveLength(3); // 4-1 = 3
  });

  it('generates n rounds for odd student count', () => {
    const rounds = generateAllRounds(5);
    expect(rounds).toHaveLength(5); // odd: effective=6, 6-1=5
  });

  it('each round has correct number of pairs for even count', () => {
    const rounds = generateAllRounds(6);
    for (const round of rounds) {
      expect(round.pairs).toHaveLength(3); // 6/2 = 3
      expect(round.sitsAlone).toBeUndefined();
    }
  });

  it('each round has one sits-alone student for odd count', () => {
    const rounds = generateAllRounds(5);
    for (const round of rounds) {
      expect(round.pairs).toHaveLength(2); // (5-1)/2 = 2
      expect(round.sitsAlone).toBeDefined();
      expect(round.sitsAlone).toBeGreaterThanOrEqual(1);
      expect(round.sitsAlone).toBeLessThanOrEqual(5);
    }
  });

  it('round indices are sequential', () => {
    const rounds = generateAllRounds(8);
    rounds.forEach((round, i) => {
      expect(round.index).toBe(i);
    });
  });

  it('pairs contain valid student numbers', () => {
    const n = 10;
    const rounds = generateAllRounds(n);
    for (const round of rounds) {
      for (const [a, b] of round.pairs) {
        expect(a).toBeGreaterThanOrEqual(1);
        expect(a).toBeLessThanOrEqual(n);
        expect(b).toBeGreaterThanOrEqual(1);
        expect(b).toBeLessThanOrEqual(n);
        expect(a).not.toBe(b);
      }
    }
  });

  it('every student appears exactly once per round (even)', () => {
    const n = 8;
    const rounds = generateAllRounds(n);
    for (const round of rounds) {
      const seen = new Set<number>();
      for (const [a, b] of round.pairs) {
        expect(seen.has(a)).toBe(false);
        expect(seen.has(b)).toBe(false);
        seen.add(a);
        seen.add(b);
      }
      expect(seen.size).toBe(n);
    }
  });

  it('every student appears exactly once per round (odd)', () => {
    const n = 7;
    const rounds = generateAllRounds(n);
    for (const round of rounds) {
      const seen = new Set<number>();
      for (const [a, b] of round.pairs) {
        seen.add(a);
        seen.add(b);
      }
      if (round.sitsAlone !== undefined) {
        seen.add(round.sitsAlone);
      }
      expect(seen.size).toBe(n);
    }
  });

  it('achieves full pairing coverage after all rounds', () => {
    const n = 6;
    const rounds = generateAllRounds(n);
    const pairSet = new Set<string>();
    for (const round of rounds) {
      for (const [a, b] of round.pairs) {
        const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
        pairSet.add(key);
      }
    }
    const expectedPairs = (n * (n - 1)) / 2;
    expect(pairSet.size).toBe(expectedPairs);
  });

  it('no duplicate pairs across rounds', () => {
    const n = 10;
    const rounds = generateAllRounds(n);
    const pairSet = new Set<string>();
    for (const round of rounds) {
      for (const [a, b] of round.pairs) {
        const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
        expect(pairSet.has(key)).toBe(false);
        pairSet.add(key);
      }
    }
  });

  it('pairs are normalized (smaller number first)', () => {
    const rounds = generateAllRounds(12);
    for (const round of rounds) {
      for (const [a, b] of round.pairs) {
        expect(a).toBeLessThan(b);
      }
    }
  });

  it('handles minimum student count of 4', () => {
    const rounds = generateAllRounds(4);
    expect(rounds).toHaveLength(3);
    expect(rounds[0].pairs).toHaveLength(2);
  });

  it('handles large student count of 60', () => {
    const rounds = generateAllRounds(60);
    expect(rounds).toHaveLength(59);
    for (const round of rounds) {
      expect(round.pairs).toHaveLength(30);
    }
  });
});
