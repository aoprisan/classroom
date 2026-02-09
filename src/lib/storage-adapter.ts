import type { ClassroomState, StudentMetaMap, ProjectsState } from '../types';

export type PersistedClassroomState = Omit<ClassroomState, 'allRounds'>;

export type PersistedProjectsState = Omit<ProjectsState, 'projects'> & {
  projects: Omit<ProjectsState['projects'][number], 'allRounds'>[];
};

export interface StorageAdapter {
  saveClassroomState(state: ClassroomState): Promise<void>;
  loadClassroomState(): Promise<PersistedClassroomState | null>;
  clearClassroomState(): Promise<void>;

  saveStudentMeta(meta: StudentMetaMap): Promise<void>;
  loadStudentMeta(): Promise<StudentMetaMap | null>;

  saveProjectsState(state: ProjectsState): Promise<void>;
  loadProjectsState(): Promise<PersistedProjectsState | null>;
  clearProjectsState(): Promise<void>;

  clearAll(): Promise<void>;
}
