import type { LayoutConfig } from './types';

export const DEFAULT_CONFIG: LayoutConfig = {
  totalStudents: 28,
  rowCount: 3,
  studentsPerBench: 2,
};

export const CONFIG_LIMITS = {
  minStudents: 4,
  maxStudents: 60,
  minRows: 1,
  maxRows: 6,
  studentsPerBench: 2, // fixed at 2
} as const;

export const STORAGE_KEY = 'classroom-seating-state';
export const STUDENT_META_KEY = 'classroom-student-meta';
export const PROJECTS_STORAGE_KEY = 'classroom-projects-state';

export const PROJECT_LIMITS = {
  minTeamSize: 2,
  maxTeamSize: 6,
  maxProjects: 20,
} as const;
