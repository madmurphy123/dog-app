import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  let fixture: ComponentFixture<IconComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [IconComponent] });
    fixture = TestBed.createComponent(IconComponent);
  });

  it('renders an svg with the icon geometry', () => {
    fixture.componentInstance.name = 'paw';
    fixture.detectChanges();

    const svg: SVGElement | null = fixture.nativeElement.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.querySelectorAll('circle').length).toBeGreaterThan(0);
  });

  it('applies the size to width and height', () => {
    fixture.componentInstance.name = 'bell';
    fixture.componentInstance.size = 30;
    fixture.detectChanges();

    const svg: SVGElement | null = fixture.nativeElement.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('30');
    expect(svg?.getAttribute('height')).toBe('30');
  });
});
