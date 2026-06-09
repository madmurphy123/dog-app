import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconComponent } from '../icon/icon.component';
import { LogoComponent } from '../logo/logo.component';

/** Gradient header card: brand mark, eyebrow, date, title and dog avatar. */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, IconComponent, LogoComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() avatar: string | null = null;
}
