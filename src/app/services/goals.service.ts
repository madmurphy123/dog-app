import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import { GOALS, GoalDef, GoalProgress, resolveGoals } from '../engine/goals';
import { loadJson, saveJson } from '../util/storage.util';

/**
 * Training goals state — which goals are active and how far through each one.
 * Stored as goalId → current step index. The planner weaves the current step
 * of active goals into the day; this service owns activation and progress.
 */
@Injectable({ providedIn: 'root' })
export class GoalsService {
  private readonly destroyRef = inject(DestroyRef);

  private readonly activeSubject = new BehaviorSubject<Record<string, number>>(
    loadJson('goals', {})
  );

  readonly active$: Observable<Record<string, number>> = this.activeSubject.asObservable();
  readonly catalog: readonly GoalDef[] = GOALS;

  readonly progress$: Observable<GoalProgress[]> = this.active$
    .pipe(
      map((active) => resolveGoals(active)),
      shareReplay({ bufferSize: 1, refCount: false })
    );

  constructor() {
    this.activeSubject
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (a) => saveJson('goals', a) });
  }

  toggle(goalId: string): void {
    const active = { ...this.activeSubject.value };
    if (goalId in active) {
      delete active[goalId];
    } else {
      active[goalId] = 0;
    }
    this.activeSubject.next(active);
  }

  advance(goalId: string): void {
    const active = { ...this.activeSubject.value };
    if (!(goalId in active)) return;
    active[goalId] = active[goalId] + 1;
    this.activeSubject.next(active);
  }

  reset(goalId: string): void {
    const active = { ...this.activeSubject.value };
    if (goalId in active) {
      active[goalId] = 0;
      this.activeSubject.next(active);
    }
  }
}
