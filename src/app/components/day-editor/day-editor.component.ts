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
import { Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { ALL_DAYS, DaySchedule, EventRow, WalkRow } from '../../models/app.models';
import { PlannerService } from '../../services/planner.service';
import { IconComponent } from '../icon/icon.component';

type OneOffEvent = FormGroup<{
  id: FormControl<string>;
  start: FormControl<string>;
  end: FormControl<string>;
  label: FormControl<string>;
}>;

type OneOffWalk = FormGroup<{
  id: FormControl<string>;
  time: FormControl<string>;
  duration: FormControl<number>;
}>;

interface OneOffControls {
  events: FormArray<OneOffEvent>;
  walks: FormArray<OneOffWalk>;
}

const DURATIONS: readonly number[] = [15, 30, 45, 60];

function uid(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** Tweak a single day: skip routine items for today, and add one-offs (vet, etc.). */
@Component({
  selector: 'app-day-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './day-editor.component.html',
  styleUrls: ['./day-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DayEditorComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly planner = inject(PlannerService);

  protected readonly durations = DURATIONS;
  protected readonly schedule$: Observable<DaySchedule> = this.planner.daySchedule$;
  protected readonly form: FormGroup<OneOffControls> = this.buildForm();

  ngOnInit(): void {
    this.form.valueChanges
      .pipe(debounceTime(150), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.sync() });
  }

  get events(): FormArray<OneOffEvent> {
    return this.form.controls.events;
  }

  get walks(): FormArray<OneOffWalk> {
    return this.form.controls.walks;
  }

  toggleSkip(id: string): void {
    this.planner.toggleSkip(id);
  }

  addEvent(): void {
    this.events.push(this.eventGroup({ id: uid(), start: '14:00', end: '15:00', label: '', days: [...ALL_DAYS] }));
  }

  removeEvent(index: number): void {
    this.events.removeAt(index);
  }

  addWalk(): void {
    this.walks.push(this.walkGroup({ id: uid(), time: '12:00', duration: 30, days: [...ALL_DAYS] }));
  }

  removeWalk(index: number): void {
    this.walks.removeAt(index);
  }

  setDuration(control: FormControl<number>, minutes: number): void {
    control.setValue(minutes);
    control.markAsDirty();
  }

  trackById(index: number, group: { controls: { id: FormControl<string> } }): string {
    return group.controls.id.value;
  }

  trackByRowId(index: number, item: { row: { id: string } }): string {
    return item.row.id;
  }

  private sync(): void {
    const value = this.form.getRawValue();
    const events: EventRow[] = value.events.map((e) => ({ ...e, days: [...ALL_DAYS] }));
    const walks: WalkRow[] = value.walks.map((w) => ({ ...w, days: [...ALL_DAYS] }));
    this.planner.setDayOneOffs(events, walks);
  }

  private buildForm(): FormGroup<OneOffControls> {
    const snapshot = this.planner.formSnapshot;
    const ov = snapshot.overrides[snapshot.date] ?? {};
    return this.fb.group<OneOffControls>({
      events: this.fb.array((ov.events ?? []).map((e) => this.eventGroup(e))),
      walks: this.fb.array((ov.walks ?? []).map((w) => this.walkGroup(w)))
    });
  }

  private eventGroup(e: EventRow): OneOffEvent {
    return this.fb.group({
      id: this.fb.control(e.id),
      start: this.fb.control(e.start),
      end: this.fb.control(e.end),
      label: this.fb.control(e.label)
    });
  }

  private walkGroup(w: WalkRow): OneOffWalk {
    return this.fb.group({
      id: this.fb.control(w.id),
      time: this.fb.control(w.time),
      duration: this.fb.control(w.duration ?? 30)
    });
  }
}
