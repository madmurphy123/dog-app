import { DestroyRef, Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, combineLatest, firstValueFrom } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { PUSH_CONFIG } from '../config/push.config';
import { PlannerService } from './planner.service';
import { ProfileService } from './profile.service';
import { loadJson, saveJson } from '../util/storage.util';

/**
 * Web Push setup. The app computes the reminder list (absolute timestamps) and
 * uploads it with the push subscription to the Cloudflare Worker; the Worker
 * sends the actual notifications on schedule. Re-syncs whenever the plan inputs
 * change so the backend always has the current schedule.
 */
@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly swPush = inject(SwPush);
  private readonly planner = inject(PlannerService);
  private readonly profile = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly enabledSubject = new BehaviorSubject<boolean>(loadJson('pushEnabled', false));
  readonly enabled$: Observable<boolean> = this.enabledSubject.asObservable();

  /** True only when a service worker is active (production build / installed PWA). */
  get supported(): boolean {
    return this.swPush.isEnabled;
  }

  get configured(): boolean {
    return PUSH_CONFIG.workerUrl.length > 0;
  }

  constructor() {
    combineLatest([this.planner.form$, this.planner.ownedKit$, this.profile.profile$])
      .pipe(debounceTime(1500), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.resyncIfEnabled() });
  }

  async enable(): Promise<void> {
    if (!this.supported) {
      throw new Error('Open the installed app on your phone to switch this on.');
    }
    if (!this.configured) {
      throw new Error('Notification server not set up yet.');
    }
    const subscription = await this.swPush.requestSubscription({
      serverPublicKey: PUSH_CONFIG.vapidPublicKey
    });
    await this.post('/subscribe', {
      subscription,
      reminders: this.planner.upcomingReminders(PUSH_CONFIG.daysAhead)
    });
    this.enabledSubject.next(true);
    saveJson('pushEnabled', true);
  }

  async disable(): Promise<void> {
    const subscription = await firstValueFrom(this.swPush.subscription);
    if (subscription) {
      try {
        await this.post('/unsubscribe', { endpoint: subscription.endpoint });
      } catch {
        /* server may be unreachable — clearing locally is enough */
      }
      await this.swPush.unsubscribe().catch(() => undefined);
    }
    this.enabledSubject.next(false);
    saveJson('pushEnabled', false);
  }

  async sendTest(): Promise<void> {
    const subscription = await firstValueFrom(this.swPush.subscription);
    if (!subscription) {
      throw new Error('Turn on notifications first.');
    }
    await this.post('/test', { endpoint: subscription.endpoint });
  }

  private resyncIfEnabled(): void {
    if (this.enabledSubject.value) {
      void this.sync();
    }
  }

  private async sync(): Promise<void> {
    const subscription = await firstValueFrom(this.swPush.subscription);
    if (!subscription) return;
    await this.post('/subscribe', {
      subscription,
      reminders: this.planner.upcomingReminders(PUSH_CONFIG.daysAhead)
    }).catch(() => undefined);
  }

  private async post(path: string, body: unknown): Promise<void> {
    const res = await fetch(PUSH_CONFIG.workerUrl + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      throw new Error(`Server error ${res.status}`);
    }
  }
}
