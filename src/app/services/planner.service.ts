import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, map, shareReplay } from 'rxjs/operators';

import {
  GameItem,
  ShoppingItem,
  TimelineItem,
  buildDogDay,
  buildShoppingList,
  pickDailyNote,
  swapGame
} from '../engine/engagement-engine';
import { ALL_DAYS, EventRow, FormState, PushReminder, TabId, WalkRow, WeekDay } from '../models/app.models';
import { isoOf, mondayOf, todayISO, weekdayIndex } from '../util/date.util';
import { withDogName } from '../util/dog-name.util';
import { itemKey } from '../util/item-key.util';
import { loadJson, saveJson } from '../util/storage.util';
import { ProfileService } from './profile.service';

const DEFAULT_KIT: string[] = [];

function defaultForm(): FormState {
  return {
    date: todayISO(),
    dayStart: '08:00',
    dayEnd: '21:00',
    reminders: true,
    treats: true,
    dayCareDates: [],
    events: [],
    walks: []
  };
}

/** A day is "set up" once it has at least one walk or commitment to plan around. */
function isConfigured(form: FormState): boolean {
  return form.events.length > 0 || form.walks.length > 0;
}

/** Backfill recurrence/duration on data saved before the recurring-routine model. */
function normalizeForm(form: FormState): FormState {
  return {
    ...form,
    events: (form.events ?? []).map((e) => ({ ...e, days: e.days ?? [...ALL_DAYS] })),
    walks: (form.walks ?? []).map((w) => ({
      ...w,
      days: w.days ?? [...ALL_DAYS],
      duration: w.duration && w.duration > 0 ? w.duration : 30
    }))
  };
}

function uid(): string {
  return Math.random().toString(36).slice(2, 8);
}

const TABS: readonly TabId[] = ['today', 'week', 'kit', 'setup'];

/**
 * Single source of app state. Inputs (form / owned kit / nonce) live in
 * BehaviorSubjects; the day's plan and shopping list are derived from them — and
 * from the active dog's name — so everything reacts live to edits, kit ownership
 * and reshuffles. No scheduling logic lives here; it only calls the pure engine
 * and substitutes the dog name into the generic content.
 */
