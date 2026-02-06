import { useState } from 'react';
import type { ProjectConfig } from '../../types';
import { PROJECT_LIMITS, CONFIG_LIMITS } from '../../constants';

interface ProjectFormProps {
  onSubmit: (config: ProjectConfig) => void;
  onCancel: () => void;
}

export function ProjectForm({ onSubmit, onCancel }: ProjectFormProps) {
  const [courseName, setCourseName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [teamSize, setTeamSize] = useState(3);
  const [totalStudents, setTotalStudents] = useState(28);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseName.trim() || !projectName.trim()) return;
    onSubmit({
      id: crypto.randomUUID(),
      courseName: courseName.trim(),
      projectName: projectName.trim(),
      teamSize,
      totalStudents,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <h3 className="font-semibold text-gray-800">New Project</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="e.g. CS 101"
            className="w-full px-3 py-1.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. Final Project"
            className="w-full px-3 py-1.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Size ({PROJECT_LIMITS.minTeamSize}-{PROJECT_LIMITS.maxTeamSize})
            </label>
            <input
              type="number"
              value={teamSize}
              onChange={(e) => setTeamSize(Math.max(PROJECT_LIMITS.minTeamSize, Math.min(PROJECT_LIMITS.maxTeamSize, Number(e.target.value))))}
              min={PROJECT_LIMITS.minTeamSize}
              max={PROJECT_LIMITS.maxTeamSize}
              className="w-full px-3 py-1.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Students ({CONFIG_LIMITS.minStudents}-{CONFIG_LIMITS.maxStudents})
            </label>
            <input
              type="number"
              value={totalStudents}
              onChange={(e) => setTotalStudents(Math.max(CONFIG_LIMITS.minStudents, Math.min(CONFIG_LIMITS.maxStudents, Number(e.target.value))))}
              min={CONFIG_LIMITS.minStudents}
              max={CONFIG_LIMITS.maxStudents}
              className="w-full px-3 py-1.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-1.5 rounded-md text-sm bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
        >
          Create Project
        </button>
      </div>
    </form>
  );
}
