import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TimelineItem } from '../../engine/engagement-engine';
import { EntryMeta, entryMeta } from '../../util/entry-meta.util';
import { IconComponent } from '../icon/icon.component';

/** Drop-down nudge: accent bar, tinted icon tile, time eyebrow, title + detail. */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent {
  @Input() item: TimelineItem | null = null;
  @Output() closed = new EventEmitter<void>();

  get vm(): { item: TimelineItem; meta: EntryMeta } | null {
    return this.item ? { item: this.item, meta: entryMeta(this.item) } : null;
  }
}
