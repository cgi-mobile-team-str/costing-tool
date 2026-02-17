import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Profile } from '../../core/models/domain.model';
import { BacklogService } from '../../core/services/backlog.service';
import { CalculationService } from '../../core/services/calculation.service';
import { I18nService } from '../../core/services/i18n.service';
import { ProjectsService } from '../../core/services/projects.service';
import { BacklogRepository } from '../../data/backlog.repository';
import { PlanningRepository } from '../../data/planning.repository';
import { ProfilesRepository } from '../../data/profiles.repository';
import { ZardInputDirective } from '../../shared/components/input/index';
import { ZardTableImports } from '../../shared/components/table/table.imports';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface PlanningRow {
  scope: string;
  profileId: string;
  profileName: string;
  username?: string;
  totalEffort: number;
  remaining: number;
  distribution: Record<number, number>;
}

interface PlanningScopeGroup {
  scope: string;
  rows: PlanningRow[];
  totalEffort: number;
  remaining: number;
  monthlyTotals: Record<number, number>;
}

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, FormsModule, ...ZardTableImports, ZardInputDirective, TranslatePipe],
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.css'],
})
export class PlanningComponent {
  private backlogRepo = inject(BacklogRepository);
  private profilesRepo = inject(ProfilesRepository);
  private planningRepo = inject(PlanningRepository);
  private calcService = inject(CalculationService);
  private projectsService = inject(ProjectsService);
  private backlogService = inject(BacklogService);
  private i18n = inject(I18nService);

  currentProjectName = this.projectsService.currentProjectName;
  items = this.backlogRepo.items;
  profiles = signal<Profile[]>([]);
  plannings = this.planningRepo.plannings;
  startDate = this.projectsService.startDate;

  months = Array.from({ length: 24 }, (_, i) => i);

  formattedMonthLabels = computed(() => {
    const start = this.startDate();
    if (!start) {
      return this.months.map((m) => `M${m + 1}`);
    }

    // Use UTC to avoid timezone shifts for YYYY-MM-DD strings
    const startDate = new Date(start);
    const lang = this.i18n.getLang() === 'fr' ? 'fr-FR' : 'en-US';

    return this.months.map((m) => {
      // Create date object and adjust month in UTC
      const date = new Date(
        Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + m, 1, 12, 0, 0),
      );
      const month = date.toLocaleString(lang, { month: 'short', timeZone: 'UTC' });
      const year = date.getUTCFullYear().toString().slice(-2);
      // Capitalize first letter
      return month.charAt(0).toUpperCase() + month.slice(1) + ' ' + year;
    });
  });

  constructor() {
    effect(() => {
      const projectId = this.projectsService.currentProjectId();
      if (projectId) {
        this.loadData(projectId);
      }
    });
  }

  private loadData(projectId: string) {
    this.backlogService.loadProjectData(projectId).subscribe();
    this.profilesRepo.getAll(projectId).subscribe((profiles) => {
      this.profiles.set(profiles);
    });
    this.planningRepo.getByProject(projectId).subscribe();
  }

  planningData = computed(() => {
    const items = this.items();
    const profiles = this.profiles();
    const existingPlannings = this.plannings();

    if (!items.length || !profiles.length) return [];

    const totalBuildEffort = this.calcService.calculateTotalBuildEffort(items);

    // Group items by (Scope, Profile)
    const effortMap = new Map<string, number>();
    items.forEach((item) => {
      const scope = item.scope || 'No Scope';
      const profileId = item.profileId;
      const key = `${scope}|${profileId}`;
      const effort = this.calcService.getItemEffort(item, totalBuildEffort);
      effortMap.set(key, (effortMap.get(key) || 0) + effort);
    });

    // Group by Scope for the UI
    const scopeGroupsMap = new Map<string, PlanningRow[]>();

    effortMap.forEach((totalEffort, key) => {
      const [scope, profileId] = key.split('|');
      const profile = profiles.find((p) => p.id === profileId);
      if (!profile) return;

      const planning = existingPlannings.find(
        (p) => p.scope === scope && p.profileId === profileId,
      );

      const distribution = planning ? { ...planning.distribution } : {};

      // Convert distribution keys to numbers if they are strings from backend
      const numericDistribution: Record<number, number> = {};
      Object.entries(distribution).forEach(([k, v]) => {
        numericDistribution[Number(k)] = Number(v);
      });

      const totalDistributed = Object.values(numericDistribution).reduce((sum, v) => sum + v, 0);

      const row: PlanningRow = {
        scope,
        profileId,
        profileName: profile.name,
        username: profile.username,
        totalEffort,
        remaining: totalEffort - totalDistributed,
        distribution: numericDistribution,
      };

      if (!scopeGroupsMap.has(scope)) {
        scopeGroupsMap.set(scope, []);
      }
      scopeGroupsMap.get(scope)!.push(row);
    });

    const groups: PlanningScopeGroup[] = [];
    const sortedScopes = Array.from(scopeGroupsMap.keys()).sort();

    sortedScopes.forEach((scope) => {
      const rows = scopeGroupsMap
        .get(scope)!
        .sort((a, b) => a.profileName.localeCompare(b.profileName));

      const totalEffort = rows.reduce((sum, r) => sum + r.totalEffort, 0);
      const remaining = rows.reduce((sum, r) => sum + r.remaining, 0);
      const monthlyTotals: Record<number, number> = {};
      this.months.forEach((m) => {
        monthlyTotals[m] = rows.reduce((sum, r) => sum + (r.distribution[m] || 0), 0);
      });

      groups.push({
        scope,
        rows,
        totalEffort,
        remaining,
        monthlyTotals,
      });
    });

    return groups;
  });

  grandTotals = computed(() => {
    const data = this.planningData();
    let totalEffort = 0;
    let remaining = 0;
    const monthlyTotals: Record<number, number> = {};
    this.months.forEach((m) => (monthlyTotals[m] = 0));

    data.forEach((group) => {
      totalEffort += group.totalEffort;
      remaining += group.remaining;
      this.months.forEach((m) => {
        monthlyTotals[m] += group.monthlyTotals[m] || 0;
      });
    });

    return { totalEffort, remaining, monthlyTotals };
  });

  onValueChange(row: PlanningRow, month: number, event: any) {
    const rawValue = event?.target?.value || '0';
    const normalizedValue = rawValue.replace(',', '.');
    const value = parseFloat(normalizedValue) || 0;
    const projectId = this.projectsService.currentProjectId();
    if (!projectId) return;

    // Convert keys to string for the model
    const newDistribution: Record<string, number> = {};
    Object.entries(row.distribution).forEach(([k, v]) => {
      newDistribution[String(k)] = v;
    });
    newDistribution[String(month)] = value;

    // Optimistic update via signal
    this.planningRepo.updateOptimistic({
      projectId,
      scope: row.scope,
      profileId: row.profileId,
      distribution: newDistribution,
    });

    // Send to backend
    this.planningRepo
      .save({
        projectId,
        scope: row.scope,
        profileId: row.profileId,
        distribution: newDistribution,
      })
      .subscribe();
  }

  getDistributionValue(row: PlanningRow, month: number): number | string {
    const val = row.distribution[month];
    return val === 0 || val === undefined ? '' : val;
  }
}
