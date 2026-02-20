import { CommonModule } from '@angular/common';
import { Component, computed, effect, HostListener, inject, signal } from '@angular/core';
import { BacklogItem, Cluster, Product, Profile } from '../../core/models/domain.model';
import { BacklogService } from '../../core/services/backlog.service';
import { CalculationService } from '../../core/services/calculation.service';
import { ProjectsService } from '../../core/services/projects.service';
import { BacklogRepository } from '../../data/backlog.repository';
import { ClustersRepository } from '../../data/clusters.repository';
import { ProductsRepository } from '../../data/products.repository';
import { ProfilesRepository } from '../../data/profiles.repository';
import { ColumnSelectorComponent } from '../backlog/column-selector.component';

import { TranslatePipe } from '../../shared/pipes/translate.pipe';

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

interface ClusterSummary {
  clusterId: string;
  clusterName: string;
  workload: number;
  price: number;
  cost: number;
  avgDailyRate: number;
  avgScr: number;
  margin: number;
}

interface ProductSummary {
  productId: string;
  productName: string;
  clusters: ClusterSummary[];
  totalWorkload: number;
  totalPrice: number;
  totalCost: number;
  avgDailyRate: number;
  avgScr: number;
  margin: number;
}

interface ScopedHierarchySummary {
  scope: string;
  products: ProductSummary[];
  totalWorkload: number;
  totalPrice: number;
}

@Component({
  selector: 'app-financial-summary',
  standalone: true,
  imports: [CommonModule, TranslatePipe, ColumnSelectorComponent],
  templateUrl: './financial-summary.component.html',
  styleUrls: ['./financial-summary.component.css'],
})
export class FinancialSummaryComponent {
  private backlogRepo = inject(BacklogRepository);
  private productsRepo = inject(ProductsRepository);
  private clustersRepo = inject(ClustersRepository);
  private profilesRepo = inject(ProfilesRepository);
  private calcService = inject(CalculationService);
  private projectsService = inject(ProjectsService);
  private backlogService = inject(BacklogService);

  // Use the repo signals
  items = this.backlogRepo.items;
  products = this.productsRepo.items;
  clusters = this.clustersRepo.items;

  // Local signal for profiles
  profiles = signal<Profile[]>([]);

  // Column Visibility
  availableColumns = [
    { id: 'workload', label: 'Workload' },
    { id: 'price', label: 'Price' },
    { id: 'cost', label: 'Cost' },
    { id: 'dailyRate', label: 'Daily rate' },
    { id: 'scr', label: 'SCR' },
    { id: 'margin', label: 'Margin' },
  ];
  visibleColumns = signal<string[]>(['workload', 'price', 'cost', 'dailyRate', 'scr', 'margin']);

  // Project Info
  currentProjectName = this.projectsService.currentProjectName;

  // Collapse state for products in hierarchy summary
  collapsedScopesProducts = signal<Set<string>>(new Set());

  // Manual table and column width resizing
  colWidth = signal<number>(540); // 60% of 900px roughly
  tableMaxWidth = signal<number>(900);

  private isResizing = false;
  private startX = 0;
  private startColWidth = 0;
  private startTableWidth = 0;

  initResize(event: MouseEvent) {
    this.isResizing = true;
    this.startX = event.clientX;
    this.startColWidth = this.colWidth();
    this.startTableWidth = this.tableMaxWidth();
    event.preventDefault(); // prevent text selection during drag
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isResizing) return;
    const diff = event.clientX - this.startX;

    // Apply bounds
    const newColWidth = Math.max(250, this.startColWidth + diff);
    // Table expands symmetrically with the column
    const newTableWidth = Math.max(500, this.startTableWidth + diff);

