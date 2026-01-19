import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BacklogItem, Scope } from '../../core/models/domain.model';
import { CalculationService } from '../../core/services/calculation.service';
import { BacklogRepository } from '../../data/backlog.repository';
import { ProfilesRepository } from '../../data/profiles.repository';
import { SettingsRepository } from '../../data/settings.repository';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RouterLink],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <div>
          <span class="dashboard-context-label">{{ 'nav.dashboard' | translate }}</span>
          <h2>{{ settings().projectName }}</h2>
        </div>
      </div>

      <!-- Global Stats -->
      <div class="dashboard-stats-grid">
        <div class="dashboard-card dashboard-stat-card total">
          <h3>Global</h3>
          <div class="dashboard-value">{{ globalStats().totalTtc | currency : 'EUR' }}</div>
          <div class="dashboard-sub">HT: {{ globalStats().totalHt | currency : 'EUR' }}</div>
          <div class="dashboard-sub">Marge: {{ globalStats().margin | currency : 'EUR' }}</div>
        </div>

        @for (scope of scopes; track scope) {
        <div class="dashboard-card dashboard-stat-card">
          <h3>{{ scope }}</h3>
          <div class="dashboard-value">{{ scopeStats()(scope).totalTtc | currency : 'EUR' }}</div>
          <div class="dashboard-sub">HT: {{ scopeStats()(scope).totalHt | currency : 'EUR' }}</div>
        </div>
        }
      </div>

      <!-- Chart & Top Items -->
      <div class="dashboard-content-main">
        <div class="dashboard-card dashboard-chart-card">
          <h3>Cost Distribution</h3>
          <div class="dashboard-chart-container">
            <!-- Simple CSS Bar Chart -->
            @for (scope of scopes; track scope) {
            <div class="dashboard-bar-group">
              <div class="dashboard-bar-label">{{ scope }}</div>
              <div class="dashboard-bar-track">
                <svg width="100%" height="100%" preserveAspectRatio="none">
                  <rect
                    class="dashboard-bar ht"
                    x="0"
                    y="0"
                    [attr.width]="getBarWidth(scopeStats()(scope).totalHt) + '%'"
                    height="100%"
                  ></rect>
                </svg>
              </div>
              <div class="dashboard-bar-value">
                {{ scopeStats()(scope).totalTtc | currency : 'EUR' : 'symbol' : '1.0-0' }}
              </div>
            </div>
            }
          </div>
        </div>

        <div class="dashboard-card dashboard-list-card">
          <h3>{{ 'dash.top_expensive' | translate }}</h3>
          <div class="dashboard-top-list">
            @for (item of topItems(); track item.id) {
            <div class="dashboard-top-item">
              <div class="dashboard-top-info">
                <div class="dashboard-top-title">{{ item.title }}</div>
                <div class="dashboard-top-meta">{{ item.scope }} • {{ item.effortDays }}j</div>
              </div>
              <div class="dashboard-top-cost">
                {{ getItemCost(item) | currency : 'EUR' }}
                <a [routerLink]="['/backlog', item.id]">✏️</a>
              </div>
            </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  private backlogRepo = inject(BacklogRepository);
  private profilesRepo = inject(ProfilesRepository);
  private settingsRepo = inject(SettingsRepository);
  private calc = inject(CalculationService);

  private backlog = signal(this.backlogRepo.getAll());
  private profiles = this.profilesRepo.getAll(); // Static for calc, fine if refreshed
  settings = signal(this.settingsRepo.get());

  scopes: Scope[] = ['MVP', 'V1', 'V2'];

  constructor() {
    // Refresh data on init
  }

  // Helpers
  getItemCost(item: BacklogItem): number {
    const p = this.profiles.find((x) => x.id === item.profileId);
    return p ? this.calc.calculateItemCost(item.effortDays, p.dailyRate) : 0;
  }

  scopeStats = computed(() => {
    // Prepare a map or helper
    // We can't return a function in computed efficiently for template.
    // Better to pre-calculate everything.
    return (targetScope: Scope) => {
      const items = this.backlog().filter((i) => i.scope === targetScope);
      const totalHt = items.reduce((acc, i) => acc + this.getItemCost(i), 0);
      const totalTtc = this.calc.applyMargin(totalHt, this.settings().marginRate);
      return { totalHt, totalTtc };
    };
  });

  globalStats = computed(() => {
    const items = this.backlog();
    const totalHt = items.reduce((acc, i) => acc + this.getItemCost(i), 0);
    const margin = this.calc.calculateMarginAmount(totalHt, this.settings().marginRate);
    const totalTtc = totalHt + margin;
    return { totalHt, margin, totalTtc };
  });

  // For chart max value
  maxTotal = computed(() => {
    return Math.max(...this.scopes.map((s) => this.scopeStats()(s).totalHt), 1); // Avoid div zero
  });

  getBarWidth(value: number): number {
    return (value / this.globalStats().totalHt) * 100; // Relative to global total or max scope? usually max scope width.
  }

  topItems = computed(() => {
    // Sort by cost desc
    return [...this.backlog()]
      .sort((a, b) => this.getItemCost(b) - this.getItemCost(a))
      .slice(0, 5);
  });
}
