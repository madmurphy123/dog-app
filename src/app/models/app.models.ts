/* App-level state shapes (distinct from the engine's output shapes). */

import { TimelineItem } from '../engine/engagement-engine';

export type TabId = 'today' | 'week' | 'kit' | 'setup';

export interface DogProfile {
  name: string;
  avatar: string | null;
}

export interface EventRow {
  id: string;
  start: string;
  end: string;
  label: string;
}

export interface WalkRow {
  id: string;
  time: string;
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
