import type { Pair, StudentMetaMap } from '../types';

export interface StudentFov {
  studentNum: number;
  height: number;
  score: number;
  blockedBy: number | null;
}

export interface ColumnFov {
  columnIndex: number;
  benches: StudentFov[][];
}

export type FovScoreMap = Record<number, number>;

/**
 * Compute FOV scores for all students in the classroom.
 * Within each column (row in the layout), benches are ordered front (index 0) to back.
 * Front-bench students always have score 1.0 (unobstructed).
 * For students further back, score degrades based on the tallest student
 * in the same seat lane (same seat index) across all benches in front.
 */
export function computeClassroomFov(
  rowPairs: { pairs: Pair[]; aloneStudent?: number }[],
  studentMeta: StudentMetaMap,
  fallbackHeight: number,
): ColumnFov[] {
  return rowPairs.map((row, columnIndex) => {
    // Collect all students per bench position (front to back)
    const benchStudents: { studentNum: number; height: number }[][] = [];

    for (const pair of row.pairs) {
      const students = pair.map((num) => ({
        studentNum: num,
        height: studentMeta[num]?.heightCm ?? fallbackHeight,
      }));
      benchStudents.push(students);
    }

    if (row.aloneStudent !== undefined) {
      benchStudents.push([{
        studentNum: row.aloneStudent,
        height: studentMeta[row.aloneStudent]?.heightCm ?? fallbackHeight,
      }]);
    }

    // Per-lane tracking: max height and worst blocker for each seat index
    const laneMax: { height: number; blocker: number | null }[] = [];

    const benches: StudentFov[][] = benchStudents.map((students, benchIdx) => {
      const result = students.map((s, seatIdx) => {
        if (benchIdx === 0) {
          return { studentNum: s.studentNum, height: s.height, score: 1.0, blockedBy: null };
        }

        // Only compare against the same seat lane
        const lane = laneMax[seatIdx];
        if (!lane || s.height >= lane.height) {
          return { studentNum: s.studentNum, height: s.height, score: 1.0, blockedBy: null };
        }

        const diff = lane.height - s.height;
        const score = Math.max(0, 1 - diff / 20);
        return {
          studentNum: s.studentNum,
          height: s.height,
          score,
          blockedBy: lane.blocker,
        };
      });

      // Update per-lane max heights after processing this bench
      for (let si = 0; si < students.length; si++) {
        if (!laneMax[si] || students[si].height > laneMax[si].height) {
          laneMax[si] = { height: students[si].height, blocker: students[si].studentNum };
        }
      }

      return result;
    });

    return { columnIndex, benches };
  });
}

/**
 * Flatten ColumnFov[] to a simple student → score map for O(1) rendering lookup.
 */
export function computeFovScoreMap(fov: ColumnFov[]): FovScoreMap {
  const map: FovScoreMap = {};
  for (const col of fov) {
    for (const bench of col.benches) {
      for (const student of bench) {
        map[student.studentNum] = student.score;
      }
    }
  }
  return map;
}

/**
 * Convert a FOV score (0–1) to an HSL color string.
 * 1.0 = green (hsl(140, 70%, 45%)), 0.0 = red (hsl(0, 70%, 45%))
 */
export function fovScoreToColor(score: number): string {
  const hue = Math.round(score * 140);
  return `hsl(${hue}, 70%, 45%)`;
}
