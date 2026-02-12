import type { PairingMode, Round, StudentMetaMap } from '../types';
import { generateAllRounds } from './round-robin';

/**
 * Partition students 1..n into male, female, and unset groups based on genderMap.
 */
function partitionByGender(
  totalStudents: number,
  genderMap: StudentMetaMap,
): { males: number[]; females: number[]; unset: number[] } {
  const males: number[] = [];
  const females: number[] = [];
  const unset: number[] = [];

  for (let i = 1; i <= totalStudents; i++) {
    const gender = genderMap[i]?.gender;
    if (gender === 'M') males.push(i);
    else if (gender === 'F') females.push(i);
    else unset.push(i);
  }

  return { males, females, unset };
}

/**
 * Remap rounds generated for students 1..m back to original student numbers.
 */
function remapRounds(rounds: Round[], mapping: number[]): Round[] {
  return rounds.map((round) => ({
    index: round.index,
    pairs: round.pairs.map(([a, b]) => {
      const ra = mapping[a - 1];
      const rb = mapping[b - 1];
      return [Math.min(ra, rb), Math.max(ra, rb)] as [number, number];
    }),
    sitsAlone: round.sitsAlone !== undefined ? mapping[round.sitsAlone - 1] : undefined,
  }));
}

/**
 * Generate mixed-gender (M/F) rounds using bipartite circle method.
 * Unset-gender students fill the smaller group to balance.
 * When groups are unequal, overflow from the larger group pairs same-gender.
 */
function generateMixedRounds(
  totalStudents: number,
  genderMap: StudentMetaMap,
): Round[] {
  const { males, females, unset } = partitionByGender(totalStudents, genderMap);

  // If no actual gender data, fall back to random
  if (males.length === 0 && females.length === 0) {
    return generateAllRounds(totalStudents);
  }

  // Assign unset students to the smaller group
  const groupA = [...males];
  const groupB = [...females];
  for (const s of unset) {
    if (groupA.length <= groupB.length) {
      groupA.push(s);
    } else {
      groupB.push(s);
    }
  }

  // If one group is empty, fall back to random
  if (groupA.length === 0 || groupB.length === 0) {
    return generateAllRounds(totalStudents);
  }

  // Determine the smaller and larger groups
  const smaller = groupA.length <= groupB.length ? groupA : groupB;
  const larger = groupA.length <= groupB.length ? groupB : groupA;

  const sSize = smaller.length;
  const lSize = larger.length;
  const overflow = larger.slice(sSize); // these must pair among themselves

  // Rotating schedule: round r pairs smaller[i] with larger[(i + r) % lSize]
  // Full cross coverage after lSize rounds
  const numCrossRounds = lSize;

  // Generate overflow rounds (same-gender pairs from the excess in the larger group)
  const overflowRounds = overflow.length >= 2 ? generateAllRounds(overflow.length) : [];

  const totalRoundCount = Math.max(numCrossRounds, overflowRounds.length);
  const rounds: Round[] = [];

  for (let r = 0; r < totalRoundCount; r++) {
    const pairs: [number, number][] = [];
    let sitsAlone: number | undefined;

    // Cross-gender pairs
    if (r < numCrossRounds) {
      for (let i = 0; i < sSize; i++) {
        const s = smaller[i];
        const l = larger[(i + r) % lSize];
        pairs.push([Math.min(s, l), Math.max(s, l)]);
      }
    }

    // Overflow same-gender pairs
    if (overflow.length >= 2 && r < overflowRounds.length) {
      const oRound = overflowRounds[r];
      for (const [a, b] of oRound.pairs) {
        const ra = overflow[a - 1];
        const rb = overflow[b - 1];
        pairs.push([Math.min(ra, rb), Math.max(ra, rb)]);
      }
      if (oRound.sitsAlone !== undefined) {
        sitsAlone = overflow[oRound.sitsAlone - 1];
      }
    } else if (overflow.length === 1) {
      sitsAlone = overflow[0];
    }

    // Handle odd total: if cross pairs don't cover everyone and no sitsAlone yet,
    // someone from the smaller group may need to sit alone when r >= numCrossRounds
    if (r >= numCrossRounds && sitsAlone === undefined) {
      // All smaller students are unpaired in rounds beyond cross rounds
      // This shouldn't normally happen since totalRoundCount = max(numCrossRounds, overflowRounds)
    }

    rounds.push({ index: r, pairs, sitsAlone });
  }

  return rounds;
}

/**
 * Generate same-gender rounds by running independent round-robins within each
 * gender group, then merging the results.
 * Unset-gender students split evenly between groups.
 */
function generateSameGenderRounds(
  totalStudents: number,
  genderMap: StudentMetaMap,
): Round[] {
  const { males, females, unset } = partitionByGender(totalStudents, genderMap);

  // If no actual gender data, fall back to random
  if (males.length === 0 && females.length === 0) {
    return generateAllRounds(totalStudents);
  }

  // Split unset students evenly between groups
  const groupA = [...males];
  const groupB = [...females];
  for (let i = 0; i < unset.length; i++) {
    if (groupA.length <= groupB.length) {
      groupA.push(unset[i]);
    } else {
      groupB.push(unset[i]);
    }
  }

  // If one group has fewer than 2 students, just run standard round-robin on all
  if (groupA.length < 2 && groupB.length < 2) {
    return generateAllRounds(totalStudents);
  }

  // Run independent round-robins on each group
  const roundsA = groupA.length >= 2
    ? remapRounds(generateAllRounds(groupA.length), groupA)
    : [];
  const roundsB = groupB.length >= 2
    ? remapRounds(generateAllRounds(groupB.length), groupB)
    : [];

  const totalRoundCount = Math.max(roundsA.length, roundsB.length);
  const rounds: Round[] = [];

  for (let r = 0; r < totalRoundCount; r++) {
    const pairs: [number, number][] = [];
    const sitsAloneStudents: number[] = [];

    if (r < roundsA.length) {
      pairs.push(...roundsA[r].pairs);
      if (roundsA[r].sitsAlone !== undefined) sitsAloneStudents.push(roundsA[r].sitsAlone!);
    } else if (groupA.length === 1) {
      sitsAloneStudents.push(groupA[0]);
    }

    if (r < roundsB.length) {
      pairs.push(...roundsB[r].pairs);
      if (roundsB[r].sitsAlone !== undefined) sitsAloneStudents.push(roundsB[r].sitsAlone!);
    } else if (groupB.length === 1) {
      sitsAloneStudents.push(groupB[0]);
    }

    // If we have exactly 2 students sitting alone, pair them
    if (sitsAloneStudents.length === 2) {
      const [a, b] = sitsAloneStudents;
      pairs.push([Math.min(a, b), Math.max(a, b)]);
      rounds.push({ index: r, pairs });
    } else {
      rounds.push({
        index: r,
        pairs,
        sitsAlone: sitsAloneStudents[0],
      });
    }
  }

  return rounds;
}

/**
 * Main entry point: generate rounds based on pairing mode.
 */
export function generateRounds(
  totalStudents: number,
  pairingMode: PairingMode,
  genderMap?: StudentMetaMap,
): Round[] {
  if (pairingMode === 'random' || !genderMap) {
    return generateAllRounds(totalStudents);
  }

  if (pairingMode === 'mixed') {
    return generateMixedRounds(totalStudents, genderMap);
  }

  return generateSameGenderRounds(totalStudents, genderMap);
}
