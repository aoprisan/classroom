import type { ClassroomState, StudentMetaMap, ProjectsState } from '../types';
import { STORAGE_KEY, STUDENT_META_KEY, PROJECTS_STORAGE_KEY } from '../constants';

export function saveState(state: ClassroomState): void {
  try {
    // Don't persist allRounds — they're recomputed from config
    const { allRounds: _allRounds, ...rest } = state;
    void _allRounds;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function loadState(): Omit<ClassroomState, 'allRounds'> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function saveStudentMeta(meta: StudentMetaMap): void {
  try {
    localStorage.setItem(STUDENT_META_KEY, JSON.stringify(meta));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function saveProjectsState(state: ProjectsState): void {
  try {
    // Don't persist allRounds — they're recomputed from config
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

export function loadProjectsState(): Omit<ProjectsState, 'projects'> & { projects: Omit<ProjectsState['projects'][number], 'allRounds'>[] } | null {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearProjectsState(): void {
  try {
    localStorage.removeItem(PROJECTS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function clearAll(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STUDENT_META_KEY);
    localStorage.removeItem(PROJECTS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function loadStudentMeta(): StudentMetaMap | null {
  try {
    const raw = localStorage.getItem(STUDENT_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
