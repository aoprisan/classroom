import type { LayoutConfig, Pair, StudentMetaMap } from '../types';

export function computeFallbackHeight(metaMap: StudentMetaMap): number {
  const known = Object.values(metaMap)
    .map((m) => m.heightCm)
    .filter((h): h is number => h !== null)
    .sort((a, b) => a - b);
  if (known.length === 0) return 150;
  const mid = Math.floor(known.length / 2);
  return known.length % 2 === 1
    ? known[mid]
    : (known[mid - 1] + known[mid]) / 2;
}

function pairAverageHeight(
  pair: Pair,
  metaMap: StudentMetaMap,
  fallback: number,
): number {
  const h0 = metaMap[pair[0]]?.heightCm ?? fallback;
  const h1 = metaMap[pair[1]]?.heightCm ?? fallback;
  return (h0 + h1) / 2;
}

export function sortPairsByHeight(
  pairs: Pair[],
  metaMap: StudentMetaMap,
): Pair[] {
  const fallback = computeFallbackHeight(metaMap);
  return [...pairs].sort(
    (a, b) =>
      pairAverageHeight(a, metaMap, fallback) -
      pairAverageHeight(b, metaMap, fallback),
  );
}

/**
 * Optimize within-pair seat assignments per column so that each lane
 * (left seat / right seat) has heights increasing front-to-back.
 * Pairings are preserved — only the left/right position may swap.
 *
 * For each column, tries both orderings of the front pair, then greedily
 * picks the best swap for every subsequent bench.
 */
export function optimizeLaneOrder(
  rowPairs: { pairs: Pair[]; aloneStudent?: number }[],
  metaMap: StudentMetaMap,
): { pairs: Pair[]; aloneStudent?: number }[] {
  const fallback = computeFallbackHeight(metaMap);

  function height(num: number): number {
    return metaMap[num]?.heightCm ?? fallback;
  }

  function scoreLane(h: number, laneMax: number): number {
    if (h >= laneMax) return 1.0;
    return Math.max(0, 1 - (laneMax - h) / 20);
  }

  function greedyOptimize(pairs: Pair[]): { pairs: Pair[]; totalScore: number } {
    if (pairs.length === 0) return { pairs: [], totalScore: 0 };

    const result: Pair[] = [pairs[0]];
    const laneMax = [height(pairs[0][0]), height(pairs[0][1])];
    let totalScore = 2; // front bench always 1.0 each

    for (let bi = 1; bi < pairs.length; bi++) {
      const [a, b] = pairs[bi];
      const ha = height(a);
      const hb = height(b);

      // Option A: a in lane 0, b in lane 1
      const scoreA = scoreLane(ha, laneMax[0]) + scoreLane(hb, laneMax[1]);
      // Option B: b in lane 0, a in lane 1
      const scoreB = scoreLane(hb, laneMax[0]) + scoreLane(ha, laneMax[1]);

      if (scoreA >= scoreB) {
        result.push([a, b]);
        totalScore += scoreA;
        laneMax[0] = Math.max(laneMax[0], ha);
        laneMax[1] = Math.max(laneMax[1], hb);
      } else {
        result.push([b, a]);
        totalScore += scoreB;
        laneMax[0] = Math.max(laneMax[0], hb);
        laneMax[1] = Math.max(laneMax[1], ha);
      }
    }

    return { pairs: result, totalScore };
  }

  return rowPairs.map((row) => {
    if (row.pairs.length <= 1) return row;

    // Try both orderings of the front pair, greedily optimize the rest
    const [a, b] = row.pairs[0];
    const asIs = [row.pairs[0], ...row.pairs.slice(1)] as Pair[];
    const swapped = [[b, a] as Pair, ...row.pairs.slice(1)];

    const optA = greedyOptimize(asIs);
    const optB = greedyOptimize(swapped);

    return {
      pairs: optA.totalScore >= optB.totalScore ? optA.pairs : optB.pairs,
      aloneStudent: row.aloneStudent,
    };
  });
}

/**
 * Distribute benches across rows as evenly as possible.
 * Returns an array where each element is the number of benches in that row.
 */
export function distributeBenches(config: LayoutConfig): number[] {
  const totalBenches = Math.ceil(config.totalStudents / config.studentsPerBench);
  const basePerRow = Math.floor(totalBenches / config.rowCount);
  const remainder = totalBenches % config.rowCount;

  const rows: number[] = [];
  for (let i = 0; i < config.rowCount; i++) {
    rows.push(basePerRow + (i < remainder ? 1 : 0));
  }
  return rows;
}
