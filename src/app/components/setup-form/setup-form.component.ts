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

import { EventRow, WalkRow } from '../../models/app.models';
import { PlannerService } from '../../services/planner.service';
import { IconComponent } from '../icon/icon.component';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { PushSetupComponent } from '../push-setup/push-setup.component';

type EventGroup = FormGroup<{
  id: FormControl<string>;
  start: FormControl<string>;
  end: FormControl<string>;
  label: FormControl<string>;
}>;

type WalkGroup = FormGroup<{
  id: FormControl<string>;
  time: FormControl<string>;
}>;

interface SetupControls {
  date: FormControl<string>;
  dayStart: FormControl<string>;
  dayEnd: FormControl<string>;
  events: FormArray<EventGroup>;
  walks: FormArray<WalkGroup>;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** Data-entry view. The reactive form is the editing surface; edits flow to the
    planner store (the single source of truth) which re-derives everything. */
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

  protected readonly newWalk = this.fb.control('08:00');

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
    this.events.push(this.eventGroup({ id: uid(), start: '11:00', end: '12:00', label: '' }));
  }

  removeEvent(index: number): void {
    this.events.removeAt(index);
  }

  addWalk(): void {
    const time = this.newWalk.value;
    if (!time) return;
    if (this.walks.controls.some((g) => g.controls.time.value === time)) return;
    this.walks.push(this.walkGroup({ id: uid(), time }));
    this.sortWalks();
  }

  removeWalk(index: number): void {
    this.walks.removeAt(index);
  }

  build(): void {
    this.planner.build();
  }

  trackByControl(index: number, group: { controls: { id: FormControl<string> } }): string {
    return group.controls.id.value;
  }

  private sync(): void {
    const value = this.form.getRawValue();
    this.planner.patchForm({
      date: value.date,
      dayStart: value.dayStart,
      dayEnd: value.dayEnd,
      events: value.events,
      walks: value.walks
    });
  }

  private sortWalks(): void {
    const sorted = [...this.walks.controls].sort((a, b) =>
      a.controls.time.value.localeCompare(b.controls.time.value)
    );
    this.walks.clear();
    sorted.forEach((g) => this.walks.push(g));
  }

  private buildForm(): FormGroup<SetupControls> {
    const snapshot = this.planner.formSnapshot;
    return this.fb.group<SetupControls>({
      date: this.fb.control(snapshot.date),
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
      label: this.fb.control(e.label)
    });
  }

  private walkGroup(w: WalkRow): WalkGroup {
    return this.fb.group({
      id: this.fb.control(w.id),
      time: this.fb.control(w.time)
    });
  }
}
