import type { Round } from '../../types';
import { RoundCard } from './RoundCard';

interface HistoryPanelProps {
  allRounds: Round[];
  completedRoundIndices: number[];
  currentViewIndex: number;
  onViewRound: (index: number) => void;
  onSwitchToClassroom: () => void;
}

export function HistoryPanel({
  allRounds,
  completedRoundIndices,
  currentViewIndex,
  onViewRound,
  onSwitchToClassroom,
}: HistoryPanelProps) {
  const completedRounds = [...completedRoundIndices]
    .reverse()
    .map((i) => allRounds[i]);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">History</h2>
      {completedRounds.length === 0 ? (
        <p className="text-gray-400 text-sm">No rounds completed yet.</p>
      ) : (
        completedRounds.map((round) => (
          <RoundCard
            key={round.index}
            round={round}
            isCurrent={round.index === currentViewIndex}
            onClick={() => {
              onViewRound(round.index);
              onSwitchToClassroom();
            }}
          />
        ))
      )}
    </div>
  );
}
