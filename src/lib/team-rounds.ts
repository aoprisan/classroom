import type { TeamRound } from '../types';

/**
 * Generate all team rounds using the round-robin circle method.
 * Same rotation as round-robin.ts but partitions into groups of teamSize
 * instead of folding into pairs.
 */
export function generateTeamRounds(n: number, teamSize: number): TeamRound[] {
  if (n < 2 || teamSize < 2) return [];

  const effective = n % 2 !== 0 ? n + 1 : n;
  const list = Array.from({ length: effective - 1 }, (_, i) => i + 2);
  const rounds: TeamRound[] = [];

  for (let r = 0; r < effective - 1; r++) {
    // Build the full ordering for this round
    const ordering = [1, ...list];

    // Filter out phantom student if n is odd
    const realStudents = n % 2 !== 0
      ? ordering.filter((s) => s <= n)
      : ordering;

    // Partition into consecutive groups of teamSize
    const teams: number[][] = [];
    for (let i = 0; i < realStudents.length; i += teamSize) {
      teams.push(realStudents.slice(i, i + teamSize));
    }

    rounds.push({ index: r, teams });

    // Rotate: last element moves to front
    const last = list.pop()!;
    list.unshift(last);
  }

  return rounds;
}
