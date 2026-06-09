import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { DogProfile } from '../models/app.models';
import { displayName } from '../util/dog-name.util';
import { loadJson, saveJson } from '../util/storage.util';

function defaultProfile(): DogProfile {
  return { name: '', avatar: null };
}

/** Holds the (single, for now) dog's identity — name + optional avatar. */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly destroyRef = inject(DestroyRef);

  private readonly profileSubject = new BehaviorSubject<DogProfile>(
    loadJson('profile', defaultProfile())
  );

  readonly profile$: Observable<DogProfile> = this.profileSubject.asObservable();

  readonly name$: Observable<string> = this.profile$
    .pipe(
      map((p) => p.name),
      distinctUntilChanged()
    );

  /** Name for display — falls back to a neutral label when unset. */
  readonly displayName$: Observable<string> = this.name$
    .pipe(map((name) => displayName(name)));

  readonly avatar$: Observable<string | null> = this.profile$
    .pipe(
      map((p) => p.avatar),
      distinctUntilChanged()
    );

  /** Synchronous snapshot of the current profile — for one-time control init. */
  get snapshot(): DogProfile {
    return this.profileSubject.value;
  }

  constructor() {
    this.profileSubject
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (p) => saveJson('profile', p) });
  }

  setName(name: string): void {
    this.profileSubject.next({ ...this.profileSubject.value, name });
  }

  setAvatar(avatar: string | null): void {
    this.profileSubject.next({ ...this.profileSubject.value, avatar });
  }
}
