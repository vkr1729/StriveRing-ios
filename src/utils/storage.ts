import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState } from '@/types';

const STORAGE_KEY = 'strivering_state';

export function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function loadState(): Promise<AppState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

export async function saveState(state: AppState): Promise<void> {
  const raw = JSON.stringify(state);
  await AsyncStorage.setItem(STORAGE_KEY, raw);
}

export async function clearDailyIfNewDay(state: AppState): Promise<AppState> {
  const today = todayDateString();
  if (state.dailyRecord.date !== today) {
    const history = state.history || {};
    const reset: AppState = {
      ...state,
      activeSession: state.activeSession,
      selectedHabitId: state.selectedHabitId,
      history: {
        ...history,
        [state.dailyRecord.date]: state.dailyRecord,
      },
      dailyRecord: {
        date: today,
        totalScore: 0,
        completedSessions: [],
        target: state.dailyRecord.target,
      },
    };
    await saveState(reset);
    return reset;
  }
  return state;
}
