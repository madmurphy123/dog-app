import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';

import { TimelineItem, toMin } from '../engine/engagement-engine';
import { FormState } from '../models/app.models';
import { todayISO } from '../util/date.util';
import { itemKey } from '../util/item-key.util';
import { PlannerService } from './planner.service';

const TOAST_MS = 6000;

/**
 * v1 reminders: while the tab is open, queue a timer per timeline entry for the
 * real today. On fire (or on a manual preview) it surfaces an in-app toast, a
 * two-note chime, and a system Notification if permission was granted.
 */
@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly planner = inject(PlannerService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly toastSubject = new BehaviorSubject<TimelineItem | null>(null);
  readonly toast$: Observable<TimelineItem | null> = this.toastSubject.asObservable();

  private timers: ReturnType<typeof setTimeout>[] = [];
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private lastPlan: TimelineItem[] = [];
  private lastDone: Set<string> = new Set();

  constructor() {
    combineLatest([this.planner.plan$, this.planner.form$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: ([plan, form]) => this.reschedule(plan, form) });

    this.planner.doneSet$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (done) => (this.lastDone = done) });

    this.planner.reminders$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (on) => this.requestPermissionIfEnabling(on) });
  }

  /** Fire the next not-yet-done entry (the "Preview a nudge" action). */
  previewNext(): void {
    const next = this.lastPlan.find((it) => !this.lastDone.has(itemKey(it))) ?? this.lastPlan[0];
    if (next) this.showToast(next);
  }

  closeToast(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastSubject.next(null);
  }

  private reschedule(plan: TimelineItem[], form: FormState): void {
    this.clearTimers();
    this.lastPlan = plan;

    if (!form.reminders) return;
    if (form.overrides[form.date]?.dayCare) return;
    if (form.date !== todayISO()) return; // only nudge for the live day

    const now = new Date();
    const nowMs = now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000;
    for (const item of plan) {
      const dueMs = toMin(item.time) * 60000;
      const delay = dueMs - nowMs;
      if (delay <= 0) continue;
      this.timers.push(setTimeout(() => this.showToast(item), delay));
    }
  }

  private clearTimers(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
  }

  private showToast(item: TimelineItem): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastSubject.next(item);
    this.playChime();
    this.notify(item);
    this.toastTimer = setTimeout(() => this.toastSubject.next(null), TOAST_MS);
  }

  private requestPermissionIfEnabling(on: boolean): void {
    if (!on) return;
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => undefined);
      }
    } catch {
      /* Notifications unsupported — non-fatal */
    }
  }

  private notify(item: TimelineItem): void {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(item.title, { body: item.detail });
      }
    } catch {
      /* Notifications unsupported — non-fatal */
    }
  }

  private playChime(): void {
    try {
      const ac = new AudioContext();
      const now = ac.currentTime;
      [880, 1318.5].forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ac.destination);
        const ts = now + i * 0.13;
        gain.gain.setValueAtTime(0, ts);
        gain.gain.linearRampToValueAtTime(0.16, ts + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ts + 0.5);
        osc.start(ts);
        osc.stop(ts + 0.55);
      });
    } catch {
      /* WebAudio unavailable — non-fatal */
    }
  }
}
