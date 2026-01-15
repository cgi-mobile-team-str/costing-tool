import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Profile } from '../../core/models/domain.model';
import { CalculationService } from '../../core/services/calculation.service';
import { ProfilesRepository } from '../../data/profiles.repository';
import { SettingsRepository } from '../../data/settings.repository';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-profiles-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, FormsModule],
  template: `
    <div class="header">
      <div>
        <span class="context-label">{{ 'nav.profiles' | translate }}</span>
        <h2>{{ settings().projectName }}</h2>
      </div>
    </div>

    <!-- Margin Configuration -->
    <div class="margin-config card">
      <div class="form-group">
        <label>Marge Global (%)</label>
        <div class="d-flex">
          <input
            type="number"
            [(ngModel)]="marginPercent"
            (change)="updateMargin()"
            class="form-control margin-input"
            min="0"
            max="100"
          />
          <span class="preview">Ex: 1000€ ➔ {{ calculatePreview() | currency : 'EUR' }}</span>
        </div>
      </div>
    </div>

    <div class="table-container shadow-sm">
      <table>
        <thead>
          <tr>
            <th>{{ 'profiles.name' | translate }}</th>
            <th>{{ 'profiles.rate' | translate }}</th>
            <th>{{ 'profiles.active' | translate }}</th>
            <th class="text-right">{{ 'common.actions' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          @for (profile of profiles(); track profile.id) {
          <tr [class.inactive]="!profile.active">
            <td class="font-medium">{{ profile.name }}</td>
            <td>{{ profile.dailyRate | currency : 'EUR' }}</td>
            <td>
              <span class="badge" [class.success]="profile.active">{{
                profile.active ? 'Oui' : 'Non'
              }}</span>
            </td>
            <td class="actions text-right">
              <a
                [routerLink]="['/profiles', profile.id]"
                class="btn btn-sm btn-outline"
                >{{ 'common.edit' | translate }}</a
              >
              <button (click)="delete(profile)" class="btn btn-sm btn-danger">
                {{ 'common.delete' | translate }}
              </button>
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>

    <div class="footer-actions">
      <a routerLink="/profiles/new" class="btn btn-dark">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          style="margin-right: 0.5rem"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        {{ 'common.add' | translate }}
      </a>
    </div>
  `,
  styles: [
    `
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 2.5rem;
        padding-top: 1rem;
      }
      .actions a,
      .actions button {
        margin-left: 0.5rem;
        border-radius: var(--radius) !important;
      }
      .actions button.btn-danger {
        border: none !important;
      }
      .context-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: #6c757d;
        font-weight: 600;
        margin-bottom: 0.25rem;
        display: block;
      }
      .header h2 {
        margin: 0;
        font-size: 2.5rem;
        font-weight: 800;
        background: linear-gradient(135deg, var(--brand-red) 0%, #a31227 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -0.03em;
        line-height: 1.1;
      }
      /* Global styles inherited */

      .footer-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 1.5rem;
      }

      .card {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 1.5rem;
        max-width: 400px;
      }
      .margin-config label {
        font-weight: 500;
        display: block;
        margin-bottom: 0.5rem;
      }
      .margin-input {
        width: 80px;
        padding: 0.5rem;
        border: 1px solid #ced4da;
        border-radius: 4px;
        margin-right: 1rem;
      }
      .d-flex {
        display: flex;
        align-items: center;
      }
      .preview {
        color: #6c757d;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class ProfilesListComponent {
  private repo = inject(ProfilesRepository);
  private settingsRepo = inject(SettingsRepository);
  private calc = inject(CalculationService);

  profiles = signal<Profile[]>([]);
  settings = signal(this.settingsRepo.get());
  marginPercent = 0;

  constructor() {
    this.refresh();
    const s = this.settings();
    this.marginPercent = s.marginRate * 100;
  }

  refresh() {
    this.profiles.set(this.repo.getAll());
  }

  updateMargin() {
    const current = this.settingsRepo.get();
    this.settingsRepo.save({
      ...current,
      marginRate: this.marginPercent / 100,
    });
  }

  calculatePreview() {
    return this.calc.applyMargin(1000, this.marginPercent / 100);
  }

  delete(profile: Profile) {
    if (confirm('Are you sure?')) {
      this.repo.delete(profile.id);
      this.refresh();
    }
  }
}
