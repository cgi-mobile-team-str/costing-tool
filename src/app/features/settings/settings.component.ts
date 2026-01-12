import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CalculationService } from '../../core/services/calculation.service';
import { I18nService, Lang } from '../../core/services/i18n.service';
import { LocalStorageService } from '../../core/services/local-storage.service';
import { SettingsRepository } from '../../data/settings.repository';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="container">
      <h2>{{ 'nav.settings' | translate }}</h2>

      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="card">
          <h3>Calculations</h3>

          <div class="form-group">
            <label>Currency</label>
            <select formControlName="currency" class="form-control">
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>

        <div class="card">
          <h3>Interface</h3>
          <div class="form-group">
            <label>Language</label>
            <select [value]="currentLang()" (change)="changeLang($event)" class="form-control">
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div class="actions">
          <button type="submit" [disabled]="form.invalid || form.pristine" class="btn btn-primary">
            {{ 'common.save' | translate }}
          </button>
        </div>
      </form>

      <div class="danger-zone">
        <h3>Danger Zone</h3>
        <button (click)="resetApp()" class="btn btn-danger">Reset App Data</button>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 600px;
        margin: 0 auto;
      }
      .card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      h3 {
        margin-top: 0;
        font-size: 1.1rem;
        border-bottom: 1px solid #eee;
        padding-bottom: 0.5rem;
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
      .actions {
        text-align: right;
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
      .btn-danger {
        background: #dc3545;
        color: white;
      }
      .danger-zone {
        border-top: 1px solid #dc3545;
        padding-top: 1rem;
        margin-top: 3rem;
      }
      .hint {
        display: block;
        margin-top: 0.25rem;
        color: #6c757d;
        font-size: 0.875rem;
      }
    `,
  ],
})
export class SettingsComponent {
  private fb = inject(FormBuilder);
  private repo = inject(SettingsRepository);
  private storage = inject(LocalStorageService);
  private i18n = inject(I18nService);
  private calc = inject(CalculationService);

  form = this.fb.group({
    currency: ['EUR', Validators.required],
  });

  currentLang = this.i18n.getLang.bind(this.i18n);

  constructor() {
    const s = this.repo.get();
    this.form.patchValue({
      currency: s.currency,
    });
  }

  save() {
    if (this.form.valid) {
      const val = this.form.value;
      // Get current state to preserve margin
      const current = this.repo.get();
      this.repo.save({
        ...current,
        currency: val.currency || 'EUR',
      });
      this.form.markAsPristine();
      alert('Settings saved');
    }
  }

  changeLang(e: Event) {
    const val = (e.target as HTMLSelectElement).value as Lang;
    this.i18n.setLang(val);
  }

  resetApp() {
    if (
      confirm(
        'ATTENTION: Cela va effacer toutes les données (Profils, Backlog, Settings). Continuer ?'
      )
    ) {
      this.storage.clear();
      window.location.reload();
    }
  }
}
