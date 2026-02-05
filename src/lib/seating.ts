import type { LayoutConfig, Pair, StudentMetaMap } from '../types';

function computeFallbackHeight(metaMap: StudentMetaMap): number {
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
