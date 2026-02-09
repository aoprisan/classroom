import type { ClassroomState, StudentMetaMap, ProjectsState } from '../types';
import type { StorageAdapter, PersistedClassroomState, PersistedProjectsState } from './storage-adapter';
import { STORAGE_KEY, STUDENT_META_KEY, PROJECTS_STORAGE_KEY } from '../constants';

export class LocalStorageAdapter implements StorageAdapter {
  async saveClassroomState(state: ClassroomState): Promise<void> {
    try {
      const { allRounds: _allRounds, ...rest } = state;
      void _allRounds;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    } catch {
      // localStorage might be full or unavailable
    }
  }

  async loadClassroomState(): Promise<PersistedClassroomState | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async clearClassroomState(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  async saveStudentMeta(meta: StudentMetaMap): Promise<void> {
    try {
      localStorage.setItem(STUDENT_META_KEY, JSON.stringify(meta));
    } catch {
      // localStorage might be full or unavailable
    }
  }

  async loadStudentMeta(): Promise<StudentMetaMap | null> {
    try {
      const raw = localStorage.getItem(STUDENT_META_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async saveProjectsState(state: ProjectsState): Promise<void> {
    try {
      const toSave = {
        ...state,
        projects: state.projects.map(({ allRounds: _allRounds, ...rest }) => {
          void _allRounds;
          return rest;
        }),
      };
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // localStorage might be full or unavailable
    }
  }

  async loadProjectsState(): Promise<PersistedProjectsState | null> {
    try {
      const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async clearProjectsState(): Promise<void> {
    try {
      localStorage.removeItem(PROJECTS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  async clearAll(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STUDENT_META_KEY);
      localStorage.removeItem(PROJECTS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
