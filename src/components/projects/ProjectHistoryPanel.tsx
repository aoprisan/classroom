import type { ProjectState } from '../../types';
import { ProjectRoundCard } from './ProjectRoundCard';

interface ProjectHistoryPanelProps {
  project: ProjectState;
  onViewRound: (index: number) => void;
  onSwitchToTeams: () => void;
}

export function ProjectHistoryPanel({
  project,
  onViewRound,
  onSwitchToTeams,
}: ProjectHistoryPanelProps) {
  const completedRounds = [...project.completedRoundIndices]
    .reverse()
    .map((i) => project.allRounds[i]);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">
        History — {project.config.projectName}
      </h2>
      {completedRounds.length === 0 ? (
        <p className="text-gray-400 text-sm">No rounds completed yet.</p>
      ) : (
        completedRounds.map((round) => (
          <ProjectRoundCard
            key={round.index}
            round={round}
            isCurrent={round.index === project.currentViewIndex}
            onClick={() => {
              onViewRound(round.index);
              onSwitchToTeams();
            }}
          />
        ))
      )}
    </div>
  );
}
