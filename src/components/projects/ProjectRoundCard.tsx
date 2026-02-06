import type { TeamRound } from '../../types';

interface ProjectRoundCardProps {
  round: TeamRound;
  isCurrent: boolean;
  onClick: () => void;
}

export function ProjectRoundCard({ round, isCurrent, onClick }: ProjectRoundCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-colors ${
        isCurrent
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">Round {round.index + 1}</span>
        <span className="text-xs text-gray-400">{round.teams.length} teams</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {round.teams.map((team, i) => (
          <span
            key={i}
            className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
          >
            {team.join('–')}
          </span>
        ))}
      </div>
    </button>
  );
}
