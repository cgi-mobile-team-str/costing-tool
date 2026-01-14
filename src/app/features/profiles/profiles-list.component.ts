import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Profile } from '../../core/models/domain.model';
import { CalculationService } from '../../core/services/calculation.service';
import { I18nService } from '../../core/services/i18n.service';
import { ProfilesRepository } from '../../data/profiles.repository';
import { SettingsRepository } from '../../data/settings.repository';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardIconComponent } from '../../shared/components/icon/icon.component';
import { ZardSheetService } from '../../shared/components/sheet/sheet.service';
import { ZardTableImports } from '../../shared/components/table/table.imports';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ProfileFormComponent } from './profile-form.component';

@Component({
  selector: 'app-profiles-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    FormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ...ZardTableImports,
  ],
  template: `
    <div class="header">
      <div>
        <span class="context-label">{{ 'nav.profiles' | translate }}</span>
        <h2>{{ settings().projectName }}</h2>
      </div>
    </div>

    <div class="profiles-toolbar">
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

      <!-- Search Bar -->
      <div class="search-container">
        <div class="search-input-wrapper">
          <z-icon zType="search" class="search-icon" />
          <input
            type="text"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Rechercher un profil..."
            class="search-input"
          />
        </div>
      </div>
    </div>

    <div class="table-container shadow-sm">
      <table z-table>
        <thead z-table-header>
          <tr z-table-row>
            <th z-table-head>{{ 'profiles.name' | translate }}</th>
            <th z-table-head>{{ 'profiles.username' | translate }}</th>
            <th z-table-head>{{ 'profiles.rate' | translate }}</th>
            <th z-table-head>{{ 'profiles.active' | translate }}</th>
            <th z-table-head class="text-right">{{ 'common.actions' | translate }}</th>
          </tr>
        </thead>
        <tbody z-table-body>
          @for (profile of filteredProfiles(); track profile.id) {
          <tr z-table-row [class.inactive]="!profile.active">
            <td z-table-cell class="font-medium">{{ profile.name }}</td>
            <td z-table-cell>{{ profile.username || '-' }}</td>
            <td z-table-cell>{{ profile.dailyRate | currency : 'EUR' }}</td>
            <td z-table-cell>
              <span class="badge" [class.success]="profile.active">{{
                profile.active ? 'Oui' : 'Non'
              }}</span>
            </td>
            <td z-table-cell class="text-right">
              <div class="flex justify-end gap-2">
                <button z-button zType="outline" zSize="sm" (click)="openProfileSheet(profile)">
                  {{ 'common.edit' | translate }}
                </button>
                <button z-button zType="destructive" zSize="sm" (click)="delete(profile)">
                  {{ 'common.delete' | translate }}
                </button>
              </div>
            </td>
          </tr>
          } @empty {
          <tr z-table-row>
            <td z-table-cell colspan="5" class="text-center py-8 text-muted-foreground">
              Aucun profil trouvé pour "{{ searchTerm() }}"
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Floating Action Button for Mobile / Standard for Desktop -->
    <div class="fab-container gap-2 flex flex-col items-end">
      <button z-button (click)="openProfileSheet()">
        <z-icon zType="plus" />
        {{ 'common.add' | translate }}
      </button>
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

      .profiles-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 2rem;
        margin-bottom: 2rem;
      }

      .fab-container {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        z-index: 50;
      }

      .search-container {
        flex: 1;
        max-width: 400px;
      }

      .search-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .search-icon {
        position: absolute;
        left: 0.75rem;
        color: #6c757d;
        width: 18px;
        height: 18px;
      }

      .search-input {
        width: 100%;
        padding: 0.625rem 1rem 0.625rem 2.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        transition: all 0.2s ease;
        background: white;
      }

      .search-input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
      }

      .card {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 0;
        min-width: 300px;
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
  private sheetService = inject(ZardSheetService);
  private i18n = inject(I18nService);

  profiles = signal<Profile[]>([]);
  searchTerm = signal('');
  marginPercent = 0;

  filteredProfiles = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.profiles();
    return this.profiles().filter((p) => p.name.toLowerCase().includes(term));
  });

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

  openProfileSheet(profile?: Profile) {
    this.sheetService.create({
      zTitle: profile
        ? this.i18n.translate('profiles.edit_title')
        : this.i18n.translate('profiles.create_title'),
      zDescription: this.i18n.translate('profiles.edit_desc'),
      zContent: ProfileFormComponent,
      zData: profile,
      zOkText: this.i18n.translate('profiles.save_changes'),
      zCancelText: this.i18n.translate('common.cancel'),
      zWidth: '400px',
      zOnOk: (instance: ProfileFormComponent) => {
        if (instance.save()) {
          this.refresh();
          return;
        }
        return false;
      },
    });
  }

  delete(profile: Profile) {
    if (confirm('Are you sure?')) {
      this.repo.delete(profile.id);
      this.refresh();
    }
  }
}
