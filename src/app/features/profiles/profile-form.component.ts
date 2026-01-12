import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Profile } from '../../core/models/domain.model';
import { IdService } from '../../core/services/id.service';
import { ProfilesRepository } from '../../data/profiles.repository';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="container">
      <h2>{{ (isEditMode() ? 'common.edit' : 'profiles.create_title') | translate }}</h2>

      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="form-group">
          <label for="name">{{ 'profiles.name' | translate }}</label>
          <input id="name" type="text" formControlName="name" class="form-control" />
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
          <div class="error">{{ 'common.required' | translate }}</div>
          } @if (form.errors?.['nameExists']) {
          <div class="error">Name already exists</div>
          }
        </div>

        <div class="form-group">
          <label for="dailyRate">{{ 'profiles.rate' | translate }} (€)</label>
          <input id="dailyRate" type="number" formControlName="dailyRate" class="form-control" />
          @if (form.get('dailyRate')?.invalid && form.get('dailyRate')?.touched) {
          <div class="error">Must be > 0</div>
          }
        </div>

        <div class="form-group checkbox">
          <label>
            <input type="checkbox" formControlName="active" />
            {{ 'profiles.active' | translate }}
          </label>
        </div>

        <div class="actions">
          <button type="button" routerLink="/profiles" class="btn btn-secondary">
            {{ 'common.cancel' | translate }}
          </button>
          <button type="submit" [disabled]="form.invalid" class="btn btn-primary">
            {{ 'common.save' | translate }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 600px;
        margin: 0 auto;
      }
      .form-group {
        margin-bottom: 1rem;
      }
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      .form-control {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ced4da;
        border-radius: 4px;
      }
      .plugin-checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
      }
      .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .btn-primary {
        background: #007bff;
        color: white;
      }
      .btn-secondary {
        background: #6c757d;
        color: white;
      }
      .btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }
      .error {
        color: #dc3545;
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }
    `,
  ],
})
export class ProfileFormComponent {
  private fb = inject(FormBuilder);
  private repo = inject(ProfilesRepository);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private idService = inject(IdService);

  form = this.fb.group({
    id: [''],
    name: ['', Validators.required],
    dailyRate: [0, [Validators.required, Validators.min(1)]],
    active: [true],
  });

  isEditMode = signal(false);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      const profile = this.repo.getById(id);
      if (profile) {
        this.form.patchValue(profile);
      } else {
        this.router.navigate(['/profiles']);
      }
    }
  }

  save() {
    if (this.form.invalid) return;

    const val = this.form.value as Profile;
    // Check name uniqueness (naive impl)
    const all = this.repo.getAll();
    const exists = all.find(
      (p) => p.name.toLowerCase() === val.name.toLowerCase() && p.id !== val.id
    );
    if (exists) {
      this.form.setErrors({ nameExists: true });
      return;
    }

    if (!val.id) {
      val.id = this.idService.generate();
    }

    this.repo.save(val as Profile);
    this.router.navigate(['/profiles']);
  }
}