@Injectable({ providedIn: 'root' })
export class PlannerService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly profile = inject(ProfileService);

  private readonly formSubject = new BehaviorSubject<FormState>(
    normalizeForm(loadJson('form', defaultForm()))
  );
  private readonly tabSubject = new BehaviorSubject<TabId>(this.loadTab());
  private readonly ownedKitSubject = new BehaviorSubject<Set<string>>(
    new Set(loadJson('kit', DEFAULT_KIT))
  );
  private readonly doneSetSubject = new BehaviorSubject<Set<string>>(
    new Set(loadJson<string[]>('done', []))
  );
  private readonly nonceSubject = new BehaviorSubject<number>(0);
  // Per-slot reshuffle counts, keyed by the slot's time. Reset each new day.
  private readonly swapsSubject = new BehaviorSubject<Record<string, number>>({});

  readonly form$: Observable<FormState> = this.formSubject.asObservable();
  readonly activeTab$: Observable<TabId> = this.tabSubject.asObservable();
  readonly ownedKit$: Observable<Set<string>> = this.ownedKitSubject.asObservable();
  readonly doneSet$: Observable<Set<string>> = this.doneSetSubject.asObservable();

  readonly reminders$: Observable<boolean> = this.form$
    .pipe(
      map((f) => f.reminders),
      distinctUntilChanged()
    );

  readonly treats$: Observable<boolean> = this.form$
    .pipe(
      map((f) => f.treats),
      distinctUntilChanged()
    );

  /** Whether the day has been set up enough to generate a plan. */
  readonly configured$: Observable<boolean> = this.form$
    .pipe(
      map((f) => isConfigured(f)),
      distinctUntilChanged()
    );

  readonly isDayCare$: Observable<boolean> = this.form$
    .pipe(
      map((f) => f.dayCareDates.includes(f.date)),
      distinctUntilChanged()
    );

  readonly plan$: Observable<TimelineItem[]> = combineLatest([
    this.formSubject,
    this.nonceSubject,
    this.ownedKitSubject,
    this.swapsSubject,
    this.profile.name$
  ])
    .pipe(
      map(([form, nonce, owned, swaps, name]) =>
        this.nameItems(this.applySwaps(this.rawPlan(form, nonce, owned), form, owned, swaps), name)
      ),
      shareReplay({ bufferSize: 1, refCount: false })
    );

  readonly shopping$: Observable<ShoppingItem[]> = this.profile.name$
    .pipe(
      map((name) => this.nameShopping(buildShoppingList(), name)),
      shareReplay({ bufferSize: 1, refCount: false })
    );

  readonly hasTreat$: Observable<boolean> = this.plan$
    .pipe(
      map((plan) => plan.some((i) => i.type === 'treat')),
      distinctUntilChanged()
    );

  /** A nice non-task thing to do for the dog today (name-substituted). */
  readonly dailyNote$: Observable<string> = combineLatest([this.formSubject, this.profile.name$])
    .pipe(
      map(([form, name]) => withDogName(pickDailyNote(form.date), name)),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: false })
    );

  /** The 7 days of the week containing the active date, each with a mini plan. */
  readonly week$: Observable<WeekDay[]> = combineLatest([
    this.formSubject,
    this.ownedKitSubject,
    this.profile.name$
  ])
    .pipe(
      map(([form, owned, name]) => this.buildWeek(form, owned, name)),
      shareReplay({ bufferSize: 1, refCount: false })
    );

  constructor() {
    this.formSubject
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (f) => saveJson('form', f) });

    this.tabSubject
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (t) => saveJson('tab', t) });

    this.ownedKitSubject
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (s) => saveJson('kit', [...s]) });

    this.doneSetSubject
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (s) => saveJson('done', [...s]) });
  }

  /** Synchronous snapshot of the current form — for one-time form init. */
  get formSnapshot(): FormState {
    return this.formSubject.value;
  }

  setActiveTab(tab: TabId): void {
    this.tabSubject.next(tab);
  }

  build(): void {
    this.tabSubject.next('today');
  }

  reshuffle(): void {
    this.nonceSubject.next(this.nonceSubject.value + 1);
    this.doneSetSubject.next(new Set());
    this.swapsSubject.next({});
  }

  openDay(iso: string): void {
    this.patchForm({ date: iso });
    this.nonceSubject.next(0);
    this.doneSetSubject.next(new Set());
    this.swapsSubject.next({});
    this.tabSubject.next('today');
  }

  /** Reshuffle a single game slot to a fresh, unused activity. */
  swapItem(item: TimelineItem): void {
    if (item.type !== 'game') return;
    const swaps = { ...this.swapsSubject.value };
    swaps[item.time] = (swaps[item.time] ?? 0) + 1;
    this.swapsSubject.next(swaps);
  }

  patchForm(patch: Partial<FormState>): void {
    this.formSubject.next({ ...this.formSubject.value, ...patch });
  }

  addEvent(): void {
    const events = [
      ...this.formSubject.value.events,
      { id: uid(), start: '11:00', end: '12:00', label: '', days: [...ALL_DAYS] }
    ];
    this.patchForm({ events });
  }

  updateEvent(id: string, patch: Partial<EventRow>): void {
    const events = this.formSubject.value.events.map((e) => (e.id === id ? { ...e, ...patch } : e));
    this.patchForm({ events });
  }

  removeEvent(id: string): void {
    this.patchForm({ events: this.formSubject.value.events.filter((e) => e.id !== id) });
  }

  addWalk(time: string): void {
    const walks = this.formSubject.value.walks;
    if (walks.some((w) => w.time === time)) return;
    const next: WalkRow[] = [...walks, { id: uid(), time, duration: 30, days: [...ALL_DAYS] }].sort(
      (a, b) => a.time.localeCompare(b.time)
    );
    this.patchForm({ walks: next });
  }

  removeWalk(id: string): void {
    this.patchForm({ walks: this.formSubject.value.walks.filter((w) => w.id !== id) });
  }

  toggleDayCare(): void {
    const form = this.formSubject.value;
    const set = new Set(form.dayCareDates);
    if (set.has(form.date)) {
      set.delete(form.date);
    } else {
      set.add(form.date);
    }
    this.patchForm({ dayCareDates: [...set] });
  }

  toggleReminders(): void {
    this.patchForm({ reminders: !this.formSubject.value.reminders });
  }

  toggleTreats(): void {
    this.patchForm({ treats: !this.formSubject.value.treats });
  }

  toggleDone(item: TimelineItem): void {
    const key = itemKey(item);
    const set = new Set(this.doneSetSubject.value);
    if (set.has(key)) {
      set.delete(key);
    } else {
      set.add(key);
    }
    this.doneSetSubject.next(set);
  }

  toggleKit(name: string): void {
    const set = new Set(this.ownedKitSubject.value);
    if (set.has(name)) {
      set.delete(name);
    } else {
      set.add(name);
    }
    this.ownedKitSubject.next(set);
  }

  /** Commitments active on a given date (by weekday recurrence). */
  private eventsForDate(form: FormState, iso: string): EventRow[] {
    const wd = weekdayIndex(iso);
    return form.events.filter((e) => e.start && e.end && (e.days ?? ALL_DAYS).includes(wd));
  }

  /** Walks active on a given date (by weekday recurrence). */
  private walksForDate(form: FormState, iso: string): WalkRow[] {
    const wd = weekdayIndex(iso);
    return form.walks.filter((w) => (w.days ?? ALL_DAYS).includes(wd));
  }

  private rawPlan(form: FormState, nonce: number, owned: Set<string>): TimelineItem[] {
    if (!isConfigured(form)) return [];
    const iso = form.date;
    return buildDogDay({
      date: iso + (nonce ? '~' + nonce : ''),
      events: this.eventsForDate(form, iso).map((e) => ({ start: e.start, end: e.end, label: e.label })),
      walks: this.walksForDate(form, iso).map((w) => ({ time: w.time, minutes: w.duration })),
      dayStart: form.dayStart,
      dayEnd: form.dayEnd,
      owned: [...owned],
      treats: form.treats
    });
  }

  private nameItems(plan: TimelineItem[], name: string): TimelineItem[] {
    return plan.map((item): TimelineItem => {
      if (item.type === 'walk') {
        return {
          ...item,
          title: withDogName(item.title, name),
          detail: withDogName(item.detail, name),
          tasks: item.tasks.map((t) => withDogName(t, name))
        };
      }
      if (item.type === 'game') {
        return {
          ...item,
          title: withDogName(item.title, name),
          detail: withDogName(item.detail, name),
          variation: item.variation ? withDogName(item.variation, name) : undefined
        };
      }
      return {
        ...item,
        title: withDogName(item.title, name),
        detail: withDogName(item.detail, name)
      };
    });
  }

  /** Apply per-slot reshuffles, keeping every activity in the day distinct. */
  private applySwaps(
    plan: TimelineItem[],
    form: FormState,
    owned: Set<string>,
    swaps: Record<string, number>
  ): TimelineItem[] {
    if (!Object.keys(swaps).length) return plan;
    const result: TimelineItem[] = [...plan];
    const used = new Set(
      result.filter((i): i is GameItem => i.type === 'game').map((i) => i.gameId)
    );
    for (let idx = 0; idx < result.length; idx++) {
      const item = result[idx];
      if (item.type !== 'game') continue;
      const count = swaps[item.time];
      if (!count) continue;
      used.delete(item.gameId);
      const fields = swapGame({
        seed: `${form.date}|swap|${item.time}|${count}`,
        owned: [...owned],
        excludeIds: [...used, item.gameId]
      });
      used.add(fields.gameId);
      result[idx] = { ...item, ...fields };
    }
    return result;
  }

  /**
   * Flatten the next `days` days of reminders to absolute timestamps for the push
   * backend. Computing the epoch on the client means the server needs no timezone
   * logic. Honours the reminders toggle, day-care days, treats, kit and dog name.
   */
  upcomingReminders(days: number): PushReminder[] {
    const form = this.formSubject.value;
    if (!form.reminders || !isConfigured(form)) return [];

    const owned = [...this.ownedKitSubject.value];
    const name = this.profile.snapshot.name;
    const now = Date.now();
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);

    const out: PushReminder[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(midnight);
      date.setDate(midnight.getDate() + i);
      const iso = isoOf(date);
      if (form.dayCareDates.includes(iso)) continue;

      const items = this.nameItems(
        buildDogDay({
          date: iso,
          events: this.eventsForDate(form, iso).map((e) => ({ start: e.start, end: e.end, label: e.label })),
          walks: this.walksForDate(form, iso).map((w) => ({ time: w.time, minutes: w.duration })),
          dayStart: form.dayStart,
          dayEnd: form.dayEnd,
          owned,
          treats: form.treats
        }),
        name
      );
      for (const item of items) {
        const at = new Date(`${iso}T${item.time}:00`).getTime();
        if (at <= now) continue;
        out.push({ id: `${at}-${item.title}`, at, title: item.title, body: item.detail });
      }
    }
    return out;
  }

  private buildWeek(form: FormState, owned: Set<string>, name: string): WeekDay[] {
    const mon = mondayOf(form.date);
    const today = todayISO();
    const configured = isConfigured(form);
    const ownedList = [...owned];

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(mon);
      date.setDate(mon.getDate() + i);
      const iso = isoOf(date);
      const isCare = form.dayCareDates.includes(iso);
      const items =
        isCare || !configured
          ? []
          : this.nameItems(
              buildDogDay({
                date: iso,
                events: this.eventsForDate(form, iso).map((e) => ({ start: e.start, end: e.end, label: e.label })),
                walks: this.walksForDate(form, iso).map((w) => ({ time: w.time, minutes: w.duration })),
                dayStart: form.dayStart,
                dayEnd: form.dayEnd,
                owned: ownedList,
                treats: form.treats
              }),
              name
            );
      return {
        iso,
        date,
        isCare,
        isToday: iso === today,
        isActive: iso === form.date,
        games: items.filter((it) => it.type === 'game').length,
        walks: items.filter((it) => it.type === 'walk').length,
        items
      };
    });
  }

  private nameShopping(list: ShoppingItem[], name: string): ShoppingItem[] {
    return list.map((s) => ({
      ...s,
      why: withDogName(s.why, name),
      unlocks: s.unlocks.map((u) => withDogName(u, name))
    }));
  }

  private loadTab(): TabId {
    const saved = loadJson<TabId>('tab', 'setup');
    return TABS.includes(saved) ? saved : 'setup';
  }
}
