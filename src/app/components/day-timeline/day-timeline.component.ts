import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { TimelineItem } from '../../engine/engagement-engine';
import { PlannerService } from '../../services/planner.service';
import { ProfileService } from '../../services/profile.service';
import { itemKey } from '../../util/item-key.util';
import { EntryCardComponent } from '../entry-card/entry-card.component';
import { IconComponent } from '../icon/icon.component';
import { RibbonRowComponent } from '../ribbon-row/ribbon-row.component';

interface DecoratedItem {
  item: TimelineItem;
  done: boolean;
}

interface DayVm {
  configured: boolean;
  isDayCare: boolean;
  reminders: boolean;
  displayName: string;
  dailyNote: string;
  count: number;
  nGames: number;
  nWalks: number;
  firstPending: DecoratedItem | null;
  later: DecoratedItem[];
  extras: DecoratedItem[];
}

/** The Today tab: day-care rest state, daily note, the "Up next" timeline,
    a care/treat strip, and reshuffle. */
@Component({
  selector: 'app-day-timeline',
  standalone: true,
  imports: [CommonModule, IconComponent, EntryCardComponent, RibbonRowComponent],
  templateUrl: './day-timeline.component.html',
  styleUrls: ['./day-timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DayTimelineComponent {
  private readonly planner = inject(PlannerService);
  private readonly profile = inject(ProfileService);

  readonly vm$: Observable<DayVm> = combineLatest([
    this.planner.plan$,
    this.planner.doneSet$,
    this.planner.isDayCare$,
    this.planner.reminders$,
    this.profile.displayName$,
    this.planner.configured$,
    this.planner.dailyNote$
  ]).pipe(map((parts) => this.buildVm(parts)));

  toggleDone(item: TimelineItem): void {
    this.planner.toggleDone(item);
  }

  swapItem(item: TimelineItem): void {
    this.planner.swapItem(item);
  }

  reshuffle(): void {
    this.planner.reshuffle();
  }

  toggleReminders(): void {
    this.planner.toggleReminders();
  }

  planAfterAll(): void {
    this.planner.toggleDayCare();
  }

  goToSetup(): void {
    this.planner.setActiveTab('setup');
  }

  trackByKey(index: number, decorated: DecoratedItem): string {
    return itemKey(decorated.item);
  }

  private buildVm(
    [items, doneSet, isDayCare, reminders, displayName, configured, dailyNote]: [
      TimelineItem[],
      Set<string>,
      boolean,
      boolean,
      string,
      boolean,
      string
    ]
  ): DayVm {
    const decorated: DecoratedItem[] = items.map((item) => ({ item, done: doneSet.has(itemKey(item)) }));
    const main = decorated.filter((d) => d.item.type === 'game' || d.item.type === 'walk');
    const extras = decorated.filter((d) => d.item.type === 'treat' || d.item.type === 'care');
    const firstPending = main.find((d) => !d.done) ?? null;
    return {
      configured,
      isDayCare,
      reminders,
      displayName,
      dailyNote,
      count: items.length,
      nGames: items.filter((i) => i.type === 'game').length,
      nWalks: items.filter((i) => i.type === 'walk').length,
      firstPending,
      later: main.filter((d) => d !== firstPending),
      extras
    };
  }
}
