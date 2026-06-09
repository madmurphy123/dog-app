import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabId } from '../../models/app.models';
import { BottomNavComponent } from './bottom-nav.component';

describe('BottomNavComponent', () => {
  let fixture: ComponentFixture<BottomNavComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BottomNavComponent] });
    fixture = TestBed.createComponent(BottomNavComponent);
  });

  it('renders four tab buttons', () => {
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.nav-item').length).toBe(4);
  });

  it('shows the label only on the active tab', () => {
    fixture.componentInstance.value = 'week';
    fixture.detectChanges();

    const labels = (fixture.nativeElement as HTMLElement).querySelectorAll('.label');
    expect(labels.length).toBe(1);
    expect(labels[0].textContent?.trim()).toBe('Week');
  });

  it('emits valueChange when a tab is clicked', () => {
    const emitted: TabId[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.detectChanges();

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.nav-item');
    buttons[2].click(); // Kit

    expect(emitted).toEqual(['kit']);
  });
});
