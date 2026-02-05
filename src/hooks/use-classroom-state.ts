import { useReducer, useEffect, useCallback } from 'react';
import type { ClassroomState, ClassroomAction, LayoutConfig } from '../types';
import { DEFAULT_CONFIG } from '../constants';
import { generateAllRounds } from '../lib/round-robin';
import { saveState, loadState } from '../lib/storage';

function createInitialState(config: LayoutConfig): ClassroomState {
  return {
    config,
    allRounds: generateAllRounds(config.totalStudents),
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
      const newState = createInitialState(action.config);
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

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      const allRounds = generateAllRounds(saved.config.totalStudents);
      dispatch({ type: 'HYDRATE', state: { ...saved, allRounds } });
    }
  }, []);

  // Persist on every change (after hydration)
  useEffect(() => {
    saveState(state);
  }, [state]);

  const shuffleNext = useCallback(() => dispatch({ type: 'SHUFFLE_NEXT' }), []);
  const viewRound = useCallback((index: number) => dispatch({ type: 'VIEW_ROUND', index }), []);
  const updateConfig = useCallback((config: LayoutConfig) => dispatch({ type: 'UPDATE_CONFIG', config }), []);
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
