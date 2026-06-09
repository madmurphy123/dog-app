import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArousalIndicatorComponent } from './arousal-indicator.component';

describe('ArousalIndicatorComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ArousalIndicatorComponent] });
  });

  function render(arousal: 'high' | 'med' | 'low'): HTMLElement {
    const fixture: ComponentFixture<ArousalIndicatorComponent> = TestBed.createComponent(
      ArousalIndicatorComponent
    );
    fixture.componentInstance.arousal = arousal;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('always renders three bars', () => {
    const el = render('med');

    expect(el.querySelectorAll('.bar').length).toBe(3);
  });

  it('fills bars to match the level and shows the short label', () => {
    const high = render('high');
    expect(high.querySelectorAll('.bar.filled').length).toBe(3);
    expect(high.querySelector('.label')?.textContent?.trim()).toBe('High');

    const low = render('low');
    expect(low.querySelectorAll('.bar.filled').length).toBe(1);
    expect(low.querySelector('.label')?.textContent?.trim()).toBe('Calm');
  });
});
