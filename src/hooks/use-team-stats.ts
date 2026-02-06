import { useMemo } from 'react';
import type { ProjectState } from '../types';
import { computeTeamCoverageStats } from '../lib/team-coverage';

export function useTeamStats(project: ProjectState | null) {
  return useMemo(() => {
    if (!project) return null;
    return computeTeamCoverageStats(
      project.config.totalStudents,
      project.allRounds,
      project.completedRoundIndices,
    );
  }, [project]);
}
