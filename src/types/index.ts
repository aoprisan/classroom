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
