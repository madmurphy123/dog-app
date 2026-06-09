import { TimelineItem } from '../engine/engagement-engine';

/* Stable key for a timeline entry — used for done-ticks and trackBy. */
export function itemKey(item: TimelineItem): string {
  return `${item.time}-${item.title}`;
}
