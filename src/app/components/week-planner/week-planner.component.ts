import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { toMin } from '../../engine/engagement-engine';
import { WeekDay } from '../../models/app.models';
import { PlannerService } from '../../services/planner.service';
import { IconComponent } from '../icon/icon.component';
import { MiniTimelineComponent } from '../mini-timeline/mini-timeline.component';

interface WeekVm {
  days: WeekDay[];
  startMin: number;
  endMin: number;
}

/** The Week tab: a 7-day strip + per-day mini timelines. Tap a day to open it. */
@Component({
  selector: 'app-week-planner',
  standalone: true,
  imports: [CommonModule, IconComponent, MiniTimelineComponent],
  templateUrl: './week-planner.component.html',
  styleUrls: ['./week-planner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeekPlannerComponent {
  private readonly planner = inject(PlannerService);

  readonly vm$: Observable<WeekVm> = combineLatest([this.planner.week$, this.planner.form$]).pipe(
    map(([days, form]) => ({
      days,
      startMin: toMin(form.dayStart),
      endMin: toMin(form.dayEnd)
    }))
  );

  openDay(iso: string): void {
    this.planner.openDay(iso);
  }

  trackByIso(index: number, day: WeekDay): string {
    return day.iso;
  }
}
