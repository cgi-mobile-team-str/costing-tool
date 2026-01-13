import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BacklogItem, Profile } from '../../core/models/domain.model';
import { CalculationService } from '../../core/services/calculation.service';
import { IdService } from '../../core/services/id.service';
import { BacklogRepository } from '../../data/backlog.repository';
import { ProfilesRepository } from '../../data/profiles.repository';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { BacklogFiltersComponent } from './backlog-filters.component';
import { BacklogProductSectionComponent, ProductGroup } from './backlog-product-section.component';
import { BulkActionsComponent } from './bulk-actions.component';

@Component({
  selector: 'app-backlog-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslatePipe,
    BacklogFiltersComponent,
    BacklogProductSectionComponent,
    BulkActionsComponent,
  ],
  template: `
    <div class="backlog-container">
      <div class="header">
        <h2>{{ 'nav.backlog' | translate }}</h2>
        <a routerLink="/backlog/new" class="btn btn-primary"
          ><svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            style="margin-right: 0.5rem"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line></svg
          >{{ 'common.add' | translate }}</a
        >
      </div>

      <app-backlog-filters
        [profiles]="profiles"
        [searchTerm]="searchTerm"
        [scopeFilter]="scopeFilter"
        [profileFilter]="profileFilter"
        (searchTermChange)="searchTerm = $event"
        (scopeFilterChange)="scopeFilter = $event"
        (profileFilterChange)="profileFilter = $event"
      />

      @for (prodGroup of groupedItems(); track prodGroup.product) {
      <app-backlog-product-section
        [productGroup]="prodGroup"
        [profiles]="profiles"
        [isExpanded]="isProductExpanded(prodGroup.product)"
        [selectedIds]="selectedIds()"
        [editingCell]="editingCell()"
        [productTotal]="getProductTotal(prodGroup)"
        [getItemCost]="getItemCost.bind(this)"
        (toggleExpand)="toggleProduct($event)"
        (toggleAll)="toggleAll($event)"
        (selectionToggle)="toggleSelection($event)"
        (editStart)="startEdit($event.itemId, $event.field)"
        (editSave)="saveEdit($event)"
        (editCancel)="cancelEdit()"
        (duplicateItem)="duplicate($event)"
      />
      } @if (groupedItems().length === 0) {
      <div class="empty-state">
        <p>No items found.</p>
      </div>
      }

      <app-bulk-actions
        [selectedCount]="selectedIds().length"
        (deleteSelected)="deleteSelected()"
      />
    </div>
  `,
  styles: [
    `
      .backlog-container {
        width: 100%;
        max-width: 100%;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .header h2 {
        font-size: 1.875rem;
        font-weight: 700;
        color: var(--foreground);
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
      /* Button styles inherited from global */
      .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--muted-foreground);
      }
    `,
  ],
})
export class BacklogListComponent {
  private repo = inject(BacklogRepository);
  private profilesRepo = inject(ProfilesRepository);
  private calc = inject(CalculationService);
  private idService = inject(IdService);

  items = signal<BacklogItem[]>([]);
  profiles: Profile[] = [];

  // Filters
  searchTerm = '';
  scopeFilter = '';
  profileFilter = '';

  // State
  selectedIds = signal<string[]>([]);
  collapsedProducts = signal<Set<string>>(new Set());
  editingCell = signal<{ itemId: string; field: string } | null>(null);
  private originalItem: BacklogItem | null = null;

  constructor() {
    this.profiles = this.profilesRepo.getAll();
    this.refresh();

    // Auto-focus input when editing starts
    effect(() => {
      const editing = this.editingCell();
      if (editing) {
        setTimeout(() => {
          const input = document.querySelector('.inline-edit, .inline-edit-select') as HTMLElement;
          if (input) {
            input.focus();
          }
        }, 0);
      }
    });
  }

  refresh() {
    this.items.set(this.repo.getAll());
    this.selectedIds.set([]);
  }

  // Product section management
  toggleProduct(productName: string) {
    const collapsed = this.collapsedProducts();
    const newSet = new Set(collapsed);
    if (newSet.has(productName)) {
      newSet.delete(productName);
    } else {
      newSet.add(productName);
    }
    this.collapsedProducts.set(newSet);
  }

  isProductExpanded(productName: string): boolean {
    return !this.collapsedProducts().has(productName);
  }

  // Calculations
  getItemCost(item: BacklogItem): number {
    const p = this.profiles.find((x) => x.id === item.profileId);
    return p ? this.calc.calculateItemCost(item.effortDays, p.dailyRate) : 0;
  }

  getClusterTotal(items: BacklogItem[]): number {
    return items.reduce((sum, item) => sum + this.getItemCost(item), 0);
  }

  getProductTotal(prodGroup: ProductGroup): number {
    return prodGroup.clusters.reduce((sum: number, cluster: any) => {
      return sum + this.getClusterTotal(cluster.items);
    }, 0);
  }

  // Grouping logic
  groupedItems = computed(() => {
    let res = this.items();

    // Filtering
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      res = res.filter((i) => i.title.toLowerCase().includes(term));
    }
    if (this.scopeFilter) {
      res = res.filter((i) => i.scope === this.scopeFilter);
    }
    if (this.profileFilter) {
      res = res.filter((i) => i.profileId === this.profileFilter);
    }

    // Grouping
    const products = new Set(res.map((i) => i.product || 'Other Products'));
    const sortedProducts = Array.from(products).sort();

    const result: ProductGroup[] = [];

    for (const prod of sortedProducts) {
      const prodItems = res.filter((i) => (i.product || 'Other Products') === prod);
      const clusters = new Set(prodItems.map((i) => i.cluster || 'General'));
      const sortedClusters = Array.from(clusters).sort();

      const clusterGroups = [];
      for (const clust of sortedClusters) {
        clusterGroups.push({
          cluster: clust,
          items: prodItems.filter((i) => (i.cluster || 'General') === clust),
        });
      }

      result.push({
        product: prod,
        clusters: clusterGroups,
      });
    }

    return result;
  });

  // Bulk selection
  toggleAll(checked: boolean) {
    if (checked) {
      const allIds = this.groupedItems().flatMap((p) =>
        p.clusters.flatMap((c) => c.items.map((i) => i.id))
      );
      this.selectedIds.set(allIds);
    } else {
      this.selectedIds.set([]);
    }
  }

  toggleSelection(id: string) {
    const current = this.selectedIds();
    if (current.includes(id)) {
      this.selectedIds.set(current.filter((x) => x !== id));
    } else {
      this.selectedIds.set([...current, id]);
    }
  }

  deleteSelected() {
    if (confirm(`Delete ${this.selectedIds().length} items?`)) {
      this.selectedIds().forEach((id) => this.repo.delete(id));
      this.refresh();
    }
  }

  // Item actions
  duplicate(item: BacklogItem) {
    const newItem = { ...item, id: this.idService.generate(), title: item.title + ' (Copy)' };
    this.repo.save(newItem);
    this.refresh();
  }

  // Inline editing
  startEdit(itemId: string, field: string) {
    const item = this.items().find((i) => i.id === itemId);
    if (item) {
      this.originalItem = { ...item };
    }
    this.editingCell.set({ itemId, field });
  }

  saveEdit(item: BacklogItem) {
    this.repo.save(item);
    this.editingCell.set(null);
    this.originalItem = null;
    this.refresh();
  }

  cancelEdit() {
    if (this.originalItem) {
      this.repo.save(this.originalItem);
      this.originalItem = null;
    }
    this.editingCell.set(null);
    this.refresh();
  }
}
