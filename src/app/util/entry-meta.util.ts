import { Arousal, TimelineItem } from '../engine/engagement-engine';
import { IconName } from './icon.types';

export interface ArousalMeta {
  label: string;
  short: string;
  level: number;
  varc: string;
  tint: string;
  glyph: IconName;
}

export const AROUSAL: Record<Arousal, ArousalMeta> = {
  high: { label: 'High energy', short: 'High', level: 3, varc: '--high', tint: '--high-tint', glyph: 'flame' },
  med: { label: 'Medium', short: 'Med', level: 2, varc: '--med', tint: '--med-tint', glyph: 'sparkle' },
  low: { label: 'Calm', short: 'Calm', level: 1, varc: '--low', tint: '--low-tint', glyph: 'leaf' }
};

export interface EntryMeta {
  accent: string;
  tint: string;
  icon: IconName;
  type: string;
}

/* Per-entry visual identity (accent colour, tint, icon, type label). */
export function entryMeta(item: TimelineItem): EntryMeta {
  if (item.type === 'walk') return { accent: 'var(--walk)', tint: 'var(--walk-tint)', icon: 'walk', type: 'Walk' };
  if (item.type === 'treat') return { accent: 'var(--treat)', tint: 'var(--treat-tint)', icon: 'gift', type: 'Treat' };
  if (item.type === 'care') return { accent: 'var(--care)', tint: 'var(--care-tint)', icon: 'droplet', type: 'Care' };
  if (item.type === 'goal') return { accent: 'var(--goal)', tint: 'var(--goal-tint)', icon: 'target', type: 'Goal' };
  const a = AROUSAL[item.arousal];
  return { accent: `var(${a.varc})`, tint: `var(${a.tint})`, icon: 'paw', type: 'Game' };
}
