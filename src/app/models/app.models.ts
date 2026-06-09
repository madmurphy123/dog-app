/* App-level state shapes (distinct from the engine's output shapes). */

import { TimelineItem } from '../engine/engagement-engine';

export type TabId = 'today' | 'week' | 'goals' | 'kit' | 'setup';

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

/** Per-date exceptions layered on top of the recurring routine. */
export interface DayOverride {
  dayCare?: boolean;
  events?: EventRow[];
  walks?: WalkRow[];
  skip?: string[];
}

export interface FormState {
  /** The day currently being viewed (navigation state, not routine data). */
  date: string;
  /** Recurring routine: awake window + commitments + walks (each with weekdays). */
  dayStart: string;
  dayEnd: string;
  reminders: boolean;
  treats: boolean;
  events: EventRow[];
  walks: WalkRow[];
  /** One-offs / skips / day-care, keyed by ISO date. */
  overrides: Record<string, DayOverride>;
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

/** The active day's routine items with their per-day skip state (for the day editor). */
export interface DaySchedule {
  events: { row: EventRow; skipped: boolean }[];
  walks: { row: WalkRow; skipped: boolean }[];
}

/** A single reminder flattened to an absolute time, for the push backend. */
export interface PushReminder {
  id: string;
  at: number;
  title: string;
  body: string;
}
