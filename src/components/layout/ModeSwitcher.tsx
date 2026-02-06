import type { AppMode } from '../../types';

interface ModeSwitcherProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const MODES: { id: AppMode; label: string }[] = [
  { id: 'classroom', label: 'Classroom Layout' },
  { id: 'projects', label: 'Project Distribution' },
];

export function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps) {
  return (
    <div className="bg-gray-100 border-b border-gray-200">
      <div className="max-w-4xl mx-auto flex gap-1 p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === m.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
