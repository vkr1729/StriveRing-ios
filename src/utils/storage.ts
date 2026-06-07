import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState } from '@/types';
import { calculateActiveScore } from '@/utils/scoring';

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
  try {
    const raw = JSON.stringify(state);
    await AsyncStorage.setItem(STORAGE_KEY, raw);
  } catch (err) {
    console.error('[StriveRing] saveState failed:', err);
  }
}

export async function clearDailyIfNewDay(state: AppState): Promise<AppState> {
  const today = todayDateString();
  let next: AppState = state;

  if (next.activeSession) {
    const ageMs = Date.now() - next.activeSession.startTime;
    if (ageMs > 86_400_000) {
      const session = next.activeSession;
      const habit = next.habits.find((h) => h.id === session.habitId);
      if (habit) {
        const cappedAccumulatedMs = session.isPaused
          ? session.accumulatedMs
          : Math.min(
              session.accumulatedMs + (Date.now() - session.startTime),
              86_400_000
            );
        const cappedSession = {
          ...session,
          accumulatedMs: cappedAccumulatedMs,
          isPaused: true,
        };
        const score = calculateActiveScore(cappedSession, habit);
        const staleEntry = {
          habitId: session.habitId,
          startTime: session.startTime,
          endTime: Date.now(),
          score,
          habitName: habit.name,
        };
        next = {
          ...next,
          activeSession: null,
          selectedHabitId: null,
          dailyRecord: {
            ...next.dailyRecord,
            totalScore: next.dailyRecord.totalScore + score,
            completedSessions: [...next.dailyRecord.completedSessions, staleEntry],
          },
        };
      } else {
        console.warn('[StriveRing] Discarding stale active session — habit not found.');
        next = { ...next, activeSession: null, selectedHabitId: null };
      }
    }
  }

  if (next.dailyRecord.date !== today) {
    const history = next.history || {};
    const reset: AppState = {
      ...next,
      activeSession: next.activeSession,
      selectedHabitId: next.selectedHabitId,
      history: {
        ...history,
        [next.dailyRecord.date]: next.dailyRecord,
      },
      dailyRecord: {
        date: today,
        totalScore: 0,
        completedSessions: [],
        target: next.dailyRecord.target,
      },
    };
    await saveState(reset);
    return reset;
  }
  return next;
}
