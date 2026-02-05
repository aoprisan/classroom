import type { Pair, Round } from '../types';

/**
 * Generate all rounds using the round-robin circle method.
 * Fix student 1 in place. Rotate students 2..n each round.
 * For odd n, add a phantom student; one student sits alone per round.
 */
export function generateAllRounds(n: number): Round[] {
  const isOdd = n % 2 !== 0;
  const effective = isOdd ? n + 1 : n;
  const phantom = isOdd ? effective : -1; // phantom student number

  // Students 2..effective arranged in a list
  const list = Array.from({ length: effective - 1 }, (_, i) => i + 2);
  const rounds: Round[] = [];

  for (let r = 0; r < effective - 1; r++) {
    const pairs: Pair[] = [];
    let sitsAlone: number | undefined;

    // Pair fixed student (1) with first in list
    const partner = list[0];
    if (partner === phantom) {
      sitsAlone = 1;
    } else if (1 === phantom) {
      // can't happen since phantom > n
    } else {
      pairs.push([1, partner]);
    }

    // Fold: pair index i with index (len-1-i)
    const half = (effective - 2) / 2;
    for (let i = 0; i < half; i++) {
      const a = list[1 + i];
      const b = list[effective - 2 - i];
      if (a === phantom) {
        sitsAlone = b;
      } else if (b === phantom) {
        sitsAlone = a;
      } else {
        pairs.push([Math.min(a, b), Math.max(a, b)]);
      }
    }

    rounds.push({ index: r, pairs, sitsAlone });

    // Rotate: last element moves to front
    const last = list.pop()!;
    list.unshift(last);
  }

  return rounds;
}
