import type { Tab } from '../../types';

const TABS: { id: Tab; label: string }[] = [
  { id: 'classroom', label: 'Classroom' },
  { id: 'students', label: 'Students' },
  { id: 'history', label: 'History' },
  { id: 'matrix', label: 'Matrix' },
  { id: 'config', label: 'Config' },
];

interface TabNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto flex">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
