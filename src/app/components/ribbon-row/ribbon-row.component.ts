import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TimelineItem, TreatKind } from '../../engine/engagement-engine';
import { AROUSAL, EntryMeta, entryMeta } from '../../util/entry-meta.util';
import { IconComponent } from '../icon/icon.component';

const TREAT_LABEL: Record<TreatKind, string> = {
  toy: 'Treat · a new toy',
  food: 'Treat · something tasty',
  chew: 'Treat · a chew',
  treat: 'Treat · new flavour'
};

interface RibbonVm {
  item: TimelineItem;
  meta: EntryMeta;
  sub: string;
}

/** Dense one-line row for the "Later today" list. Display-only. */
@Component({
  selector: 'app-ribbon-row',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './ribbon-row.component.html',
  styleUrls: ['./ribbon-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RibbonRowComponent {
  @Input() item: TimelineItem | null = null;
  @Input() done = false;

  get vm(): RibbonVm | null {
    const item = this.item;
    if (!item) return null;
    return { item, meta: entryMeta(item), sub: this.subFor(item) };
  }

  private subFor(item: TimelineItem): string {
    if (item.type === 'walk') return 'Walk · sniff & stroll';
    if (item.type === 'treat') return TREAT_LABEL[item.treatKind];
    if (item.type === 'care') return 'Care reminder';
    if (item.type === 'goal') return `Goal · ${item.goalTitle}`;
    return `${AROUSAL[item.arousal].label} · ~${item.minutes}m`;
  }
}
