import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, ViewEncapsulation } from '@angular/core';
import { BacklogItem, Profile } from '../../../core/models/domain.model';
import { CalculationService } from '../../../core/services/calculation.service';
import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-dashboard-profiles-stats',
  standalone: true,
  imports: [CommonModule, TranslatePipe, ZardTableImports],
  templateUrl: './dashboard-profiles-stats.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class DashboardProfilesStatsComponent {
  profiles = input.required<Profile[]>();
  backlog = input.required<BacklogItem[]>();
  private calc = inject(CalculationService);

  constructor() {
    // No fetch
  }

  totalBuildEffort = computed(() => {
    return this.calc.calculateTotalBuildEffort(this.backlog());
  });

  getItemEffort(item: BacklogItem): number {
    return this.calc.getItemEffort(item, this.totalBuildEffort());
  }

  profileStats = computed(() => {
    const items = this.backlog();

    // Build stats
    return this.profiles()
      .map((profile) => {
        const profileItems = items.filter((i) => i.profileId === profile.id);
        const totalDays = profileItems.reduce((acc, i) => acc + this.getItemEffort(i), 0);
        const totalCost = this.calc.calculateItemCost(totalDays, profile.dailyRate);
        const totalScrCost = totalDays * (profile.scr || 0);
        const margin = totalCost > 0 ? 1 - totalScrCost / totalCost : 0;

        return {
          ...profile,
          totalDays,
          totalCost,
          totalScrCost,
          margin,
          itemCount: profileItems.length,
        };
      })
      .filter((p) => p.totalDays > 0)
      .sort((a, b) => b.totalCost - a.totalCost);
  });
}
