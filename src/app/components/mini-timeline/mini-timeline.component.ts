import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TimelineItem, toMin } from '../../engine/engagement-engine';
import { entryMeta } from '../../util/entry-meta.util';

interface Dot {
  left: number;
  accent: string;
  isWalk: boolean;
  title: string;
  time: string;
}

/** A 22px track with a dot per entry, positioned by time across the awake window. */
@Component({
  selector: 'app-mini-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mini-timeline.component.html',
  styleUrls: ['./mini-timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiniTimelineComponent {
  @Input() items: TimelineItem[] = [];
  @Input() startMin = 0;
  @Input() endMin = 1;

  get middayLeft(): number {
    return ((12 * 60 - this.startMin) / this.span) * 100;
  }

  get dots(): Dot[] {
    const span = this.span;
    return this.items.map((item) => ({
      left: Math.min(96, Math.max(2, ((toMin(item.time) - this.startMin) / span) * 100)),
      accent: entryMeta(item).accent,
      isWalk: item.type === 'walk',
      title: `${item.time} ${item.title}`,
      time: item.time
    }));
  }

  trackByIndex(index: number): number {
    return index;
  }

  private get span(): number {
    return Math.max(1, this.endMin - this.startMin);
  }
}
