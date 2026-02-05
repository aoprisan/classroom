import type { LayoutConfig } from '../types';

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
