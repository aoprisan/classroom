import type { ClassroomState, StudentMetaMap, ProjectsState } from '../types';
import type { StorageAdapter, PersistedClassroomState, PersistedProjectsState } from './storage-adapter';
import type { ApiClient } from './api-client';

const VALID_GENDERS = new Set(['M', 'F', '']);
function validateGender(g: string): 'M' | 'F' | '' {
  return VALID_GENDERS.has(g) ? g as 'M' | 'F' | '' : '';
}

interface ApiClassroom {
  id: string;
  userId: string;
  name: string;
  totalStudents: number;
  rowCount: number;
  studentsPerBench: number;
  completedRoundIndices: number[];
  currentViewIndex: number;
}

interface ApiStudent {
  id: string;
  classroomId: string;
  studentNum: number;
  lastName: string;
  firstName: string;
  heightCm: number | null;
  gender: string;
}

interface ApiProject {
  id: string;
  classroomId: string;
  courseName: string;
  projectName: string;
  teamSize: number;
  totalStudents: number;
  completedRoundIndices: number[];
  currentViewIndex: number;
}

export class ApiStorageAdapter implements StorageAdapter {
  private client: ApiClient;
  private classroomId: string;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingClassroomSave: ClassroomState | null = null;
  private pendingStudentSave: StudentMetaMap | null = null;

  constructor(client: ApiClient, classroomId: string) {
    this.client = client;
    this.classroomId = classroomId;
  }

  async saveClassroomState(state: ClassroomState): Promise<void> {
    this.pendingClassroomSave = state;
    this.scheduleSave();
  }

  async loadClassroomState(): Promise<PersistedClassroomState | null> {
    try {
      const classroom = await this.client.get<ApiClassroom>(`/classrooms/${this.classroomId}`);
      return {
        config: {
          totalStudents: classroom.totalStudents,
          rowCount: classroom.rowCount,
          studentsPerBench: classroom.studentsPerBench,
        },
        completedRoundIndices: classroom.completedRoundIndices,
        currentViewIndex: classroom.currentViewIndex,
      };
    } catch {
      return null;
    }
  }

  async clearClassroomState(): Promise<void> {
    try {
      await this.client.patch(`/classrooms/${this.classroomId}/reset`);
    } catch {
      // ignore
    }
  }

  async saveStudentMeta(meta: StudentMetaMap): Promise<void> {
    this.pendingStudentSave = meta;
    this.scheduleSave();
  }

  async loadStudentMeta(): Promise<StudentMetaMap | null> {
    try {
      const students = await this.client.get<ApiStudent[]>(`/classrooms/${this.classroomId}/students`);
      if (!students.length) return null;

      const map: StudentMetaMap = {};
      for (const s of students) {
        map[s.studentNum] = {
          lastName: s.lastName,
          firstName: s.firstName,
          heightCm: s.heightCm,
          gender: validateGender(s.gender),
        };
      }
      return map;
    } catch {
      return null;
    }
  }

  async saveProjectsState(_state: ProjectsState): Promise<void> {
    void _state;
    // Projects are managed individually via API; bulk save is a no-op
  }

  async loadProjectsState(): Promise<PersistedProjectsState | null> {
    try {
      const projects = await this.client.get<ApiProject[]>(`/classrooms/${this.classroomId}/projects`);

      return {
        activeProjectId: projects[0]?.id ?? null,
        projects: projects.map((p) => ({
          config: {
            id: p.id,
            courseName: p.courseName,
            projectName: p.projectName,
            teamSize: p.teamSize,
            totalStudents: p.totalStudents,
          },
          completedRoundIndices: p.completedRoundIndices,
          currentViewIndex: p.currentViewIndex,
        })),
      };
    } catch {
      return null;
    }
  }

  async clearProjectsState(): Promise<void> {
    // No-op for API mode - projects are managed individually
  }

  async clearAll(): Promise<void> {
    try {
      await this.client.patch(`/classrooms/${this.classroomId}/reset`);
    } catch {
      // ignore
    }
  }

  private scheduleSave(): void {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => this.flushSaves(), 500);
  }

  private async flushSaves(): Promise<void> {
    this.saveTimer = null;

    const classroomState = this.pendingClassroomSave;
    const studentMeta = this.pendingStudentSave;

    this.pendingClassroomSave = null;
    this.pendingStudentSave = null;

    try {
      if (classroomState) {
        await this.client.put(`/classrooms/${this.classroomId}`, {
          totalStudents: classroomState.config.totalStudents,
          rowCount: classroomState.config.rowCount,
          studentsPerBench: classroomState.config.studentsPerBench,
        });
      }

      if (studentMeta) {
        const students = Object.entries(studentMeta)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([, s]) => ({
            lastName: s.lastName,
            firstName: s.firstName,
            heightCm: s.heightCm,
            gender: s.gender,
          }));
        await this.client.put(`/classrooms/${this.classroomId}/students`, { students });
      }
    } catch (e) {
      console.error('Failed to save to API:', e);
    }
  }
}
