import { describe, it, expect } from 'vitest';
import { computeClassroomFov, computeFovScoreMap, fovScoreToColor } from '../field-of-view';
import type { Pair, StudentMetaMap } from '../../types';

describe('computeClassroomFov', () => {
  const meta: StudentMetaMap = {
    1: { firstName: 'A', lastName: 'B', heightCm: 150, gender: 'M' },
    2: { firstName: 'C', lastName: 'D', heightCm: 150, gender: 'F' },
    3: { firstName: 'E', lastName: 'F', heightCm: 170, gender: 'M' },
    4: { firstName: 'G', lastName: 'H', heightCm: 170, gender: 'F' },
    5: { firstName: 'I', lastName: 'J', heightCm: 140, gender: 'M' },
    6: { firstName: 'K', lastName: 'L', heightCm: 140, gender: 'F' },
  };

  it('front bench students always have score 1.0', () => {
    const rowPairs = [{ pairs: [[1, 2], [3, 4]] as Pair[] }];
    const fov = computeClassroomFov(rowPairs, meta, 150);
    expect(fov[0].benches[0][0].score).toBe(1.0);
    expect(fov[0].benches[0][1].score).toBe(1.0);
  });

  it('shorter students behind taller have reduced score', () => {
    // Front: tall students (170cm), Back: short students (140cm)
    const rowPairs = [{ pairs: [[3, 4], [5, 6]] as Pair[] }];
    const fov = computeClassroomFov(rowPairs, meta, 150);
    // Back bench (5,6) behind front bench (3,4)
    // Students 5,6 are 140cm, blocked by 170cm → diff=30, score=max(0, 1-30/20)=0
    expect(fov[0].benches[1][0].score).toBeLessThan(1.0);
    expect(fov[0].benches[1][1].score).toBeLessThan(1.0);
  });

  it('taller students behind shorter have full score', () => {
    // Front: short (140cm), Back: tall (170cm)
    const rowPairs = [{ pairs: [[5, 6], [3, 4]] as Pair[] }];
    const fov = computeClassroomFov(rowPairs, meta, 150);
    expect(fov[0].benches[1][0].score).toBe(1.0);
    expect(fov[0].benches[1][1].score).toBe(1.0);
  });

  it('alone student is included', () => {
    const rowPairs = [{ pairs: [[1, 2]] as Pair[], aloneStudent: 3 }];
    const fov = computeClassroomFov(rowPairs, meta, 150);
    const allStudents = fov[0].benches.flat().map((s) => s.studentNum);
    expect(allStudents).toContain(3);
  });

  it('returns correct column indices', () => {
    const rowPairs = [
      { pairs: [[1, 2]] as Pair[] },
      { pairs: [[3, 4]] as Pair[] },
    ];
    const fov = computeClassroomFov(rowPairs, meta, 150);
    expect(fov[0].columnIndex).toBe(0);
    expect(fov[1].columnIndex).toBe(1);
  });
});

describe('computeFovScoreMap', () => {
  it('creates a flat map from ColumnFov array', () => {
    const fov = [{
      columnIndex: 0,
      benches: [
        [{ studentNum: 1, height: 150, score: 1.0, blockedBy: null }],
        [{ studentNum: 2, height: 140, score: 0.5, blockedBy: 1 }],
      ],
    }];
    const map = computeFovScoreMap(fov);
    expect(map[1]).toBe(1.0);
    expect(map[2]).toBe(0.5);
  });
});

describe('fovScoreToColor', () => {
  it('returns green-ish for score 1.0', () => {
    const color = fovScoreToColor(1.0);
    expect(color).toBe('hsl(140, 70%, 45%)');
  });

  it('returns red-ish for score 0.0', () => {
    const color = fovScoreToColor(0.0);
    expect(color).toBe('hsl(0, 70%, 45%)');
  });

  it('returns intermediate hue for 0.5', () => {
    const color = fovScoreToColor(0.5);
    expect(color).toBe('hsl(70, 70%, 45%)');
  });
});
