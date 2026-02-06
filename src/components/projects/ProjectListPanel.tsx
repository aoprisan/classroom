import { useState } from 'react';
import type { ProjectConfig, ProjectState } from '../../types';
import { PROJECT_LIMITS } from '../../constants';
import { ProjectForm } from './ProjectForm';

interface ProjectListPanelProps {
  projects: ProjectState[];
  activeProjectId: string | null;
  onAddProject: (config: ProjectConfig) => void;
  onSelectProject: (id: string) => void;
  onRemoveProject: (id: string) => void;
  onSwitchToTeams: () => void;
}

export function ProjectListPanel({
  projects,
  activeProjectId,
  onAddProject,
  onSelectProject,
  onRemoveProject,
  onSwitchToTeams,
}: ProjectListPanelProps) {
  const [showForm, setShowForm] = useState(false);

  function handleAdd(config: ProjectConfig) {
    onAddProject(config);
    setShowForm(false);
    onSwitchToTeams();
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Projects</h2>
        {!showForm && projects.length < PROJECT_LIMITS.maxProjects && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 rounded-md text-sm bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
          >
            + New Project
          </button>
        )}
      </div>

      {showForm && (
        <ProjectForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {projects.length === 0 && !showForm ? (
        <p className="text-gray-400 text-sm">No projects yet. Create one to get started.</p>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <div
              key={p.config.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                p.config.id === activeProjectId
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => {
                onSelectProject(p.config.id);
                onSwitchToTeams();
              }}
            >
              <div>
                <div className="font-medium text-sm text-gray-900">
                  {p.config.courseName} — {p.config.projectName}
                </div>
                <div className="text-xs text-gray-500">
                  {p.config.totalStudents} students · Teams of {p.config.teamSize} · {p.completedRoundIndices.length}/{p.allRounds.length} rounds
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete "${p.config.projectName}"?`)) {
                    onRemoveProject(p.config.id);
                  }
                }}
                className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
