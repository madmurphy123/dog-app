import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShoppingItem } from '../../engine/engagement-engine';
import { IconComponent } from '../icon/icon.component';

/** A single tappable kit row. Tapping toggles ownership (unlocks its content). */
@Component({
  selector: 'app-kit-item',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './kit-item.component.html',
  styleUrls: ['./kit-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KitItemComponent {
  @Input() item: ShoppingItem | null = null;
  @Input() owned = false;
  @Output() toggle = new EventEmitter<void>();

  get hasUnlocks(): boolean {
    return (this.item?.unlocks.length ?? 0) > 0;
  }

  get unlocksText(): string {
    const unlocks = this.item?.unlocks ?? [];
    const shown = unlocks.slice(0, 2).join(', ');
    return unlocks.length > 2 ? `${shown} +${unlocks.length - 2}` : shown;
  }
}
