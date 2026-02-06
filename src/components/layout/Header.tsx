import type { AppMode } from '../../types';

interface HeaderProps {
  mode: AppMode;
  totalStudents: number;
  completedRounds: number;
  totalRounds: number;
  projectLabel?: string;
  onReset: () => void;
}

export function Header({ mode, totalStudents, completedRounds, totalRounds, projectLabel, onReset }: HeaderProps) {
  function handleReset() {
    if (window.confirm('Reset all data? This will clear all rounds, student names, settings, and projects.')) {
      onReset();
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Classroom Shuffle</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {mode === 'classroom' ? (
              <>{totalStudents} students &middot; Round {completedRounds}/{totalRounds}</>
            ) : projectLabel ? (
              <>{projectLabel} &middot; Round {completedRounds}/{totalRounds}</>
            ) : (
              'No project selected'
            )}
          </span>
          <button
            onClick={handleReset}
            className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}
