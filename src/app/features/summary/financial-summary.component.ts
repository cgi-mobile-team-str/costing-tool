import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { BacklogItem, Profile } from '../../core/models/domain.model';
import { CalculationService } from '../../core/services/calculation.service';
import { ProjectsService } from '../../core/services/projects.service';
import { BacklogRepository } from '../../data/backlog.repository';
import { ProfilesRepository } from '../../data/profiles.repository';

interface ProfileSummary {
  profileName: string;
  workload: number;
  dailyRate: number; // TJM
  scr: number; // CJM
  price: number; // workload * dailyRate
  cost: number; // workload * scr
  margin: number; // (price - cost) / price
}

interface ScopeSummary {
  scope: string;
  rows: ProfileSummary[];
  totalWorkload: number;
  totalPrice: number;
  totalCost: number;
  avgDailyRate: number;
  avgScr: number;
  margin: number;
}

@Component({
  selector: 'app-financial-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './financial-summary.component.html',
  styleUrls: ['./financial-summary.component.css'],
})
export class FinancialSummaryComponent {
  private backlogRepo = inject(BacklogRepository);
  private profilesRepo = inject(ProfilesRepository);
  private calcService = inject(CalculationService);
  private projectsService = inject(ProjectsService);

  // Use the repo signal for items
  items = this.backlogRepo.items;

  // Local signal for profiles
  profiles = signal<Profile[]>([]);

  // Project Info
  currentProjectName = this.projectsService.currentProjectName;

  constructor() {
    effect(() => {
      const projectId = this.projectsService.currentProjectId();
      if (projectId) {
        this.loadData(projectId);
      }
    });
  }

  private loadData(projectId: string) {
    // Ensure items are loaded
    this.backlogRepo.getAllItems(projectId).subscribe();

    // Load profiles
    this.profilesRepo.getAll(projectId).subscribe((profiles) => {
      this.profiles.set(profiles);
    });
  }

  summaryData = computed(() => {
    const items = this.items();
    const profiles = this.profiles();

    // Avoid calculation if data is missing
    if (!items.length || !profiles.length) {
      return {
        scopes: [],
        total: {
          totalWorkload: 0,
          totalPrice: 0,
          totalCost: 0,
          avgDailyRate: 0,
          avgScr: 0,
          margin: 0,
        },
      };
    }

    const totalBuildEffort = this.calcService.calculateTotalBuildEffort(items);

    // Group by Scope
    const scopeGroups = new Map<string, BacklogItem[]>();
    items.forEach((item) => {
      const scope = item.scope || 'No Scope';
      if (!scopeGroups.has(scope)) {
        scopeGroups.set(scope, []);
      }
      scopeGroups.get(scope)!.push(item);
    });

    const summaries: ScopeSummary[] = [];
    let grandTotalWorkload = 0;
    let grandTotalPrice = 0;
    let grandTotalCost = 0;

    // Sort scopes
    const sortedScopes = Array.from(scopeGroups.keys()).sort();

    for (const scope of sortedScopes) {
      const scopeItems = scopeGroups.get(scope)!;
      const profileMap = new Map<string, { workload: number; profile: Profile }>();

      for (const item of scopeItems) {
        // Skip items with no profile if that matters, or handle undefined
        const profileId = item.profileId;
        const profile = profiles.find((p) => p.id === profileId);

        // Items must have a profile for cost calculation
        if (!profile) continue;

        const effort = this.calcService.getItemEffort(item, totalBuildEffort);
        if (effort === 0) continue;

        if (!profileMap.has(profileId)) {
          profileMap.set(profileId, { workload: 0, profile });
        }
        profileMap.get(profileId)!.workload += effort;
      }

      const rows: ProfileSummary[] = [];
      let scopeWorkload = 0;
      let scopePrice = 0;
      let scopeCost = 0;

      for (const { workload, profile } of profileMap.values()) {
        const price = workload * profile.dailyRate;
        const scr = profile.scr || 0;
        const cost = workload * scr;
        const margin = price > 0 ? (price - cost) / price : 0;

        rows.push({
          profileName: profile.name,
          workload,
          dailyRate: profile.dailyRate,
          scr,
          price,
          cost,
          margin,
        });

        scopeWorkload += workload;
        scopePrice += price;
        scopeCost += cost;
      }

      rows.sort((a, b) => a.profileName.localeCompare(b.profileName));

      const scopeMargin = scopePrice > 0 ? (scopePrice - scopeCost) / scopePrice : 0;
      const avgDailyRate = scopeWorkload > 0 ? scopePrice / scopeWorkload : 0;
      const avgScr = scopeWorkload > 0 ? scopeCost / scopeWorkload : 0;

      if (rows.length > 0) {
        summaries.push({
          scope,
          rows,
          totalWorkload: scopeWorkload,
          totalPrice: scopePrice,
          totalCost: scopeCost,
          avgDailyRate,
          avgScr,
          margin: scopeMargin,
        });
      }

      grandTotalWorkload += scopeWorkload;
      grandTotalPrice += scopePrice;
      grandTotalCost += scopeCost;
    }

    const grandTotalMargin =
      grandTotalPrice > 0 ? (grandTotalPrice - grandTotalCost) / grandTotalPrice : 0;
    const grandAvgDailyRate = grandTotalWorkload > 0 ? grandTotalPrice / grandTotalWorkload : 0;
    const grandAvgScr = grandTotalWorkload > 0 ? grandTotalCost / grandTotalWorkload : 0;

    return {
      scopes: summaries,
      total: {
        totalWorkload: grandTotalWorkload,
        totalPrice: grandTotalPrice,
        totalCost: grandTotalCost,
        avgDailyRate: grandAvgDailyRate,
        avgScr: grandAvgScr,
        margin: grandTotalMargin,
      },
    };
  });
}
