import { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '../../lib/api-client';

interface ClassroomSummary {
  id: string;
  name: string;
  totalStudents: number;
  rowCount: number;
}

interface Props {
  apiUrl: string;
  onSelect: (id: string) => void;
}

export function ClassroomSelector({ apiUrl, onSelect }: Props) {
  const [classrooms, setClassrooms] = useState<ClassroomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('My Classroom');

  const client = new ApiClient(apiUrl);

  const loadClassrooms = useCallback(async () => {
    try {
      const list = await client.get<ClassroomSummary[]>('/classrooms');
      setClassrooms(list);
    } catch (e) {
      console.error('Failed to load classrooms:', e);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  useEffect(() => {
    loadClassrooms();
  }, [loadClassrooms]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const classroom = await client.post<ClassroomSummary>('/classrooms', {
        name: newName || 'My Classroom',
        totalStudents: 28,
        rowCount: 3,
        studentsPerBench: 2,
      });
      onSelect(classroom.id);
    } catch (e) {
      console.error('Failed to create classroom:', e);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading classrooms...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Classrooms</h1>

        {classrooms.length > 0 && (
          <div className="space-y-3 mb-8">
            {classrooms.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className="w-full text-left p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <div className="font-medium text-gray-800">{c.name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {c.totalStudents} students &middot; {c.rowCount} rows
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-medium text-gray-700 mb-3">Create New Classroom</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Classroom name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
