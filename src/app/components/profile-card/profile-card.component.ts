import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { ProfileService } from '../../services/profile.service';
import { fileToAvatar } from '../../util/image.util';
import { IconComponent } from '../icon/icon.component';

/** Sets the dog's identity — name (reactive) and an optional cropped photo. */
@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './profile-card.component.html',
  styleUrls: ['./profile-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileCardComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly profile = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly avatar$: Observable<string | null> = this.profile.avatar$;
  protected readonly nameControl = this.fb.control(this.profile.snapshot.name);

  constructor() {
    this.nameControl.valueChanges
      .pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (name) => this.profile.setName(name) });
  }

  onFile(files: FileList | null): void {
    const file = files?.[0];
    if (!file) return;
    fileToAvatar(file)
      .then((url) => this.profile.setAvatar(url))
      .catch(() => undefined);
  }

  removePhoto(): void {
    this.profile.setAvatar(null);
  }
}
