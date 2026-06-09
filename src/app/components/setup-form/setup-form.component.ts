import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';

import { ALL_DAYS, DAY_LABELS, EventRow, WalkRow } from '../../models/app.models';
import { PlannerService } from '../../services/planner.service';
import { IconComponent } from '../icon/icon.component';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { PushSetupComponent } from '../push-setup/push-setup.component';

type EventGroup = FormGroup<{
  id: FormControl<string>;
  start: FormControl<string>;
  end: FormControl<string>;
  label: FormControl<string>;
  days: FormControl<number[]>;
}>;

type WalkGroup = FormGroup<{
  id: FormControl<string>;
  time: FormControl<string>;
  duration: FormControl<number>;
  days: FormControl<number[]>;
}>;

interface SetupControls {
  dayStart: FormControl<string>;
  dayEnd: FormControl<string>;
  events: FormArray<EventGroup>;
  walks: FormArray<WalkGroup>;
}

const DURATIONS: readonly number[] = [15, 30, 45, 60];

function uid(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** Data-entry view. Commitments and walks are recurring (which weekdays they
    happen); the reactive form is the editing surface and edits flow to the
    planner store, which re-derives every day from the routine. */
@Component({
  selector: 'app-setup-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent, ProfileCardComponent, PushSetupComponent],
  templateUrl: './setup-form.component.html',
  styleUrls: ['./setup-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SetupFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly planner = inject(PlannerService);

  protected readonly dayLabels = DAY_LABELS;
  protected readonly durations = DURATIONS;

  protected readonly form: FormGroup<SetupControls> = this.buildForm();

  ngOnInit(): void {
    this.form.valueChanges
      .pipe(debounceTime(150), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.sync() });
  }

  get events(): FormArray<EventGroup> {
    return this.form.controls.events;
  }

  get walks(): FormArray<WalkGroup> {
    return this.form.controls.walks;
  }

  addEvent(): void {
    this.events.push(
      this.eventGroup({ id: uid(), start: '11:00', end: '12:00', label: '', days: [...ALL_DAYS] })
    );
  }

  removeEvent(index: number): void {
    this.events.removeAt(index);
  }

  addWalk(): void {
    this.walks.push(this.walkGroup({ id: uid(), time: '08:00', duration: 30, days: [...ALL_DAYS] }));
  }

  removeWalk(index: number): void {
    this.walks.removeAt(index);
  }

  build(): void {
    this.planner.build();
  }

  isDayOn(control: FormControl<number[]>, day: number): boolean {
    return control.value.includes(day);
  }

  toggleDay(control: FormControl<number[]>, day: number): void {
    const set = new Set(control.value);
    if (set.has(day)) {
      set.delete(day);
    } else {
      set.add(day);
    }
    control.setValue([...set].sort((a, b) => a - b));
    control.markAsDirty();
  }

  setDuration(control: FormControl<number>, minutes: number): void {
    control.setValue(minutes);
    control.markAsDirty();
  }

  trackByControl(index: number, group: { controls: { id: FormControl<string> } }): string {
    return group.controls.id.value;
  }

  trackByDay(index: number): number {
    return index;
  }

  private sync(): void {
    const value = this.form.getRawValue();
    this.planner.patchForm({
      dayStart: value.dayStart,
      dayEnd: value.dayEnd,
      events: value.events,
      walks: value.walks
    });
  }

  private buildForm(): FormGroup<SetupControls> {
    const snapshot = this.planner.formSnapshot;
    return this.fb.group<SetupControls>({
      dayStart: this.fb.control(snapshot.dayStart),
      dayEnd: this.fb.control(snapshot.dayEnd),
      events: this.fb.array(snapshot.events.map((e) => this.eventGroup(e))),
      walks: this.fb.array(snapshot.walks.map((w) => this.walkGroup(w)))
    });
  }

  private eventGroup(e: EventRow): EventGroup {
    return this.fb.group({
      id: this.fb.control(e.id),
      start: this.fb.control(e.start),
      end: this.fb.control(e.end),
      label: this.fb.control(e.label),
      days: this.fb.control(e.days ?? [...ALL_DAYS])
    });
  }

  private walkGroup(w: WalkRow): WalkGroup {
    return this.fb.group({
      id: this.fb.control(w.id),
      time: this.fb.control(w.time),
      duration: this.fb.control(w.duration ?? 30),
      days: this.fb.control(w.days ?? [...ALL_DAYS])
    });
  }
}
