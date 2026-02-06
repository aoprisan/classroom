import type { TeamCoverageStats } from '../../lib/team-coverage';
import { MatrixCell } from '../matrix/MatrixCell';

interface TeamCoverageMatrixProps {
  stats: TeamCoverageStats;
  totalStudents: number;
  getDisplayName?: (num: number) => string | undefined;
}

export function TeamCoverageMatrix({ stats, totalStudents, getDisplayName }: TeamCoverageMatrixProps) {
  const students = Array.from({ length: totalStudents }, (_, i) => i + 1);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Team Coverage Matrix</h2>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            {stats.paired} / {stats.total} pairs
          </span>
          <span>{stats.percentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-green-500 h-2.5 rounded-full transition-all"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
      </div>

      {/* Matrix grid */}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Header row */}
          <div className="flex">
            <div className="matrix-cell bg-transparent" />
            {students.map((s) => {
              const name = getDisplayName?.(s);
              return (
                <div
                  key={s}
                  className="matrix-cell bg-gray-100 font-medium text-gray-700"
                  title={name ? `${s}: ${name}` : undefined}
                >
                  {s}
                </div>
              );
            })}
          </div>

          {/* Data rows */}
          {students.map((row) => (
            <div key={row} className="flex">
              <div
                className="matrix-cell bg-gray-100 font-medium text-gray-700"
                title={getDisplayName?.(row) ? `${row}: ${getDisplayName(row)}` : undefined}
              >
                {row}
              </div>
              {students.map((col) => (
                <MatrixCell
                  key={col}
                  value={stats.matrix[row][col]}
                  isSelf={row === col}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
