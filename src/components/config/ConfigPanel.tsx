import { useState } from 'react';
import type { LayoutConfig } from '../../types';
import { CONFIG_LIMITS } from '../../constants';
import { distributeBenches } from '../../lib/seating';

interface ConfigPanelProps {
  currentConfig: LayoutConfig;
  onApply: (config: LayoutConfig) => void;
}

export function ConfigPanel({ currentConfig, onApply }: ConfigPanelProps) {
  const [config, setConfig] = useState<LayoutConfig>({ ...currentConfig });
  const [showWarning, setShowWarning] = useState(false);

  const benchDistribution = distributeBenches(config);
  const totalRounds = config.totalStudents % 2 === 0
    ? config.totalStudents - 1
    : config.totalStudents;

  const hasChanges =
    config.totalStudents !== currentConfig.totalStudents ||
    config.rowCount !== currentConfig.rowCount;

  function handleApply() {
    if (hasChanges) {
      if (!showWarning) {
        setShowWarning(true);
        return;
      }
      onApply(config);
      setShowWarning(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Configuration</h2>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        {/* Total students */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Students
          </label>
          <input
            type="number"
            min={CONFIG_LIMITS.minStudents}
            max={CONFIG_LIMITS.maxStudents}
            value={config.totalStudents}
            onChange={(e) => {
              const v = Math.max(
                CONFIG_LIMITS.minStudents,
                Math.min(CONFIG_LIMITS.maxStudents, Number(e.target.value) || CONFIG_LIMITS.minStudents),
              );
              setConfig({ ...config, totalStudents: v });
              setShowWarning(false);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            {CONFIG_LIMITS.minStudents}–{CONFIG_LIMITS.maxStudents} students
          </p>
        </div>

        {/* Row count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Rows
          </label>
          <input
            type="number"
            min={CONFIG_LIMITS.minRows}
            max={CONFIG_LIMITS.maxRows}
            value={config.rowCount}
            onChange={(e) => {
              const v = Math.max(
                CONFIG_LIMITS.minRows,
                Math.min(CONFIG_LIMITS.maxRows, Number(e.target.value) || CONFIG_LIMITS.minRows),
              );
              setConfig({ ...config, rowCount: v });
              setShowWarning(false);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            {CONFIG_LIMITS.minRows}–{CONFIG_LIMITS.maxRows} rows
          </p>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Bench Distribution Preview</p>
          <div className="space-y-1">
            {benchDistribution.map((count, i) => (
              <div key={i} className="text-sm text-gray-600">
                Row {i + 1}: {count} bench{count !== 1 ? 'es' : ''}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {totalRounds} rounds needed for full coverage
          </p>
        </div>
      </div>

      {/* Apply button */}
      <div className="space-y-2">
        {showWarning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
            This will reset all progress. Click again to confirm.
          </div>
        )}
        <button
          onClick={handleApply}
          disabled={!hasChanges}
          className="w-full px-4 py-2.5 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Apply & Reset
        </button>
      </div>
    </div>
  );
}
