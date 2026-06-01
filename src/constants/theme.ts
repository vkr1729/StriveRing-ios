import type { Habit } from '@/types';
import { Platform } from 'react-native';

export const Colors = {
  background: '#060a10',
  surface: '#0d1117',
  surfaceAlt: '#161b22',
  text: '#f0f3f5',
  textSecondary: '#6e7681',
  border: '#1c2128',
  accent: '#00e5a0',
  accentDim: 'rgba(0, 229, 160, 0.15)',
  strainAmber: '#ffb800',
  strainRed: '#ff3b30',
} as const;

export type ThemeColor = keyof typeof Colors;

export const Glass = {
  light: 'rgba(255, 255, 255, 0.04)',
  medium: 'rgba(255, 255, 255, 0.07)',
  strong: 'rgba(255, 255, 255, 0.10)',
  border: 'rgba(255, 255, 255, 0.08)',
} as const;

export const Gradients = {
  accentStart: '#00e5a0',
  accentEnd: '#00b4d8',
  strainStart: '#ffb800',
  strainEnd: '#ff3b30',
  ringTrack: '#1c2128',
} as const;

export const Fonts = {
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
};

export const Spacing = {
  half: 4,
  one: 8,
  two: 16,
  three: 24,
  four: 32,
  five: 48,
  six: 64,
} as const;

export const RING_RADIUS = 85;
export const RING_STROKE_WIDTH = 8;
export const RING_CIRCUMFERENCE = 534;
export const RING_VIEWBOX = '0 0 240 240';
export const RING_CENTER = 120;

export const DEFAULT_DAILY_TARGET = 100;

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'default-focus',
    name: 'Focus Work',
    pointsPerHour: 6,
    accentColor: '#00e5a0',
    createdAt: 0,
  },
  {
    id: 'default-sleep',
    name: 'Sleep',
    pointsPerHour: 15,
    accentColor: '#a78bfa',
    createdAt: 0,
    minimumHours: 6,
  },
  {
    id: 'default-workout',
    name: 'Workout',
    pointsPerHour: 20,
    accentColor: '#00b4d8',
    createdAt: 0,
  },
  {
    id: 'default-family',
    name: 'Family Time',
    pointsPerHour: 10,
    accentColor: '#ffb800',
    createdAt: 0,
  },
];
