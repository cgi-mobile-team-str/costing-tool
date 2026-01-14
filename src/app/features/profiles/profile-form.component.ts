import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Profile } from '../../core/models/domain.model';
import { IdService } from '../../core/services/id.service';
import { ProfilesRepository } from '../../data/profiles.repository';
import { ZardInputDirective } from '../../shared/components/input';
import { Z_SHEET_DATA } from '../../shared/components/sheet/sheet.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, ZardInputDirective],
  template: `
    <form [formGroup]="form" class="grid flex-1 auto-rows-min gap-4 px-6 pt-2 pb-6">
      <div class="flex flex-col gap-1.5">
        <label
          for="username"
          class="flex items-center gap-2 text-sm font-semibold peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {{ 'profiles.username' | translate }}
        </label>
        <input z-input id="username" type="text" formControlName="username" />
      </div>
      <div class="flex flex-col gap-1.5">
        <label
          for="name"
          class="flex items-center gap-2 text-sm font-semibold peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {{ 'profiles.name' | translate }}
        </label>
        <input z-input id="name" type="text" formControlName="name" />
        @if (form.get('name')?.invalid && form.get('name')?.touched) {
        <p class="text-sm text-destructive">{{ 'common.required' | translate }}</p>
        } @if (form.errors?.['nameExists']) {
        <p class="text-sm text-destructive">{{ 'profiles.name_exists' | translate }}</p>
        }
      </div>

      <div class="flex flex-col gap-1.5">
        <label
          for="dailyRate"
          class="flex items-center gap-2 text-sm font-semibold peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {{ 'profiles.rate' | translate }} (€)
        </label>
        <input z-input id="dailyRate" type="number" formControlName="dailyRate" />
        @if (form.get('dailyRate')?.invalid && form.get('dailyRate')?.touched) {
        <p class="text-sm text-destructive">{{ 'profiles.rate_positive' | translate }}</p>
        }
      </div>
    </form>
  `,
  styles: [],
})
export class ProfileFormComponent {
  private fb = inject(FormBuilder);
  private repo = inject(ProfilesRepository);
  private idService = inject(IdService);
  private zData = inject(Z_SHEET_DATA, { optional: true });

  form = this.fb.group({
    id: [''],
    name: ['', Validators.required],
    username: [''],
    dailyRate: [0, [Validators.required, Validators.min(1)]],
    active: [true],
  });

  isEditMode = signal(false);

  constructor() {
    if (this.zData) {
      this.isEditMode.set(true);
      this.form.patchValue(this.zData);
    }
  }

  save(): boolean {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return false;
    }

    const val = this.form.value as Profile;
    // Check name uniqueness (naive impl)
    const all = this.repo.getAll();
    const exists = all.find(
      (p) => p.name.toLowerCase() === val.name.toLowerCase() && p.id !== val.id
    );
    if (exists) {
      this.form.setErrors({ nameExists: true });
      return false;
    }

    if (!val.id) {
      val.id = this.idService.generate();
    }

    this.repo.save(val as Profile);
    return true;
  }

  toggleActive() {
    const current = this.form.get('active')?.value;
    this.form.get('active')?.setValue(!current);
    this.form.markAsDirty();
  }
}
