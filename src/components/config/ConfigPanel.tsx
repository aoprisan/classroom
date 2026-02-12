import { useState } from 'react';
import type { LayoutConfig, PairingMode, StudentMetaMap } from '../../types';
import { CONFIG_LIMITS } from '../../constants';
import { distributeBenches } from '../../lib/seating';

interface ConfigPanelProps {
  currentConfig: LayoutConfig;
  onApply: (config: LayoutConfig, metaMap?: StudentMetaMap) => void;
  metaMap: StudentMetaMap;
}

const PAIRING_MODES: { value: PairingMode; label: string; description: string }[] = [
  { value: 'random', label: 'Random', description: 'Pairs are assigned regardless of gender' },
  { value: 'mixed', label: 'Mixed M/F', description: 'Each pair has one male and one female student' },
  { value: 'same', label: 'Same gender', description: 'Each pair has students of the same gender' },
];

export function ConfigPanel({ currentConfig, onApply, metaMap }: ConfigPanelProps) {
  const [config, setConfig] = useState<LayoutConfig>({ ...currentConfig });
  const [showWarning, setShowWarning] = useState(false);

  const benchDistribution = distributeBenches(config);
  const totalRounds = config.totalStudents % 2 === 0
    ? config.totalStudents - 1
    : config.totalStudents;

  const hasChanges =
    config.totalStudents !== currentConfig.totalStudents ||
    config.rowCount !== currentConfig.rowCount ||
    config.pairingMode !== currentConfig.pairingMode;

  // Count genders for context info
  const genderCounts = { M: 0, F: 0, unset: 0 };
  for (let i = 1; i <= currentConfig.totalStudents; i++) {
    const g = metaMap[i]?.gender;
    if (g === 'M') genderCounts.M++;
    else if (g === 'F') genderCounts.F++;
    else genderCounts.unset++;
  }

  function handleApply() {
    if (hasChanges) {
      if (!showWarning) {
        setShowWarning(true);
        return;
      }
      onApply(config, metaMap);
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

        {/* Pairing mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pairing Mode
          </label>
          <div className="space-y-2">
            {PAIRING_MODES.map((mode) => (
              <label key={mode.value} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pairingMode"
                  value={mode.value}
                  checked={config.pairingMode === mode.value}
                  onChange={() => {
                    setConfig({ ...config, pairingMode: mode.value });
                    setShowWarning(false);
                  }}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">{mode.label}</span>
                  <p className="text-xs text-gray-400">{mode.description}</p>
                </div>
              </label>
            ))}
          </div>
          {config.pairingMode !== 'random' && (
            <p className="text-xs text-gray-500 mt-2">
              Gender data: {genderCounts.M} M, {genderCounts.F} F{genderCounts.unset > 0 && `, ${genderCounts.unset} unset`}
            </p>
          )}
          {config.pairingMode !== 'random' && genderCounts.M === 0 && genderCounts.F === 0 && (
            <p className="text-xs text-yellow-600 mt-1">
              No genders set — will fall back to random pairing. Set genders in the Students tab.
            </p>
          )}
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
