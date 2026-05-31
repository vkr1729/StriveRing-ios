export interface Habit {
  id: string;
  name: string;
  pointsPerHour: number;
  accentColor: string;
  createdAt: number;
  minimumHours?: number;
}

export interface ActiveSession {
  habitId: string;
  startTime: number;
  accumulatedMs: number;
  isPaused: boolean;
  pausedAt: number | null;
}

export interface CompletedSession {
  habitId: string;
  startTime: number;
  endTime: number;
  score: number;
  habitName: string;
}

export interface DailyRecord {
  date: string;
  totalScore: number;
  completedSessions: CompletedSession[];
  target: number;
}

export interface AppState {
  habits: Habit[];
  selectedHabitId: string | null;
  activeSession: ActiveSession | null;
  dailyRecord: DailyRecord;
  history: Record<string, DailyRecord>;
  isLoaded: boolean;
}

export type AppAction =
  | { type: 'LOAD_STATE'; state: AppState }
  | { type: 'IMPORT_STATE'; state: AppState }
  | { type: 'SELECT_HABIT'; habitId: string }
  | { type: 'START_SESSION'; habitId: string; startTime: number }
  | { type: 'PAUSE_SESSION'; pausedAt: number; accumulatedMs: number }
  | { type: 'RESUME_SESSION'; startTime: number }
  | { type: 'STOP_SESSION'; endTime: number; score: number; habitName: string }
  | { type: 'ADD_HABIT'; habit: Habit }
  | { type: 'UPDATE_HABIT'; habit: Habit }
  | { type: 'DELETE_HABIT'; habitId: string }
  | { type: 'SET_TARGET'; target: number }
  | { type: 'SIMULATE_HOUR'; accumulatedMs: number; score: number }
  | { type: 'TICK'; currentTime: number };