    this.colWidth.set(newColWidth);
    this.tableMaxWidth.set(newTableWidth);
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    if (this.isResizing) {
      this.isResizing = false;
    }
  }

  toggleProductCollapse(scope: string, productId: string) {
    const key = `${scope}-${productId}`;
    this.collapsedScopesProducts.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }

  isProductCollapsed(scope: string, productId: string): boolean {
    return this.collapsedScopesProducts().has(`${scope}-${productId}`);
  }

  constructor() {
    effect(() => {
      const projectId = this.projectsService.currentProjectId();
      if (projectId) {
        this.loadData(projectId);
      }
    });
  }

  private loadData(projectId: string) {
    // Load Items, Products, and Clusters into their respective repos
    this.backlogService.loadProjectData(projectId).subscribe();

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

  hierarchySummaryByScopeData = computed(() => {
    const items = this.items();
    const products = this.products();
    const clusters = this.clusters();
    const profiles = this.profiles();

    if (!items.length || !products.length || !profiles.length) {
      return [];
    }

    const totalBuildEffort = this.calcService.calculateTotalBuildEffort(items);

    // Group items by scope (MVP, V1, etc.)
    const scopeGroups = new Map<string, BacklogItem[]>();
    items.forEach((item) => {
      const scope = item.scope || 'No Scope';
      if (!scopeGroups.has(scope)) {
        scopeGroups.set(scope, []);
      }
      scopeGroups.get(scope)!.push(item);
    });

    const scopedSummaries: ScopedHierarchySummary[] = [];
    const sortedScopes = Array.from(scopeGroups.keys()).sort();

    for (const scope of sortedScopes) {
      const scopeItems = scopeGroups.get(scope)!;
      const productSummaries: ProductSummary[] = [];
      let scopeWorkload = 0;
      let scopePrice = 0;

      const sortedProducts = [...products].sort(
        (a: Product, b: Product) => (a.order ?? 0) - (b.order ?? 0),
      );

      for (const product of sortedProducts) {
        const productClusters = clusters
          .filter((c: Cluster) => c.productId === product.id)
          .sort((a: Cluster, b: Cluster) => (a.order ?? 0) - (b.order ?? 0));

        const clusterSummaries: ClusterSummary[] = [];
        let productWorkload = 0;
        let productPrice = 0;

        for (const cluster of productClusters) {
          const clusterItems = scopeItems.filter((i: BacklogItem) => i.clusterId === cluster.id);
          let clusterWorkload = 0;
          let clusterPrice = 0;

          for (const item of clusterItems) {
            const profile = profiles.find((p) => p.id === item.profileId);
            if (!profile) continue;

            const effort = this.calcService.getItemEffort(item, totalBuildEffort);
            const price = effort * profile.dailyRate;

            clusterWorkload += effort;
            clusterPrice += price;
          }

          if (clusterWorkload > 0) {
            clusterSummaries.push({
              clusterId: cluster.id,
              clusterName: cluster.name,
              workload: clusterWorkload,
              price: clusterPrice,
              cost: 0,
              avgDailyRate: 0,
              avgScr: 0,
              margin: 0,
            });

            productWorkload += clusterWorkload;
            productPrice += clusterPrice;
          }
        }

        if (productWorkload > 0) {
          productSummaries.push({
            productId: product.id,
            productName: product.name,
            clusters: clusterSummaries,
            totalWorkload: productWorkload,
            totalPrice: productPrice,
            totalCost: 0,
            avgDailyRate: 0,
            avgScr: 0,
            margin: 0,
          });

          scopeWorkload += productWorkload;
          scopePrice += productPrice;
        }
      }

      if (productSummaries.length > 0) {
        scopedSummaries.push({
          scope,
          products: productSummaries,
          totalWorkload: scopeWorkload,
          totalPrice: scopePrice,
        });
      }
    }

    return scopedSummaries;
  });

  hierarchySummaryData = computed(() => {
    const items = this.items();
    const products = this.products();
    const clusters = this.clusters();
    const profiles = this.profiles();

    if (!items.length || !products.length || !profiles.length) {
      return { products: [], grandTotal: null };
    }

    const totalBuildEffort = this.calcService.calculateTotalBuildEffort(items);

    const productSummaries: ProductSummary[] = [];
    let grandTotalWorkload = 0;
    let grandTotalPrice = 0;
    let grandTotalCost = 0;

    const sortedProducts = [...products].sort(
      (a: Product, b: Product) => (a.order ?? 0) - (b.order ?? 0),
    );

    for (const product of sortedProducts) {
      const productClusters = clusters
        .filter((c: Cluster) => c.productId === product.id)
        .sort((a: Cluster, b: Cluster) => (a.order ?? 0) - (b.order ?? 0));

      const clusterSummaries: ClusterSummary[] = [];
      let productWorkload = 0;
      let productPrice = 0;
      let productCost = 0;

      for (const cluster of productClusters) {
        const clusterItems = items.filter((i: BacklogItem) => i.clusterId === cluster.id);
        let clusterWorkload = 0;
        let clusterPrice = 0;
        let clusterCost = 0;

        for (const item of clusterItems) {
          const profile = profiles.find((p) => p.id === item.profileId);
          if (!profile) continue;

          const effort = this.calcService.getItemEffort(item, totalBuildEffort);
          const price = effort * profile.dailyRate;
          const cost = effort * (profile.scr || 0);

          clusterWorkload += effort;
          clusterPrice += price;
          clusterCost += cost;
        }

        if (clusterWorkload > 0) {
          clusterSummaries.push({
            clusterId: cluster.id,
            clusterName: cluster.name,
            workload: clusterWorkload,
            price: clusterPrice,
            cost: clusterCost,
            avgDailyRate: clusterWorkload > 0 ? clusterPrice / clusterWorkload : 0,
            avgScr: clusterWorkload > 0 ? clusterCost / clusterWorkload : 0,
            margin: clusterPrice > 0 ? (clusterPrice - clusterCost) / clusterPrice : 0,
          });

          productWorkload += clusterWorkload;
          productPrice += clusterPrice;
          productCost += clusterCost;
        }
      }

      if (productWorkload > 0) {
        productSummaries.push({
          productId: product.id,
          productName: product.name,
          clusters: clusterSummaries,
          totalWorkload: productWorkload,
          totalPrice: productPrice,
          totalCost: productCost,
          avgDailyRate: productWorkload > 0 ? productPrice / productWorkload : 0,
          avgScr: productWorkload > 0 ? productCost / productWorkload : 0,
          margin: productPrice > 0 ? (productPrice - productCost) / productPrice : 0,
        });

        grandTotalWorkload += productWorkload;
        grandTotalPrice += productPrice;
        grandTotalCost += productCost;
      }
    }

    return {
      products: productSummaries,
      grandTotal: {
        totalWorkload: grandTotalWorkload,
        totalPrice: grandTotalPrice,
        totalCost: grandTotalCost,
        avgDailyRate: grandTotalWorkload > 0 ? grandTotalPrice / grandTotalWorkload : 0,
        avgScr: grandTotalWorkload > 0 ? grandTotalCost / grandTotalWorkload : 0,
        margin: grandTotalPrice > 0 ? (grandTotalPrice - grandTotalCost) / grandTotalPrice : 0,
      },
    };
  });
}
