import type { TeamRound, ProjectState } from '../../types';
import { TeamCard } from './TeamCard';

interface TeamViewProps {
  project: ProjectState;
  currentRound: TeamRound | null;
  canShuffleNext: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  onShuffleNext: () => void;
  onPrev: () => void;
  onNext: () => void;
  getDisplayName?: (num: number) => string | undefined;
}

export function TeamView({
  project,
  currentRound,
  canShuffleNext,
  canGoPrev,
  canGoNext,
  onShuffleNext,
  onPrev,
  onNext,
  getDisplayName,
}: TeamViewProps) {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-800">
          {project.config.courseName} — {project.config.projectName}
        </h2>
        <p className="text-sm text-gray-500">
          {project.config.totalStudents} students · Teams of {project.config.teamSize}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-700 disabled:opacity-30 hover:bg-gray-300 transition-colors"
        >
          &larr;
        </button>
        <span className="text-sm text-gray-600 min-w-[100px] text-center">
          {currentRound ? `Round ${project.currentViewIndex + 1}` : 'No rounds yet'}
        </span>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-700 disabled:opacity-30 hover:bg-gray-300 transition-colors"
        >
          &rarr;
        </button>
      </div>

      {/* Teams */}
      {currentRound ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {currentRound.teams.map((team, i) => (
            <TeamCard
              key={i}
              teamIndex={i}
              members={team}
              getDisplayName={getDisplayName}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-12">
          Press "Shuffle Next" to generate teams
        </div>
      )}

      {/* Shuffle button */}
      <div className="flex justify-center">
        <button
          onClick={onShuffleNext}
          disabled={!canShuffleNext}
          className="px-6 py-2.5 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {project.completedRoundIndices.length === 0
            ? 'Shuffle Next'
            : canShuffleNext
              ? 'Shuffle Next'
              : 'All Rounds Complete!'}
        </button>
      </div>
    </div>
  );
}
