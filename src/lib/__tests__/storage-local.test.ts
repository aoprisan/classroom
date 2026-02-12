import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageAdapter } from '../storage-local';
import type { ClassroomState, StudentMetaMap, ProjectsState } from '../../types';

// Mock localStorage
const storage = new Map<string, string>();
const mockLocalStorage: Storage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, value); },
  removeItem: (key: string) => { storage.delete(key); },
  clear: () => { storage.clear(); },
  key: (index: number) => [...storage.keys()][index] ?? null,
  get length() { return storage.size; },
};

Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage });

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    storage.clear();
    adapter = new LocalStorageAdapter();
  });

  describe('classroom state', () => {
    const state: ClassroomState = {
      config: { totalStudents: 28, rowCount: 3, studentsPerBench: 2, pairingMode: 'random' as const },
      allRounds: [{ index: 0, pairs: [[1, 2], [3, 4]] }],
      completedRoundIndices: [0],
      currentViewIndex: 0,
    };

    it('saves and loads classroom state', async () => {
      await adapter.saveClassroomState(state);
      const loaded = await adapter.loadClassroomState();
      expect(loaded).not.toBeNull();
      expect(loaded!.config).toEqual(state.config);
      expect(loaded!.completedRoundIndices).toEqual([0]);
      expect(loaded!.currentViewIndex).toBe(0);
    });

    it('does not persist allRounds', async () => {
      await adapter.saveClassroomState(state);
      const loaded = await adapter.loadClassroomState();
      expect(loaded).not.toHaveProperty('allRounds');
    });

    it('returns null when no data saved', async () => {
      const loaded = await adapter.loadClassroomState();
      expect(loaded).toBeNull();
    });

    it('clears classroom state', async () => {
      await adapter.saveClassroomState(state);
      await adapter.clearClassroomState();
      const loaded = await adapter.loadClassroomState();
      expect(loaded).toBeNull();
    });
  });

  describe('student meta', () => {
    const meta: StudentMetaMap = {
      1: { firstName: 'Emma', lastName: 'Martin', heightCm: 145, gender: 'F' },
      2: { firstName: 'Lucas', lastName: 'Dubois', heightCm: 160, gender: 'M' },
    };

    it('saves and loads student meta', async () => {
      await adapter.saveStudentMeta(meta);
      const loaded = await adapter.loadStudentMeta();
      expect(loaded).toEqual(meta);
    });

    it('returns null when no data saved', async () => {
      const loaded = await adapter.loadStudentMeta();
      expect(loaded).toBeNull();
    });
  });

  describe('projects state', () => {
    const state: ProjectsState = {
      projects: [{
        config: { id: 'p1', courseName: 'Math', projectName: 'Algebra', teamSize: 3, totalStudents: 12 },
        allRounds: [{ index: 0, teams: [[1, 2, 3], [4, 5, 6]] }],
        completedRoundIndices: [0],
        currentViewIndex: 0,
      }],
      activeProjectId: 'p1',
    };

    it('saves and loads projects state', async () => {
      await adapter.saveProjectsState(state);
      const loaded = await adapter.loadProjectsState();
      expect(loaded).not.toBeNull();
      expect(loaded!.activeProjectId).toBe('p1');
      expect(loaded!.projects).toHaveLength(1);
      expect(loaded!.projects[0].config.courseName).toBe('Math');
    });

    it('does not persist allRounds per project', async () => {
      await adapter.saveProjectsState(state);
      const loaded = await adapter.loadProjectsState();
      expect(loaded!.projects[0]).not.toHaveProperty('allRounds');
    });

    it('clears projects state', async () => {
      await adapter.saveProjectsState(state);
      await adapter.clearProjectsState();
      const loaded = await adapter.loadProjectsState();
      expect(loaded).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('clears all storage keys', async () => {
      const classroomState: ClassroomState = {
        config: { totalStudents: 4, rowCount: 1, studentsPerBench: 2, pairingMode: 'random' as const },
        allRounds: [],
        completedRoundIndices: [],
        currentViewIndex: -1,
      };
      const meta: StudentMetaMap = {
        1: { firstName: 'A', lastName: 'B', heightCm: 150, gender: 'M' },
      };

      await adapter.saveClassroomState(classroomState);
      await adapter.saveStudentMeta(meta);
      await adapter.clearAll();

      expect(await adapter.loadClassroomState()).toBeNull();
      expect(await adapter.loadStudentMeta()).toBeNull();
      expect(await adapter.loadProjectsState()).toBeNull();
    });
  });
});
