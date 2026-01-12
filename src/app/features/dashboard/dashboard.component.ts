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
    <div class="container">
      <div class="header">
        <div>
          <span class="context-label">{{ 'nav.dashboard' | translate }}</span>
          <h2>{{ settings().projectName }}</h2>
        </div>
      </div>

      <!-- Global Stats -->
      <div class="stats-grid">
        <div class="card stat-card total">
          <h3>Global</h3>
          <div class="value">{{ globalStats().totalTtc | currency : 'EUR' }}</div>
          <div class="sub">HT: {{ globalStats().totalHt | currency : 'EUR' }}</div>
          <div class="sub">Marge: {{ globalStats().margin | currency : 'EUR' }}</div>
        </div>

        @for (scope of scopes; track scope) {
        <div class="card stat-card">
          <h3>{{ scope }}</h3>
          <div class="value">{{ scopeStats()(scope).totalTtc | currency : 'EUR' }}</div>
          <div class="sub">HT: {{ scopeStats()(scope).totalHt | currency : 'EUR' }}</div>
        </div>
        }
      </div>

      <!-- Chart & Top Items -->
      <div class="dashboard-content">
        <div class="card chart-card">
          <h3>Cost Distribution</h3>
          <div class="chart-container">
            <!-- Simple CSS Bar Chart -->
            @for (scope of scopes; track scope) {
            <div class="bar-group">
              <div class="bar-label">{{ scope }}</div>
              <div class="bar-track">
                <!-- HT Bar -->
                <div
                  class="bar ht"
                  [style.width.%]="getBarWidth(scopeStats()(scope).totalHt)"
                  [title]="'HT: ' + scopeStats()(scope).totalHt"
                ></div>
                <!-- Margin Bar (stacked visual or separate? Let's do overlay or just total) -->
                <!-- Let's show Total TTC as the main bar width relative to global max -->
              </div>
              <div class="bar-value">
                {{ scopeStats()(scope).totalTtc | currency : 'EUR' : 'symbol' : '1.0-0' }}
              </div>
            </div>
            }
          </div>
        </div>

        <div class="card list-card">
          <h3>{{ 'dash.top_expensive' | translate }}</h3>
          <div class="top-list">
            @for (item of topItems(); track item.id) {
            <div class="top-item">
              <div class="top-info">
                <div class="top-title">{{ item.title }}</div>
                <div class="top-meta">{{ item.scope }} • {{ item.effortDays }}j</div>
              </div>
              <div class="top-cost">
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
  styles: [
    `
      .container {
        max-width: 1200px;
        margin: 0 auto;
      }
      .header {
        margin-bottom: 2.5rem;
        padding-top: 1rem;
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
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }
      .card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      .stat-card.total {
        background: var(--brand-red);
        color: white;
      }
      .stat-card.total .sub {
        color: rgba(255, 255, 255, 0.8);
      }
      .stat-card h3 {
        margin-top: 0;
        font-size: 1rem;
        opacity: 0.8;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .value {
        font-size: 1.8rem;
        font-weight: bold;
        margin: 0.5rem 0;
      }
      .sub {
        font-size: 0.9rem;
        color: #6c757d;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem;
        border-radius: var(--radius);
        font-size: 0.875rem;
        font-weight: 500;
        border: none;
        cursor: pointer;
        transition: all 0.15s ease;
        text-decoration: none;
      }
      .btn-secondary {
        background: var(--muted);
        color: var(--muted-foreground);
        border: 1px solid var(--border);
      }
      .btn-secondary:hover {
        background: var(--accent);
        color: var(--accent-foreground);
      }

      .dashboard-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }
      @media (max-width: 768px) {
        .dashboard-content {
          grid-template-columns: 1fr;
        }
      }

      .chart-container {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        height: 200px;
      }
      .bar-group {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .bar-label {
        width: 50px;
        font-weight: bold;
      }
      .bar-track {
        flex: 1;
        background: #e9ecef;
        height: 24px;
        border-radius: 12px;
        overflow: hidden;
        position: relative;
      }
      .bar {
        height: 100%;
        transition: width 0.5s ease;
      }
      .bar.ht {
        background: var(--brand-red);
      }
      .bar-value {
        width: 80px;
        text-align: right;
        font-size: 0.9rem;
      }

      .top-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .top-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 1px solid #eee;
      }
      .top-item:last-child {
        border-bottom: none;
      }
      .top-title {
        font-weight: 500;
      }
      .top-meta {
        font-size: 0.8rem;
        color: #6c757d;
      }
      .top-cost {
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      a {
        text-decoration: none;
      }
    `,
  ],
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
