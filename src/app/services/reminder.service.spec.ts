import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { PlannerService } from './planner.service';
import { ReminderService } from './reminder.service';

describe('ReminderService', () => {
  let reminders: ReminderService;
  let planner: PlannerService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    planner = TestBed.inject(PlannerService);
    reminders = TestBed.inject(ReminderService);
    // Give the day something to plan around so there are entries to nudge.
    planner.addWalk('09:00');
  });

  it('starts with no toast showing', async () => {
    const toast = await firstValueFrom(reminders.toast$);

    expect(toast).toBeNull();
  });

  it('previewNext surfaces a pending entry as a toast', async () => {
    reminders.previewNext();
    const toast = await firstValueFrom(reminders.toast$);

    expect(toast).not.toBeNull();
  });

  it('closeToast clears the visible toast', async () => {
    reminders.previewNext();
    reminders.closeToast();
    const toast = await firstValueFrom(reminders.toast$);

    expect(toast).toBeNull();
  });
});
