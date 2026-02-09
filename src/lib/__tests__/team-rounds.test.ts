import { describe, it, expect } from 'vitest';
import { generateTeamRounds } from '../team-rounds';

describe('generateTeamRounds', () => {
  it('returns empty for n < 2', () => {
    expect(generateTeamRounds(1, 2)).toEqual([]);
  });

  it('returns empty for teamSize < 2', () => {
    expect(generateTeamRounds(6, 1)).toEqual([]);
  });

  it('generates correct number of rounds for even n', () => {
    const rounds = generateTeamRounds(6, 3);
    expect(rounds).toHaveLength(5); // effective=6, 6-1=5
  });

  it('generates correct number of rounds for odd n', () => {
    const rounds = generateTeamRounds(5, 2);
    expect(rounds).toHaveLength(5); // effective=6, 6-1=5
  });

  it('round indices are sequential', () => {
    const rounds = generateTeamRounds(8, 2);
    rounds.forEach((round, i) => {
      expect(round.index).toBe(i);
    });
  });

  it('teams contain valid student numbers', () => {
    const n = 10;
    const rounds = generateTeamRounds(n, 3);
    for (const round of rounds) {
      for (const team of round.teams) {
        for (const student of team) {
          expect(student).toBeGreaterThanOrEqual(1);
          expect(student).toBeLessThanOrEqual(n);
        }
      }
    }
  });

  it('every student appears exactly once per round (even n)', () => {
    const n = 12;
    const rounds = generateTeamRounds(n, 3);
    for (const round of rounds) {
      const seen = new Set<number>();
      for (const team of round.teams) {
        for (const student of team) {
          expect(seen.has(student)).toBe(false);
          seen.add(student);
        }
      }
      expect(seen.size).toBe(n);
    }
  });

  it('every student appears exactly once per round (odd n)', () => {
    const n = 9;
    const rounds = generateTeamRounds(n, 3);
    for (const round of rounds) {
      const seen = new Set<number>();
      for (const team of round.teams) {
        for (const student of team) {
          expect(seen.has(student)).toBe(false);
          seen.add(student);
        }
      }
      expect(seen.size).toBe(n);
    }
  });

  it('teams are approximately equal size', () => {
    const n = 10;
    const teamSize = 3;
    const rounds = generateTeamRounds(n, teamSize);
    for (const round of rounds) {
      for (const team of round.teams) {
        // Last team can be smaller
        expect(team.length).toBeGreaterThanOrEqual(1);
        expect(team.length).toBeLessThanOrEqual(teamSize);
      }
      // Most teams should be full size
      const fullTeams = round.teams.filter((t) => t.length === teamSize);
      expect(fullTeams.length).toBeGreaterThanOrEqual(Math.floor(n / teamSize) - 1);
    }
  });

  it('phantom student is excluded for odd n', () => {
    const n = 7;
    const rounds = generateTeamRounds(n, 2);
    for (const round of rounds) {
      for (const team of round.teams) {
        for (const student of team) {
          expect(student).toBeLessThanOrEqual(n);
        }
      }
    }
  });
});
