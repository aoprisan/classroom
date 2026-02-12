import { useReducer, useEffect, useCallback, useRef } from 'react';
import type { ClassroomState, ClassroomAction, LayoutConfig, StudentMetaMap } from '../types';
import { DEFAULT_CONFIG } from '../constants';
import { generateRounds } from '../lib/constrained-pairing';
import { useStorage } from './use-storage';

function createInitialState(config: LayoutConfig, genderMap?: StudentMetaMap): ClassroomState {
  return {
    config: { ...config, pairingMode: config.pairingMode ?? 'random' },
    allRounds: generateRounds(config.totalStudents, config.pairingMode ?? 'random', genderMap),
    completedRoundIndices: [],
    currentViewIndex: -1,
  };
}

function reducer(state: ClassroomState, action: ClassroomAction): ClassroomState {
  switch (action.type) {
    case 'SHUFFLE_NEXT': {
      const nextIndex = state.completedRoundIndices.length;
      if (nextIndex >= state.allRounds.length) return state;
      return {
        ...state,
        completedRoundIndices: [...state.completedRoundIndices, nextIndex],
        currentViewIndex: nextIndex,
      };
    }
    case 'VIEW_ROUND':
      return { ...state, currentViewIndex: action.index };
    case 'UPDATE_CONFIG': {
      const newState = createInitialState(action.config, action.genderMap);
      return newState;
    }
    case 'RESET_ALL':
      return createInitialState(state.config);
    case 'HYDRATE':
      return action.state;
    default:
      return state;
  }
}

export function useClassroomState() {
  const [state, dispatch] = useReducer(reducer, DEFAULT_CONFIG, createInitialState);
  const { adapter } = useStorage();
  const hydrated = useRef(false);

  // Hydrate from storage on mount
  useEffect(() => {
    Promise.all([
      adapter.loadClassroomState(),
      adapter.loadStudentMeta(),
    ]).then(([saved, studentMeta]) => {
      if (saved) {
        const config = { ...saved.config, pairingMode: saved.config.pairingMode ?? 'random' as const };
        const genderMap = studentMeta ?? undefined;
        const allRounds = generateRounds(config.totalStudents, config.pairingMode, genderMap);
        dispatch({ type: 'HYDRATE', state: { ...saved, config, allRounds } });
      }
      hydrated.current = true;
    });
  }, [adapter]);

  // Persist on every change (after hydration)
  useEffect(() => {
    if (hydrated.current) {
      adapter.saveClassroomState(state);
    }
  }, [state, adapter]);

  const shuffleNext = useCallback(() => dispatch({ type: 'SHUFFLE_NEXT' }), []);
  const viewRound = useCallback((index: number) => dispatch({ type: 'VIEW_ROUND', index }), []);
  const updateConfig = useCallback((config: LayoutConfig, genderMap?: StudentMetaMap) => dispatch({ type: 'UPDATE_CONFIG', config, genderMap }), []);
  const resetAll = useCallback(() => dispatch({ type: 'RESET_ALL' }), []);

  const currentRound = state.currentViewIndex >= 0 ? state.allRounds[state.currentViewIndex] : null;
  const canShuffleNext = state.completedRoundIndices.length < state.allRounds.length;
  const canGoPrev = state.currentViewIndex > 0;
  const canGoNext = state.currentViewIndex < state.completedRoundIndices.length - 1;

  return {
    state,
    currentRound,
    canShuffleNext,
    canGoPrev,
    canGoNext,
    shuffleNext,
    viewRound,
    updateConfig,
    resetAll,
    viewPrev: useCallback(() => {
      if (state.currentViewIndex > 0) {
        dispatch({ type: 'VIEW_ROUND', index: state.currentViewIndex - 1 });
      }
    }, [state.currentViewIndex]),
    viewNext: useCallback(() => {
      if (state.currentViewIndex < state.completedRoundIndices.length - 1) {
        dispatch({ type: 'VIEW_ROUND', index: state.currentViewIndex + 1 });
      }
    }, [state.currentViewIndex, state.completedRoundIndices.length]),
  };
}
