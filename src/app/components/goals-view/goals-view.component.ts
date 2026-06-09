import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { GoalsService } from '../../services/goals.service';
import { ProfileService } from '../../services/profile.service';
import { withDogName } from '../../util/dog-name.util';
import { IconComponent } from '../icon/icon.component';

interface GoalVm {
  id: string;
  title: string;
  why: string;
  active: boolean;
  complete: boolean;
  stepIndex: number;
  total: number;
  percent: number;
  stepTitle: string;
  stepDone: string;
}

/** The Goals tab: pick training goals and track progress through each one. */
@Component({
  selector: 'app-goals-view',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './goals-view.component.html',
  styleUrls: ['./goals-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoalsViewComponent {
  private readonly goals = inject(GoalsService);
  private readonly profile = inject(ProfileService);

  readonly vm$: Observable<GoalVm[]> = combineLatest([this.goals.active$, this.profile.name$]).pipe(
    map(([active, name]) =>
      this.goals.catalog.map((def) => {
        const isActive = def.id in active;
        const raw = isActive ? active[def.id] : 0;
        const complete = isActive && raw >= def.steps.length;
        const stepIndex = Math.max(0, Math.min(raw, def.steps.length - 1));
        const step = def.steps[stepIndex];
        return {
          id: def.id,
          title: def.title,
          why: withDogName(def.why, name),
          active: isActive,
          complete,
          stepIndex,
          total: def.steps.length,
          percent: isActive ? Math.round((Math.min(raw, def.steps.length) / def.steps.length) * 100) : 0,
          stepTitle: withDogName(step.title, name),
          stepDone: withDogName(step.done, name)
        };
      })
    )
  );

  toggle(id: string): void {
    this.goals.toggle(id);
  }

  advance(id: string): void {
    this.goals.advance(id);
  }

  reset(id: string): void {
    this.goals.reset(id);
  }

  trackById(index: number, goal: GoalVm): string {
    return goal.id;
  }
}
