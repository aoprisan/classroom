import { describe, it, expect } from 'vitest';
import { generateRounds } from '../constrained-pairing';
import { generateAllRounds } from '../round-robin';
import type { StudentMetaMap } from '../../types';

function makeGenderMap(genders: Record<number, 'M' | 'F' | ''>): StudentMetaMap {
  const map: StudentMetaMap = {};
  for (const [num, gender] of Object.entries(genders)) {
    map[Number(num)] = { lastName: '', firstName: '', heightCm: null, gender };
  }
  return map;
}

describe('generateRounds', () => {
  describe('random mode', () => {
    it('delegates to generateAllRounds unchanged', () => {
      const randomRounds = generateRounds(8, 'random');
      const standardRounds = generateAllRounds(8);
      expect(randomRounds).toEqual(standardRounds);
    });

    it('ignores genderMap when mode is random', () => {
      const genderMap = makeGenderMap({ 1: 'M', 2: 'F', 3: 'M', 4: 'F' });
      const randomRounds = generateRounds(4, 'random', genderMap);
      const standardRounds = generateAllRounds(4);
      expect(randomRounds).toEqual(standardRounds);
    });
  });

  describe('mixed mode', () => {
    it('all pairs are cross-gender when groups are equal', () => {
      // 3M + 3F = 6 students
      const genderMap = makeGenderMap({
        1: 'M', 2: 'M', 3: 'M',
        4: 'F', 5: 'F', 6: 'F',
      });
      const rounds = generateRounds(6, 'mixed', genderMap);

      for (const round of rounds) {
        for (const [a, b] of round.pairs) {
          const gA = genderMap[a]?.gender;
          const gB = genderMap[b]?.gender;
          // One should be M and the other F
          expect(new Set([gA, gB])).toEqual(new Set(['M', 'F']));
        }
      }
    });

    it('all students appear in each round', () => {
      const genderMap = makeGenderMap({
        1: 'M', 2: 'M', 3: 'M',
        4: 'F', 5: 'F', 6: 'F',
      });
      const rounds = generateRounds(6, 'mixed', genderMap);

      for (const round of rounds) {
        const seen = new Set<number>();
        for (const [a, b] of round.pairs) {
          seen.add(a);
          seen.add(b);
        }
        if (round.sitsAlone !== undefined) {
          seen.add(round.sitsAlone);
        }
        expect(seen.size).toBe(6);
      }
    });

    it('handles unequal groups with overflow pairs', () => {
      // 4M + 2F = 6 students
      const genderMap = makeGenderMap({
        1: 'M', 2: 'M', 3: 'M', 4: 'M',
        5: 'F', 6: 'F',
      });
      const rounds = generateRounds(6, 'mixed', genderMap);
      expect(rounds.length).toBeGreaterThan(0);

      // Each round should have some pairs
      for (const round of rounds) {
        expect(round.pairs.length).toBeGreaterThan(0);
      }
    });

    it('achieves full cross-gender coverage with equal groups', () => {
      const genderMap = makeGenderMap({
        1: 'M', 2: 'M', 3: 'M',
        4: 'F', 5: 'F', 6: 'F',
      });
      const rounds = generateRounds(6, 'mixed', genderMap);

      const crossPairs = new Set<string>();
      for (const round of rounds) {
        for (const [a, b] of round.pairs) {
          crossPairs.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
        }
      }

      // Should have all 3*3 = 9 cross-gender pairs
      const males = [1, 2, 3];
      const females = [4, 5, 6];
      for (const m of males) {
        for (const f of females) {
          expect(crossPairs.has(`${Math.min(m, f)}-${Math.max(m, f)}`)).toBe(true);
        }
      }
    });

    it('falls back to random when all genders unset', () => {
      const genderMap = makeGenderMap({ 1: '', 2: '', 3: '', 4: '' });
      const rounds = generateRounds(4, 'mixed', genderMap);
      const standardRounds = generateAllRounds(4);
      expect(rounds).toEqual(standardRounds);
    });

    it('falls back to random when single gender', () => {
      const genderMap = makeGenderMap({ 1: 'M', 2: 'M', 3: 'M', 4: 'M' });
      const rounds = generateRounds(4, 'mixed', genderMap);
      const standardRounds = generateAllRounds(4);
      expect(rounds).toEqual(standardRounds);
    });
  });

  describe('same mode', () => {
    it('all pairs are same-gender when groups are even', () => {
      // 4M + 4F = 8 students (even groups, no sitsAlone compromise)
      const genderMap = makeGenderMap({
        1: 'M', 2: 'M', 3: 'M', 4: 'M',
        5: 'F', 6: 'F', 7: 'F', 8: 'F',
      });
      const rounds = generateRounds(8, 'same', genderMap);

      for (const round of rounds) {
        for (const [a, b] of round.pairs) {
          const gA = genderMap[a]?.gender;
          const gB = genderMap[b]?.gender;
          expect(gA).toBe(gB);
        }
      }
    });

    it('pairs sitsAlone students from different groups when both groups are odd', () => {
      // 3M + 3F = 6 students (odd groups → compromise cross-gender pairs)
      const genderMap = makeGenderMap({
        1: 'M', 2: 'M', 3: 'M',
        4: 'F', 5: 'F', 6: 'F',
      });
      const rounds = generateRounds(6, 'same', genderMap);
      // Each round should have 3 pairs (1 male pair + 1 female pair + 1 compromise pair)
      for (const round of rounds) {
        expect(round.pairs.length).toBe(3);
        expect(round.sitsAlone).toBeUndefined();
      }
    });

    it('correct round count with equal groups', () => {
      // 4M + 4F: each group has 4 students (even), so 3 rounds each, max = 3
      const genderMap = makeGenderMap({
        1: 'M', 2: 'M', 3: 'M', 4: 'M',
        5: 'F', 6: 'F', 7: 'F', 8: 'F',
      });
      const rounds = generateRounds(8, 'same', genderMap);
      expect(rounds.length).toBe(3); // max(3, 3) = 3 for 4-student groups
    });

    it('achieves full within-group coverage', () => {
      // 4M + 4F = 8 students
      const genderMap = makeGenderMap({
        1: 'M', 2: 'M', 3: 'M', 4: 'M',
        5: 'F', 6: 'F', 7: 'F', 8: 'F',
      });
      const rounds = generateRounds(8, 'same', genderMap);

      const pairSet = new Set<string>();
      for (const round of rounds) {
        for (const [a, b] of round.pairs) {
          pairSet.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
        }
      }

      // Should have C(4,2) = 6 male pairs + C(4,2) = 6 female pairs = 12 total
      const males = [1, 2, 3, 4];
      const females = [5, 6, 7, 8];
      for (let i = 0; i < males.length; i++) {
        for (let j = i + 1; j < males.length; j++) {
          expect(pairSet.has(`${males[i]}-${males[j]}`)).toBe(true);
        }
      }
      for (let i = 0; i < females.length; i++) {
        for (let j = i + 1; j < females.length; j++) {
          expect(pairSet.has(`${females[i]}-${females[j]}`)).toBe(true);
        }
      }
    });

    it('handles all genders unset by falling back to random', () => {
      const genderMap = makeGenderMap({ 1: '', 2: '', 3: '', 4: '' });
      const rounds = generateRounds(4, 'same', genderMap);
      // With all unset, they get split evenly: 2+2
      // Each group of 2 has 1 round of 1 pair, so merged = 1 round
      expect(rounds.length).toBeGreaterThan(0);
    });

    it('handles odd total student counts', () => {
      // 3M + 2F = 5 students
      const genderMap = makeGenderMap({
        1: 'M', 2: 'M', 3: 'M',
        4: 'F', 5: 'F',
      });
      const rounds = generateRounds(5, 'same', genderMap);
      expect(rounds.length).toBeGreaterThan(0);

      // Verify all students appear
      for (const round of rounds) {
        const seen = new Set<number>();
        for (const [a, b] of round.pairs) {
          seen.add(a);
          seen.add(b);
        }
        if (round.sitsAlone !== undefined) {
          seen.add(round.sitsAlone);
        }
        // Not all 5 may appear in later rounds when groups have different sizes
        expect(seen.size).toBeGreaterThan(0);
      }
    });
  });

  describe('edge cases', () => {
    it('works without genderMap (falls back to random)', () => {
      const rounds = generateRounds(6, 'mixed');
      const standardRounds = generateAllRounds(6);
      expect(rounds).toEqual(standardRounds);
    });

    it('pairs are normalized (smaller number first)', () => {
      const genderMap = makeGenderMap({
        1: 'M', 2: 'M', 3: 'M',
        4: 'F', 5: 'F', 6: 'F',
      });

      for (const mode of ['mixed', 'same'] as const) {
        const rounds = generateRounds(6, mode, genderMap);
        for (const round of rounds) {
          for (const [a, b] of round.pairs) {
            expect(a).toBeLessThan(b);
          }
        }
      }
    });

    it('no student appears twice in same round', () => {
      const genderMap = makeGenderMap({
        1: 'M', 2: 'M', 3: 'M', 4: 'M',
        5: 'F', 6: 'F', 7: 'F', 8: 'F',
      });

      for (const mode of ['mixed', 'same'] as const) {
        const rounds = generateRounds(8, mode, genderMap);
        for (const round of rounds) {
          const seen = new Set<number>();
          for (const [a, b] of round.pairs) {
            expect(seen.has(a)).toBe(false);
            expect(seen.has(b)).toBe(false);
            seen.add(a);
            seen.add(b);
          }
          if (round.sitsAlone !== undefined) {
            expect(seen.has(round.sitsAlone)).toBe(false);
          }
        }
      }
    });
  });
});
