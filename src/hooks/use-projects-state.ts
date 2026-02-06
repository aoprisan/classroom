import { useReducer, useEffect, useCallback } from 'react';
import type { ProjectsState, ProjectsAction, ProjectConfig } from '../types';
import { generateTeamRounds } from '../lib/team-rounds';
import { saveProjectsState, loadProjectsState } from '../lib/storage';

function createProjectState(config: ProjectConfig) {
  return {
    config,
    allRounds: generateTeamRounds(config.totalStudents, config.teamSize),
    completedRoundIndices: [] as number[],
    currentViewIndex: -1,
  };
}

const INITIAL_STATE: ProjectsState = {
  projects: [],
  activeProjectId: null,
};

function reducer(state: ProjectsState, action: ProjectsAction): ProjectsState {
  switch (action.type) {
    case 'ADD_PROJECT': {
      const project = createProjectState(action.config);
      return {
        projects: [...state.projects, project],
        activeProjectId: action.config.id,
      };
    }
    case 'REMOVE_PROJECT': {
      const projects = state.projects.filter((p) => p.config.id !== action.id);
      return {
        projects,
        activeProjectId:
          state.activeProjectId === action.id
            ? (projects[0]?.config.id ?? null)
            : state.activeProjectId,
      };
    }
    case 'SELECT_PROJECT':
      return { ...state, activeProjectId: action.id };
    case 'SHUFFLE_NEXT': {
      return {
        ...state,
        projects: state.projects.map((p) => {
          if (p.config.id !== action.projectId) return p;
          const nextIndex = p.completedRoundIndices.length;
          if (nextIndex >= p.allRounds.length) return p;
          return {
            ...p,
            completedRoundIndices: [...p.completedRoundIndices, nextIndex],
            currentViewIndex: nextIndex,
          };
        }),
      };
    }
    case 'VIEW_ROUND': {
      return {
        ...state,
        projects: state.projects.map((p) => {
          if (p.config.id !== action.projectId) return p;
          return { ...p, currentViewIndex: action.index };
        }),
      };
    }
    case 'HYDRATE':
      return action.state;
    default:
      return state;
  }
}

export function useProjectsState() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadProjectsState();
    if (saved) {
      const hydrated: ProjectsState = {
        ...saved,
        projects: saved.projects.map((p) => ({
          ...p,
          allRounds: generateTeamRounds(p.config.totalStudents, p.config.teamSize),
        })),
      };
      dispatch({ type: 'HYDRATE', state: hydrated });
    }
  }, []);

  // Persist on every change
  useEffect(() => {
    saveProjectsState(state);
  }, [state]);

  const activeProject = state.projects.find(
    (p) => p.config.id === state.activeProjectId,
  ) ?? null;

  const currentRound = activeProject && activeProject.currentViewIndex >= 0
    ? activeProject.allRounds[activeProject.currentViewIndex] ?? null
    : null;

  const canShuffleNext = activeProject
    ? activeProject.completedRoundIndices.length < activeProject.allRounds.length
    : false;

  const canGoPrev = activeProject ? activeProject.currentViewIndex > 0 : false;
  const canGoNext = activeProject
    ? activeProject.currentViewIndex < activeProject.completedRoundIndices.length - 1
    : false;

  const addProject = useCallback(
    (config: ProjectConfig) => dispatch({ type: 'ADD_PROJECT', config }),
    [],
  );
  const removeProject = useCallback(
    (id: string) => dispatch({ type: 'REMOVE_PROJECT', id }),
    [],
  );
  const selectProject = useCallback(
    (id: string) => dispatch({ type: 'SELECT_PROJECT', id }),
    [],
  );
  const shuffleNext = useCallback(() => {
    if (state.activeProjectId) {
      dispatch({ type: 'SHUFFLE_NEXT', projectId: state.activeProjectId });
    }
  }, [state.activeProjectId]);
  const viewRound = useCallback(
    (index: number) => {
      if (state.activeProjectId) {
        dispatch({ type: 'VIEW_ROUND', projectId: state.activeProjectId, index });
      }
    },
    [state.activeProjectId],
  );
  const viewPrev = useCallback(() => {
    if (activeProject && activeProject.currentViewIndex > 0) {
      dispatch({
        type: 'VIEW_ROUND',
        projectId: activeProject.config.id,
        index: activeProject.currentViewIndex - 1,
      });
    }
  }, [activeProject]);
  const viewNext = useCallback(() => {
    if (
      activeProject &&
      activeProject.currentViewIndex < activeProject.completedRoundIndices.length - 1
    ) {
      dispatch({
        type: 'VIEW_ROUND',
        projectId: activeProject.config.id,
        index: activeProject.currentViewIndex + 1,
      });
    }
  }, [activeProject]);

  return {
    state,
    activeProject,
    currentRound,
    canShuffleNext,
    canGoPrev,
    canGoNext,
    addProject,
    removeProject,
    selectProject,
    shuffleNext,
    viewRound,
    viewPrev,
    viewNext,
  };
}
