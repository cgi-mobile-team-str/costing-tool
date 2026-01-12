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
      <h2>{{ 'nav.profiles' | translate }}</h2>
      <a routerLink="/profiles/new" class="btn btn-primary">{{ 'common.add' | translate }}</a>
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

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>{{ 'profiles.name' | translate }}</th>
            <th>{{ 'profiles.rate' | translate }}</th>
            <th>{{ 'profiles.active' | translate }}</th>
            <th>{{ 'common.actions' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          @for (profile of profiles(); track profile.id) {
          <tr [class.inactive]="!profile.active">
            <td>{{ profile.name }}</td>
            <td>{{ profile.dailyRate | currency : 'EUR' }}</td>
            <td>
              <span class="badge" [class.success]="profile.active">{{
                profile.active ? 'Oui' : 'Non'
              }}</span>
            </td>
            <td class="actions">
              <a [routerLink]="['/profiles', profile.id]" class="btn-sm btn-outline">{{
                'common.edit' | translate
              }}</a>
              <button (click)="delete(profile)" class="btn-sm btn-danger">
                {{ 'common.delete' | translate }}
              </button>
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .table-container {
        overflow-x: auto;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid #eee;
      }
      th {
        background: #f8f9fa;
        font-weight: 600;
        color: #495057;
      }
      tr:hover {
        background: #f8f9fa;
      }
      tr.inactive {
        opacity: 0.6;
      }
      .btn {
        padding: 0.5rem 1rem;
        border-radius: 4px;
        text-decoration: none;
        border: none;
        cursor: pointer;
      }
      .btn-primary {
        background: #007bff;
        color: white;
      }
      .btn-sm {
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
        border-radius: 4px;
        cursor: pointer;
        border: 1px solid transparent;
        margin-right: 0.5rem;
        text-decoration: none;
        display: inline-block;
      }
      .btn-outline {
        border-color: #dee2e6;
        color: #495057;
        background: white;
      }
      .btn-danger {
        background: #dc3545;
        color: white;
        border-color: #dc3545;
      }
      .badge {
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        background: #e9ecef;
        color: #495057;
      }
      .badge.success {
        background: #d4edda;
        color: #155724;
      }
      .badge.success {
        background: #d4edda;
        color: #155724;
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
  marginPercent = 0;

  constructor() {
    this.refresh();
    const s = this.settingsRepo.get();
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
