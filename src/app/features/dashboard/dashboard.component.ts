import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BacklogItem, Scope } from '../../core/models/domain.model';
import { CalculationService } from '../../core/services/calculation.service';
import { BacklogRepository } from '../../data/backlog.repository';
import { ProfilesRepository } from '../../data/profiles.repository';
import { SettingsRepository } from '../../data/settings.repository';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { DashboardProfilesStatsComponent } from './dashboard-profiles-stats/dashboard-profiles-stats.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RouterLink, DashboardProfilesStatsComponent],
  templateUrl: './dashboard.component.html',
  encapsulation: ViewEncapsulation.None,
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
    const total = this.globalStats().totalHt;
    return total > 0 ? (value / total) * 100 : 0;
  }

  topItems = computed(() => {
    // Sort by cost desc
    return [...this.backlog()]
      .sort((a, b) => this.getItemCost(b) - this.getItemCost(a))
      .slice(0, 5);
  });
}
