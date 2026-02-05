import type { Round, LayoutConfig } from '../../types';
import { distributeBenches } from '../../lib/seating';
import { BenchRow } from './BenchRow';

interface ClassroomViewProps {
  round: Round | null;
  config: LayoutConfig;
  currentViewIndex: number;
  completedCount: number;
  canShuffleNext: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  onShuffleNext: () => void;
  onPrev: () => void;
  onNext: () => void;
  getDisplayName?: (num: number) => string | undefined;
}

export function ClassroomView({
  round,
  config,
  currentViewIndex,
  completedCount,
  canShuffleNext,
  canGoPrev,
  canGoNext,
  onShuffleNext,
  onPrev,
  onNext,
  getDisplayName,
}: ClassroomViewProps) {
  const rows = distributeBenches(config);

  // Distribute pairs across rows
  const rowPairs: { pairs: [number, number][]; aloneStudent?: number }[] = [];
  if (round) {
    let pairIdx = 0;
    for (let r = 0; r < rows.length; r++) {
      const count = rows[r];
      const slice = round.pairs.slice(pairIdx, pairIdx + count);
      // If this is the last row and there's an alone student, attach it
      const isLastRow = r === rows.length - 1;
      rowPairs.push({
        pairs: slice,
        aloneStudent: isLastRow ? round.sitsAlone : undefined,
      });
      pairIdx += count;
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
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
          {round ? `Round ${currentViewIndex + 1}` : 'No rounds yet'}
        </span>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-700 disabled:opacity-30 hover:bg-gray-300 transition-colors"
        >
          &rarr;
        </button>
      </div>

      {/* Classroom */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Teacher's desk */}
        <div className="flex justify-center pb-4">
          <div className="bg-amber-900 text-amber-100 rounded-lg px-8 py-2 text-sm font-medium shadow">
            Teacher's Desk
          </div>
        </div>

        {round ? (
          <div className="flex justify-center items-start gap-6">
            {rowPairs.map((row, i) => (
              <div key={i} className="flex-1">
                <div className="text-xs text-gray-400 mb-2 text-center">Row {i + 1}</div>
                <BenchRow pairs={row.pairs} aloneStudent={row.aloneStudent} getDisplayName={getDisplayName} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-12">
            Press "Shuffle Next" to begin
          </div>
        )}
      </div>

      {/* Shuffle button */}
      <div className="flex justify-center">
        <button
          onClick={onShuffleNext}
          disabled={!canShuffleNext}
          className="px-6 py-2.5 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {completedCount === 0
            ? 'Shuffle Next'
            : canShuffleNext
              ? 'Shuffle Next'
              : 'All Rounds Complete!'}
        </button>
      </div>
    </div>
  );
}
