import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Arousal } from '../../engine/engagement-engine';
import { AROUSAL, ArousalMeta } from '../../util/entry-meta.util';

/** Three ascending bars filled by energy level, plus a short mono label. */
@Component({
  selector: 'app-arousal-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './arousal-indicator.component.html',
  styleUrls: ['./arousal-indicator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArousalIndicatorComponent {
  @Input() arousal: Arousal = 'med';

  protected readonly levels = [1, 2, 3];

  get meta(): ArousalMeta {
    return AROUSAL[this.arousal];
  }

  get accent(): string {
    return `var(${this.meta.varc})`;
  }

  trackByLevel(index: number, level: number): number {
    return level;
  }
}
