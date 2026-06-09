import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { PlannerService } from './planner.service';
import { ProfileService } from './profile.service';
import { todayISO } from '../util/date.util';

describe('PlannerService', () => {
  let service: PlannerService;
  let profile: ProfileService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlannerService);
    profile = TestBed.inject(ProfileService);
  });

  it('starts with an empty plan until the day is set up', async () => {
    const plan = await firstValueFrom(service.plan$);

    expect(plan.length).toBe(0);
  });

  it('derives a plan once a walk is added', async () => {
    service.addWalk('09:00');
    const plan = await firstValueFrom(service.plan$);

    expect(plan.length).toBeGreaterThan(0);
  });

  it('substitutes the dog name into generated content', async () => {
    profile.setName('Rex');
    service.patchForm({ walks: [{ id: 'w', time: '08:00' }] });

    const plan = await firstValueFrom(service.plan$);
    const walk = plan.find((i) => i.type === 'walk');

    expect(walk).toBeDefined();
    expect(JSON.stringify(plan)).not.toContain('{dog}');
  });

  it('leaves no {dog} token in the shopping list', async () => {
    profile.setName('Rex');
    const shopping = await firstValueFrom(service.shopping$);

    expect(JSON.stringify(shopping)).not.toContain('{dog}');
  });

  it('toggles kit ownership on and off', async () => {
    service.toggleKit('Snuffle mat');
    let owned = await firstValueFrom(service.ownedKit$);
    expect(owned.has('Snuffle mat')).toBe(true);

    service.toggleKit('Snuffle mat');
    owned = await firstValueFrom(service.ownedKit$);
    expect(owned.has('Snuffle mat')).toBe(false);
  });

  it('dedupes walk times and keeps them sorted', async () => {
    service.patchForm({ walks: [] });
    service.addWalk('17:00');
    service.addWalk('08:30');
    service.addWalk('17:00'); // duplicate ignored

    const form = await firstValueFrom(service.form$);
    expect(form.walks.map((w) => w.time)).toEqual(['08:30', '17:00']);
  });

  it('openDay sets the date, clears done, and switches to today', async () => {
    service.setActiveTab('week');
    service.openDay('2026-06-20');

    const form = await firstValueFrom(service.form$);
    const tab = await firstValueFrom(service.activeTab$);
    const done = await firstValueFrom(service.doneSet$);

    expect(form.date).toBe('2026-06-20');
    expect(tab).toBe('today');
    expect(done.size).toBe(0);
  });

  it('flags day care for the active date', async () => {
    service.patchForm({ date: todayISO(), dayCareDates: [] });
    service.toggleDayCare();

    const isDayCare = await firstValueFrom(service.isDayCare$);
    expect(isDayCare).toBe(true);
  });
});
