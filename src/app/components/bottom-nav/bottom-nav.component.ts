import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TabId } from '../../models/app.models';
import { IconName } from '../../util/icon.types';
import { IconComponent } from '../icon/icon.component';

interface NavItem {
  id: TabId;
  label: string;
  icon: IconName;
}

/** Persistent bottom tab bar. The active item expands to show its label. */
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BottomNavComponent {
  @Input() value: TabId = 'today';
  @Output() valueChange = new EventEmitter<TabId>();

  protected readonly items: readonly NavItem[] = [
    { id: 'today', label: 'Today', icon: 'list' },
    { id: 'week', label: 'Week', icon: 'calendar' },
    { id: 'kit', label: 'Kit', icon: 'cart' },
    { id: 'setup', label: 'Setup', icon: 'edit' }
  ];

  trackById(index: number, item: NavItem): TabId {
    return item.id;
  }
}
