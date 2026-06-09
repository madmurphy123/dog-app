/* App-level state shapes (distinct from the engine's output shapes). */

import { TimelineItem } from '../engine/engagement-engine';

export type TabId = 'today' | 'week' | 'kit' | 'setup';

export interface DogProfile {
  name: string;
  avatar: string | null;
}

/** Weekday indices used throughout: 0 = Mon … 6 = Sun. */
export const ALL_DAYS: number[] = [0, 1, 2, 3, 4, 5, 6];
export const DAY_LABELS: readonly string[] = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export interface EventRow {
  id: string;
  start: string;
  end: string;
  label: string;
  days: number[];
}

export interface WalkRow {
  id: string;
  time: string;
  duration: number;
  days: number[];
}

export interface FormState {
  date: string;
  dayStart: string;
  dayEnd: string;
  reminders: boolean;
  treats: boolean;
  dayCareDates: string[];
  events: EventRow[];
  walks: WalkRow[];
}

export interface WeekDay {
  iso: string;
  date: Date;
  isCare: boolean;
  isToday: boolean;
  isActive: boolean;
  games: number;
  walks: number;
  items: TimelineItem[];
}

/** A single reminder flattened to an absolute time, for the push backend. */
export interface PushReminder {
  id: string;
  at: number;
  title: string;
  body: string;
}
