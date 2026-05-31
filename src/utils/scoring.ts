import type { ActiveSession, Habit } from '@/types';
import { RING_CIRCUMFERENCE } from '@/constants/theme';

export const MS_PER_HOUR = 3_600_000;

export function ringOffset(percentComplete: number): number {
  const clamped = Math.max(0, Math.min(1, percentComplete));
  return RING_CIRCUMFERENCE - RING_CIRCUMFERENCE * clamped;
}

export function calculateActiveScore(session: ActiveSession, habit: Habit, now?: number): number {
  const currentTime = now ?? Date.now();
  const elapsedMs = session.isPaused
    ? session.accumulatedMs
    : session.accumulatedMs + (currentTime - session.startTime);
  const hours = elapsedMs / MS_PER_HOUR;
  const rate = Math.max(0, habit.pointsPerHour);

  if (habit.minimumHours !== undefined) {
    return (hours - habit.minimumHours) * rate;
  }
  return hours * rate;
}

export function calculateElapsedMs(session: ActiveSession, now?: number): number {
  const currentTime = now ?? Date.now();
  return session.isPaused
    ? session.accumulatedMs
    : session.accumulatedMs + (currentTime - session.startTime);
}

import { Colors } from '@/constants/theme';

export function getColorForPercent(percent: number): string {
  if (percent >= 0.7) return Colors.accent;
  if (percent >= 0.5) return Colors.strainAmber;
  return Colors.strainRed;
}

export function getGlowColorForPercent(percent: number): string {
  const base = getColorForPercent(percent);
  return `${base}66`;
}

export function getGradientColors(percent: number): [string, string] {
  const base = getColorForPercent(percent);
  return [base, base];
}

export function formatScore(score: number): string {
  return Math.round(score).toString();
}

export function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
