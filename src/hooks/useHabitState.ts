import { useReducer, useEffect, useCallback, useRef } from 'react';
import type { AppState, AppAction, DailyRecord } from '@/types';
import { DEFAULT_HABITS, DEFAULT_DAILY_TARGET } from '@/constants/theme';
import { loadState, saveState, clearDailyIfNewDay, todayDateString } from '@/utils/storage';
import { NativeModules, Platform } from 'react-native';

const { StriveRingActivityBridge } = NativeModules;

const syncWidgetState = (dailyStrain: number, target: number, completedSessions: any[]) => {
  if (Platform.OS === 'ios' && StriveRingActivityBridge?.syncSharedState) {
    try {
      StriveRingActivityBridge.syncSharedState(
        Math.round(dailyStrain),
        Math.round(target),
        JSON.stringify(completedSessions)
      );
    } catch (err) {
      console.warn('Failed to sync widget state:', err);
    }
  }
};

function generateMockHistory(): Record<string, DailyRecord> {
  const history: Record<string, DailyRecord> = {};
  
  const d1 = new Date();
  d1.setDate(d1.getDate() - 1);
  const yesterdayStr = `${d1.getFullYear()}-${String(d1.getMonth() + 1).padStart(2, '0')}-${String(d1.getDate()).padStart(2, '0')}`;
  
  const d2 = new Date();
  d2.setDate(d2.getDate() - 2);
  const twoDaysAgoStr = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}-${String(d2.getDate()).padStart(2, '0')}`;
  
  history[yesterdayStr] = {
    date: yesterdayStr,
    totalScore: 79,
    target: 100,
    completedSessions: [
      {
        habitId: 'default-exercise',
        startTime: Date.now() - 86400000 - 18000000,
        endTime: Date.now() - 86400000 - 10800000,
        score: 40,
        habitName: 'Exercise',
      },
      {
        habitId: 'default-focus',
        startTime: Date.now() - 86400000 - 36000000,
        endTime: Date.now() - 86400000 - 28800000,
        score: 39,
        habitName: 'Focus Work',
      }
    ]
  };

  history[twoDaysAgoStr] = {
    date: twoDaysAgoStr,
    totalScore: 76,
    target: 100,
    completedSessions: [
      {
        habitId: 'default-sleep',
        startTime: Date.now() - 172800000 - 28800000,
        endTime: Date.now() - 172800000,
        score: 30,
        habitName: 'Sleep',
      },
      {
        habitId: 'default-focus',
        startTime: Date.now() - 172800000 - 36000000,
        endTime: Date.now() - 172800000 - 28800000,
        score: 46,
        habitName: 'Focus Work',
      }
    ]
  };
  
  return history;
}

function createDefaultState(): AppState {
  return {
    habits: DEFAULT_HABITS,
    selectedHabitId: null,
    activeSession: null,
    dailyRecord: {
      date: todayDateString(),
      totalScore: 0,
      completedSessions: [],
      target: DEFAULT_DAILY_TARGET,
    },
    history: generateMockHistory(),
    isLoaded: false,
  };
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD_STATE': {
      const today = todayDateString();
      let history = action.state.history || {};
      if (Object.keys(history).length === 0) {
        history = generateMockHistory();
      }
      if (action.state.dailyRecord.date !== today) {
        return {
          ...action.state,
          activeSession: action.state.activeSession,
          selectedHabitId: action.state.selectedHabitId,
          history: {
            ...history,
            [action.state.dailyRecord.date]: action.state.dailyRecord,
          },
          dailyRecord: {
            date: today,
            totalScore: 0,
            completedSessions: [],
            target: action.state.dailyRecord.target,
          },
          isLoaded: true,
        };
      }
      return { ...action.state, history, isLoaded: true };
    }
    case 'IMPORT_STATE':
      return {
        ...action.state,
        history: action.state.history ?? {},
        isLoaded: true,
      };
    case 'SELECT_HABIT':
      // Block selecting another habit if a session is currently running or paused
      if (state.activeSession !== null) {
        return state;
      }
      return { ...state, selectedHabitId: action.habitId };
    case 'START_SESSION':
      return {
        ...state,
        selectedHabitId: action.habitId,
        activeSession: {
          habitId: action.habitId,
          startTime: action.startTime,
          accumulatedMs: 0,
          isPaused: false,
          pausedAt: null,
        },
      };
    case 'PAUSE_SESSION':
      if (!state.activeSession) return state;
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          isPaused: true,
          pausedAt: action.pausedAt,
          accumulatedMs: action.accumulatedMs,
        },
      };
    case 'RESUME_SESSION':
      if (!state.activeSession) return state;
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          isPaused: false,
          pausedAt: null,
          startTime: action.startTime,
        },
      };
    case 'STOP_SESSION': {
      if (!state.activeSession) return state;
      return {
        ...state,
        activeSession: null,
        selectedHabitId: null,
        dailyRecord: {
          ...state.dailyRecord,
          totalScore: state.dailyRecord.totalScore + action.score,
          completedSessions: [
            ...state.dailyRecord.completedSessions,
            {
              habitId: state.activeSession.habitId,
              startTime: state.activeSession.startTime,
              endTime: action.endTime,
              score: action.score,
              habitName: action.habitName,
            },
          ],
        },
      };
    }
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.habit] };
    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map((h) => h.id === action.habit.id ? action.habit : h),
        selectedHabitId: state.selectedHabitId === action.habit.id ? action.habit.id : state.selectedHabitId,
      };
    case 'DELETE_HABIT':
      return {
        ...state,
        selectedHabitId: state.selectedHabitId === action.habitId ? null : state.selectedHabitId,
        habits: state.habits.filter((h) => h.id !== action.habitId),
      };
    case 'SET_TARGET':
      return {
        ...state,
        dailyRecord: { ...state.dailyRecord, target: action.target },
      };
    case 'SIMULATE_HOUR':
      if (!state.activeSession) return state;
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          accumulatedMs: action.accumulatedMs,
        },
      };
    case 'TICK':
      return { ...state };
    default:
      return state;
  }
}

export function useHabitState() {
  const [state, dispatch] = useReducer(reducer, createDefaultState());
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadState();
      if (cancelled) return;
      let nextState;
      if (saved) {
        nextState = await clearDailyIfNewDay(saved);
        if (!cancelled) dispatch({ type: 'LOAD_STATE', state: nextState });
      } else {
        nextState = createDefaultState();
        dispatch({ type: 'LOAD_STATE', state: nextState });
      }
      
      if (!cancelled && nextState) {
        const completedSessionsForWidget = nextState.dailyRecord.completedSessions.map(session => {
          const habit = nextState.habits.find(h => h.id === session.habitId);
          const colorHex = habit ? habit.accentColor : '#00e5a0';
          return {
            name: session.habitName,
            score: Math.round(session.score),
            colorHex
          };
        });
        syncWidgetState(nextState.dailyRecord.totalScore, nextState.dailyRecord.target, completedSessionsForWidget);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const persistDispatch = useCallback(async (action: AppAction) => {
    const next = reducer(stateRef.current, action);
    dispatch(action);
    await saveState(next);
    
    const completedSessionsForWidget = next.dailyRecord.completedSessions.map(session => {
      const habit = next.habits.find(h => h.id === session.habitId);
      const colorHex = habit ? habit.accentColor : '#00e5a0';
      return {
        name: session.habitName,
        score: Math.round(session.score),
        colorHex
      };
    });
    syncWidgetState(next.dailyRecord.totalScore, next.dailyRecord.target, completedSessionsForWidget);
  }, []);

  return { state, dispatch, persistDispatch };
}
