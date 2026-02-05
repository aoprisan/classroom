import { useMemo } from 'react';
import type { ClassroomState } from '../types';
import { computeCoverageStats } from '../lib/pairing-matrix';

export function usePairingStats(state: ClassroomState) {
  return useMemo(
    () =>
      computeCoverageStats(
        state.config.totalStudents,
        state.allRounds,
        state.completedRoundIndices,
      ),
    [state.config.totalStudents, state.allRounds, state.completedRoundIndices],
  );
}
