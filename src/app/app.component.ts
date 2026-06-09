import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { TabId } from './models/app.models';
import { PlannerService } from './services/planner.service';
import { ProfileService } from './services/profile.service';
import { ReminderService } from './services/reminder.service';
import { fmtDate } from './util/date.util';
import { BottomNavComponent } from './components/bottom-nav/bottom-nav.component';
import { DayTimelineComponent } from './components/day-timeline/day-timeline.component';
import { GoalsViewComponent } from './components/goals-view/goals-view.component';
import { HeaderComponent } from './components/header/header.component';
import { IconComponent } from './components/icon/icon.component';
import { KitListComponent } from './components/kit-list/kit-list.component';
import { SetupFormComponent } from './components/setup-form/setup-form.component';
import { ToastComponent } from './components/toast/toast.component';
import { WeekPlannerComponent } from './components/week-planner/week-planner.component';

interface ShellVm {
  tab: TabId;
  eyebrow: string;
  headerTitle: string;
  subtitle: string;
  avatar: string | null;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    BottomNavComponent,
    ToastComponent,
    IconComponent,
    SetupFormComponent,
    DayTimelineComponent,
    WeekPlannerComponent,
    GoalsViewComponent,
    KitListComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  protected readonly planner = inject(PlannerService);
  protected readonly reminder = inject(ReminderService);
  private readonly profile = inject(ProfileService);

  readonly vm$: Observable<ShellVm> = combineLatest([
    this.planner.activeTab$,
    this.profile.displayName$,
    this.planner.form$,
    this.profile.avatar$
  ]).pipe(
    map(([tab, name, form, avatar]) => ({
      tab,
      avatar,
      eyebrow: `${name}’s day`,
      subtitle: fmtDate(form.date),
      headerTitle: this.titleFor(tab, name)
    }))
  );

  setTab(tab: TabId): void {
    this.planner.setActiveTab(tab);
  }

  private titleFor(tab: TabId, name: string): string {
    const possessive = `${name}’s`;
    switch (tab) {
      case 'setup':
        return `Let’s plan ${possessive} day`;
      case 'week':
        return `${possessive} week`;
      case 'goals':
        return `${possessive} goals`;
      case 'kit':
        return `${possessive} kit`;
      default:
        return `${possessive} on the books`;
    }
  }
}
