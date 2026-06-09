import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Arousal, TimelineItem } from '../../engine/engagement-engine';
import { EntryMeta, entryMeta } from '../../util/entry-meta.util';
import { ArousalIndicatorComponent } from '../arousal-indicator/arousal-indicator.component';
import { IconComponent } from '../icon/icon.component';

interface GoalInfo {
  title: string;
  stepIndex: number;
  total: number;
  criterion: string;
}

interface EntryVm {
  item: TimelineItem;
  meta: EntryMeta;
  kind: TimelineItem['type'];
  isGame: boolean;
  isGoal: boolean;
  arousal: Arousal | null;
  tasks: string[] | null;
  minutes: number | null;
  equipment: string[];
  variation: string | null;
  goal: GoalInfo | null;
}

/** Rich card for a single timeline entry (walk / game / treat / care / goal). */
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
  @Output() nailed = new EventEmitter<void>();

  get vm(): EntryVm | null {
    const item = this.item;
    if (!item) return null;
    return {
      item,
      meta: entryMeta(item),
      kind: item.type,
      isGame: item.type === 'game',
      isGoal: item.type === 'goal',
      arousal: item.type === 'game' ? item.arousal : null,
      tasks: item.type === 'walk' ? item.tasks : null,
      minutes:
        item.type === 'game' ? item.minutes : item.type === 'walk' ? item.minutes : item.type === 'goal' ? item.minutes : null,
      equipment: item.type === 'game' ? item.equipment : item.type === 'goal' ? item.equipment : [],
      variation: item.type === 'game' ? item.variation ?? null : null,
      goal:
        item.type === 'goal'
          ? { title: item.goalTitle, stepIndex: item.stepIndex, total: item.totalSteps, criterion: item.criterion }
          : null
    };
  }

  trackByIndex(index: number): number {
    return index;
  }
}
