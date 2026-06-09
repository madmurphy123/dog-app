import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { KitGroup, ShoppingItem } from '../../engine/engagement-engine';
import { PlannerService } from '../../services/planner.service';
import { IconName } from '../../util/icon.types';
import { IconComponent } from '../icon/icon.component';
import { KitItemComponent } from '../kit-item/kit-item.component';

interface OwnedItem {
  item: ShoppingItem;
  owned: boolean;
}

interface KitGroupVm {
  key: KitGroup;
  icon: IconName;
  hint: string;
  items: OwnedItem[];
}

interface KitVm {
  groups: KitGroupVm[];
  have: number;
  toGet: number;
}

const GROUP_DEFS: ReadonlyArray<{ key: KitGroup; icon: IconName; hint: string }> = [
  { key: 'Enrichment', icon: 'paw', hint: 'games & training' },
  { key: 'Treats & food', icon: 'gift', hint: 'little surprises' },
  { key: 'Hygiene', icon: 'droplet', hint: 'keep them healthy' }
];

/** The Kit tab: grouped weekly buy-list; ticking an item unlocks its content. */
@Component({
  selector: 'app-kit-list',
  standalone: true,
  imports: [CommonModule, IconComponent, KitItemComponent],
  templateUrl: './kit-list.component.html',
  styleUrls: ['./kit-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KitListComponent {
  private readonly planner = inject(PlannerService);

  readonly vm$: Observable<KitVm> = combineLatest([
    this.planner.shopping$,
    this.planner.ownedKit$
  ]).pipe(map(([items, owned]) => this.buildVm(items, owned)));

  toggle(name: string): void {
    this.planner.toggleKit(name);
  }

  trackByKey(index: number, group: KitGroupVm): string {
    return group.key;
  }

  trackByName(index: number, entry: OwnedItem): string {
    return entry.item.name;
  }

  private buildVm(items: ShoppingItem[], owned: Set<string>): KitVm {
    const groups = GROUP_DEFS.map((g) => ({
      ...g,
      items: items.filter((i) => i.group === g.key).map((item) => ({ item, owned: owned.has(item.name) }))
    }));
    const have = items.filter((i) => owned.has(i.name)).length;
    return { groups, have, toGet: items.length - have };
  }
}
