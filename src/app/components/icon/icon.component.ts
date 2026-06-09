import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconName } from '../../util/icon.types';

/**
 * Minimal line-icon set. Stateless and presentational: pass a name plus optional
 * size/colour/stroke. Filled shapes use currentColor so a single colour drives
 * both stroke and fill.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent {
  @Input({ required: true }) name: IconName = 'paw';
  @Input() size = 20;
  @Input() color = 'currentColor';
  @Input() stroke = 2;
}
