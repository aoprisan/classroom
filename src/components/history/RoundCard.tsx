import type { Round } from '../../types';

interface RoundCardProps {
  round: Round;
  isCurrent: boolean;
  onClick: () => void;
}

export function RoundCard({ round, isCurrent, onClick }: RoundCardProps) {
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
        <span className="text-xs text-gray-400">{round.pairs.length} pairs</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {round.pairs.map(([a, b], i) => (
          <span
            key={i}
            className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
          >
            {a}–{b}
          </span>
        ))}
        {round.sitsAlone !== undefined && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
            {round.sitsAlone} alone
          </span>
        )}
      </div>
    </button>
  );
}
