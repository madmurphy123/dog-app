import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** The Dog Day mark (inline SVG, inherits `currentColor`). Decorative. */
@Component({
  selector: 'app-logo',
  standalone: true,
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoComponent {
  /** Rendered height in px; width follows the mark's aspect ratio. */
  @Input() size = 28;

  get width(): number {
    return Math.round((this.size * 56) / 70);
  }
}
