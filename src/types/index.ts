export type Pair = [number, number];

export interface Round {
  index: number;
  pairs: Pair[];
  sitsAlone?: number; // student who sits alone (odd count)
}

export interface LayoutConfig {
  totalStudents: number;
  rowCount: number;
  studentsPerBench: number;
}

export interface StudentMeta {
  lastName: string;
  firstName: string;
  heightCm: number | null;
  gender: 'M' | 'F' | '';
}

export type StudentMetaMap = Record<number, StudentMeta>;

export type Tab = 'classroom' | 'students' | 'history' | 'matrix' | 'config';

export type AppMode = 'classroom' | 'projects';
export type ProjectTab = 'projects' | 'teams' | 'history' | 'matrix';

export interface ClassroomState {
  config: LayoutConfig;
  allRounds: Round[];
  completedRoundIndices: number[];
  currentViewIndex: number;
}

export type ClassroomAction =
  | { type: 'SHUFFLE_NEXT' }
  | { type: 'VIEW_ROUND'; index: number }
  | { type: 'UPDATE_CONFIG'; config: LayoutConfig }
  | { type: 'RESET_ALL' }
  | { type: 'HYDRATE'; state: ClassroomState };

export type Team = number[];

export interface TeamRound {
  index: number;
  teams: Team[];
}

export interface ProjectConfig {
  id: string;
  courseName: string;
  projectName: string;
  teamSize: number;
  totalStudents: number;
}

export interface ProjectState {
  config: ProjectConfig;
  allRounds: TeamRound[];
  completedRoundIndices: number[];
  currentViewIndex: number;
}

export interface ProjectsState {
  projects: ProjectState[];
  activeProjectId: string | null;
}

export type ProjectsAction =
  | { type: 'ADD_PROJECT'; config: ProjectConfig }
  | { type: 'REMOVE_PROJECT'; id: string }
  | { type: 'SELECT_PROJECT'; id: string }
  | { type: 'SHUFFLE_NEXT'; projectId: string }
  | { type: 'VIEW_ROUND'; projectId: string; index: number }
  | { type: 'HYDRATE'; state: ProjectsState };
