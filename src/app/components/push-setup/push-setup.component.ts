import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { PushService } from '../../services/push.service';
import { IconComponent } from '../icon/icon.component';

interface PushStatus {
  busy: boolean;
  error: string | null;
  tested: boolean;
}

interface PushVm extends PushStatus {
  enabled: boolean;
  supported: boolean;
  configured: boolean;
}

/** Setup card to turn on background (lock-screen) notifications for this device. */
@Component({
  selector: 'app-push-setup',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './push-setup.component.html',
  styleUrls: ['./push-setup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PushSetupComponent {
  private readonly push = inject(PushService);

  private readonly statusSubject = new BehaviorSubject<PushStatus>({
    busy: false,
    error: null,
    tested: false
  });

  readonly vm$: Observable<PushVm> = combineLatest([this.push.enabled$, this.statusSubject]).pipe(
    map(([enabled, status]) => ({
      enabled,
      supported: this.push.supported,
      configured: this.push.configured,
      ...status
    }))
  );

  turnOn(): void {
    this.run(this.push.enable());
  }

  turnOff(): void {
    this.run(this.push.disable());
  }

  test(): void {
    this.run(this.push.sendTest(), true);
  }

  private run(action: Promise<void>, tested = false): void {
    this.statusSubject.next({ busy: true, error: null, tested: false });
    action
      .then(() => this.statusSubject.next({ busy: false, error: null, tested }))
      .catch((err) =>
        this.statusSubject.next({
          busy: false,
          error: err instanceof Error ? err.message : 'Something went wrong',
          tested: false
        })
      );
  }
}
