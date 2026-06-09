import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameItem } from '../../engine/engagement-engine';
import { ToastComponent } from './toast.component';

const GAME: GameItem = {
  time: '09:00',
  type: 'game',
  title: 'Tug with rules',
  detail: 'Two minutes of tug.',
  arousal: 'high',
  category: 'engagement',
  gameId: 'tug-rules',
  minutes: 5,
  equipment: ['Tug toy']
};

describe('ToastComponent', () => {
  let fixture: ComponentFixture<ToastComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ToastComponent] });
    fixture = TestBed.createComponent(ToastComponent);
  });

  it('renders nothing when there is no item', () => {
    fixture.componentInstance.item = null;
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.toast')).toBeNull();
  });

  it('renders the item title and detail', () => {
    fixture.componentInstance.item = GAME;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.title')?.textContent).toContain('Tug with rules');
    expect(el.querySelector('.detail')?.textContent).toContain('Two minutes of tug.');
  });

  it('emits closed when the dismiss button is clicked', () => {
    let closed = false;
    fixture.componentInstance.item = GAME;
    fixture.componentInstance.closed.subscribe(() => (closed = true));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.close').click();

    expect(closed).toBe(true);
  });
});
