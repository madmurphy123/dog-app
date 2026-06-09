import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Arousal, TimelineItem } from '../../engine/engagement-engine';
import { EntryMeta, entryMeta } from '../../util/entry-meta.util';
import { ArousalIndicatorComponent } from '../arousal-indicator/arousal-indicator.component';
import { IconComponent } from '../icon/icon.component';

interface EntryVm {
  item: TimelineItem;
  meta: EntryMeta;
  kind: TimelineItem['type'];
  isGame: boolean;
  arousal: Arousal | null;
  tasks: string[] | null;
  minutes: number | null;
  equipment: string[];
  variation: string | null;
}

/** Rich card for a single timeline entry (walk / game / treat / care). */
@Component({
  selector: 'app-entry-card',
  standalone: true,
  imports: [CommonModule, IconComponent, ArousalIndicatorComponent],
  templateUrl: './entry-card.component.html',
  styleUrls: ['./entry-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntryCardComponent {
  @Input() item: TimelineItem | null = null;
  @Input() done = false;
  @Input() showAction = true;
  @Output() toggleDone = new EventEmitter<void>();
  @Output() swap = new EventEmitter<void>();

  get vm(): EntryVm | null {
    const item = this.item;
    if (!item) return null;
    return {
      item,
      meta: entryMeta(item),
      kind: item.type,
      isGame: item.type === 'game',
      arousal: item.type === 'game' ? item.arousal : null,
      tasks: item.type === 'walk' ? item.tasks : null,
      minutes: item.type === 'game' ? item.minutes : item.type === 'walk' ? item.minutes : null,
      equipment: item.type === 'game' ? item.equipment : [],
      variation: item.type === 'game' ? item.variation ?? null : null
    };
  }

  trackByIndex(index: number): number {
    return index;
  }
}
