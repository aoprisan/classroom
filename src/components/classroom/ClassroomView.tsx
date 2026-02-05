import { useMemo, useState } from 'react';
import type { Round, LayoutConfig, StudentMetaMap } from '../../types';
import { distributeBenches, sortPairsByHeight, computeFallbackHeight, optimizeLaneOrder } from '../../lib/seating';
import { computeClassroomFov, computeFovScoreMap } from '../../lib/field-of-view';
import type { ColumnFov, FovScoreMap } from '../../lib/field-of-view';
import { BenchRow } from './BenchRow';
import { FovLegend } from './FovLegend';
import { SideView } from './SideView';

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
  studentMeta?: StudentMetaMap;
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
  studentMeta,
}: ClassroomViewProps) {
  const [showFov, setShowFov] = useState(true);
  const [showSideView, setShowSideView] = useState(false);

  const rows = distributeBenches(config);
  const getHeight = studentMeta
    ? (num: number) => studentMeta[num]?.heightCm
    : undefined;
  const getGender = studentMeta
    ? (num: number) => studentMeta[num]?.gender || undefined
    : undefined;

  const { rowPairs, fovScoreMap, fov } = useMemo(() => {
    if (!round) return { rowPairs: [] as { pairs: [number, number][]; aloneStudent?: number }[], fovScoreMap: undefined as FovScoreMap | undefined, fov: [] as ColumnFov[] };

    // Sort pairs by height so shorter students sit closer to the teacher
    const sortedPairs =
      studentMeta
        ? sortPairsByHeight(round.pairs, studentMeta)
        : round.pairs;

    // Distribute pairs across rows
    const rp: { pairs: [number, number][]; aloneStudent?: number }[] = [];
    let pairIdx = 0;
    for (let r = 0; r < rows.length; r++) {
      const count = rows[r];
      const slice = sortedPairs.slice(pairIdx, pairIdx + count);
      const isLastRow = r === rows.length - 1;
      rp.push({
        pairs: slice,
        aloneStudent: isLastRow ? round.sitsAlone : undefined,
      });
      pairIdx += count;
    }

    // Optimize lane order and compute FOV if we have height data
    const hasHeights = studentMeta && Object.values(studentMeta).some((m) => m.heightCm !== null);
    if (hasHeights && studentMeta) {
      const optimized = optimizeLaneOrder(rp, studentMeta);
      const fallback = computeFallbackHeight(studentMeta);
      const columnFov = computeClassroomFov(optimized, studentMeta, fallback);
      return { rowPairs: optimized, fovScoreMap: computeFovScoreMap(columnFov), fov: columnFov };
    }

    return { rowPairs: rp, fovScoreMap: undefined, fov: [] as ColumnFov[] };
  }, [round, studentMeta, rows]);

  const hasHeights = studentMeta && Object.values(studentMeta).some((m) => m.heightCm !== null);

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

      {/* FOV toggles */}
      {round && hasHeights && (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => setShowFov((v) => !v)}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${showFov ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-600 border border-gray-300'}`}
          >
            {showFov ? 'FOV On' : 'FOV Off'}
          </button>
          <button
            onClick={() => setShowSideView((v) => !v)}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${showSideView ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-gray-100 text-gray-600 border border-gray-300'}`}
          >
            {showSideView ? 'Hide Side View' : 'Show Side View'}
          </button>
          {showFov && <FovLegend />}
        </div>
      )}

      {/* Classroom */}
      <div data-print-classroom className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
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
                <BenchRow
                  pairs={row.pairs}
                  aloneStudent={row.aloneStudent}
                  getDisplayName={getDisplayName}
                  getHeight={getHeight}
                  getGender={getGender}
                  fovScoreMap={showFov ? fovScoreMap : undefined}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-12">
            Press "Shuffle Next" to begin
          </div>
        )}
      </div>

      {/* Side View */}
      {round && showSideView && fov.length > 0 && (
        <SideView fov={fov} getDisplayName={getDisplayName} />
      )}

      {/* Shuffle button + Print */}
      <div className="flex justify-center gap-3">
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
        {round && (
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors shadow-sm print:hidden"
          >
            Print
          </button>
        )}
      </div>
    </div>
  );
}
