import type { AppState, Habit, DailyRecord } from '@/types';

export interface StatSummary {
  average: number;
  stdDev: number;
}

export interface HabitStat {
  id: string;
  name: string;
  color: string;
  weekly: StatSummary;
  monthly: StatSummary;
}

export interface AnalyticsData {
  weeklyOverall: StatSummary;
  monthlyOverall: StatSummary;
  habits: HabitStat[];
}

function getDateStringForDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function calculateStats(scores: number[]): StatSummary {
  const n = scores.length;
  if (n === 0) return { average: 0, stdDev: 0 };

  const sum = scores.reduce((acc, val) => acc + val, 0);
  const average = sum / n;

  const sqDiffSum = scores.reduce((acc, val) => acc + Math.pow(val - average, 2), 0);
  const variance = sqDiffSum / n;
  const stdDev = Math.sqrt(variance);

  return {
    average: Math.round(average * 10) / 10, // Round to 1 decimal place for neat display
    stdDev: Math.round(stdDev * 10) / 10,
  };
}

export function computeAnalytics(state: AppState): AnalyticsData {
  const weeklyScoresOverall: number[] = [];
  const monthlyScoresOverall: number[] = [];

  const weeklyScoresHabits: Record<string, number[]> = {};
  const monthlyScoresHabits: Record<string, number[]> = {};

  // Initialize habit arrays
  state.habits.forEach((habit) => {
    weeklyScoresHabits[habit.id] = [];
    monthlyScoresHabits[habit.id] = [];
  });

  // Calculate values for last 30 days
  for (let i = 0; i < 30; i++) {
    const dateStr = getDateStringForDaysAgo(i);
    let record: DailyRecord;

    if (i === 0) {
      // Today
      record = state.dailyRecord;
    } else {
      // Historical days
      record = state.history?.[dateStr] || {
        date: dateStr,
        totalScore: 0,
        completedSessions: [],
        target: state.dailyRecord.target,
      };
    }

    const overallScore = record.totalScore;

    // Track overall
    if (i < 7) {
      weeklyScoresOverall.push(overallScore);
    }
    monthlyScoresOverall.push(overallScore);

    // Track habits
    state.habits.forEach((habit) => {
      const habitCompletedScore = record.completedSessions
        .filter((session) => session.habitId === habit.id)
        .reduce((sum, session) => sum + session.score, 0);

      if (i < 7) {
        weeklyScoresHabits[habit.id].push(habitCompletedScore);
      }
      monthlyScoresHabits[habit.id].push(habitCompletedScore);
    });
  }

  // Calculate overall stats
  const weeklyOverall = calculateStats(weeklyScoresOverall);
  const monthlyOverall = calculateStats(monthlyScoresOverall);

  // Calculate per-habit stats
  const habitsData: HabitStat[] = state.habits.map((habit) => {
    const weekly = calculateStats(weeklyScoresHabits[habit.id]);
    const monthly = calculateStats(monthlyScoresHabits[habit.id]);

    return {
      id: habit.id,
      name: habit.name,
      color: habit.accentColor,
      weekly,
      monthly,
    };
  });

  return {
    weeklyOverall,
    monthlyOverall,
    habits: habitsData,
  };
}
