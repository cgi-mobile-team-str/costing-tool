import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BacklogItem, Profile } from '../../core/models/domain.model';
import { CalculationService } from '../../core/services/calculation.service';
import { IdService } from '../../core/services/id.service';
import { BacklogRepository } from '../../data/backlog.repository';
import { ProfilesRepository } from '../../data/profiles.repository';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-backlog-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslatePipe],
  template: `
    <div class="backlog-container">
      <div class="header">
        <h2>{{ 'nav.backlog' | translate }}</h2>
        <a routerLink="/backlog/new" class="btn btn-primary">{{ 'common.add' | translate }}</a>
      </div>

      <!-- Filters -->
      <div class="filters">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          placeholder="Search..."
          class="form-control search"
        />
        <select [(ngModel)]="scopeFilter" class="form-control">
          <option value="">All Scopes</option>
          <option value="MVP">MVP</option>
          <option value="V1">V1</option>
          <option value="V2">V2</option>
        </select>
        <select [(ngModel)]="profileFilter" class="form-control">
          <option value="">All Profiles</option>
          @for (p of profiles; track p.id) {
          <option [value]="p.id">{{ p.name }}</option>
          }
        </select>
      </div>

      <!-- One table per product -->
      @for (prodGroup of groupedItems(); track prodGroup.product) {
      <div class="product-section">
        <h3 class="product-title" (click)="toggleProduct(prodGroup.product)">
          <span class="chevron" [class.expanded]="isProductExpanded(prodGroup.product)">▶</span>
          <span class="product-name">{{ prodGroup.product }}</span>
          <span class="product-cost">{{ getProductTotal(prodGroup) | currency : 'EUR' }}</span>
        </h3>
        @if (isProductExpanded(prodGroup.product)) {
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th width="40"><input type="checkbox" (change)="toggleAll($event)" /></th>
                <th>{{ 'backlog.title' | translate }}</th>
                <th>{{ 'backlog.description' | translate }}</th>
                <th>{{ 'backlog.hypotheses' | translate }}</th>
                <th>{{ 'backlog.comments' | translate }}</th>
                <th>{{ 'backlog.moscow' | translate }}</th>
                <th>{{ 'backlog.scope' | translate }}</th>
                <th>{{ 'backlog.profile' | translate }}</th>
                <th>{{ 'backlog.chargeType' | translate }}</th>
                <th>{{ 'backlog.effort' | translate }}</th>
                <th>{{ 'backlog.cost' | translate }} (HT)</th>
                <th>{{ 'common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (clusterGroup of prodGroup.clusters; track clusterGroup.cluster) {
              <tr class="cluster-header">
                <td colspan="12">{{ clusterGroup.cluster }}</td>
              </tr>
              @for (item of clusterGroup.items; track item.id) {
              <tr>
                <td>
                  <input
                    type="checkbox"
                    [checked]="isSelected(item.id)"
                    (change)="toggleSelection(item.id)"
                  />
                </td>
                <td style="width: 300px;">
                  <strong style="padding-left: 1rem; font-size: 0.8125rem;">{{
                    item.title
                  }}</strong>
                </td>
                <td class="text-small">{{ item.description || '-' }}</td>
                <td class="text-small">{{ item.hypotheses || '-' }}</td>
                <td class="text-small">{{ item.comments || '-' }}</td>
                <td>
                  <span class="badge moscow">{{ item.moscow || '-' }}</span>
                </td>
                <td>
                  <span class="badge" [class]="item.scope">{{ item.scope }}</span>
                </td>
                <td>{{ getProfileName(item.profileId) }}</td>
                <td>{{ item.chargeType === 'ratio' ? 'Ratio' : 'Jours' }}</td>
                <td>{{ item.effortDays }}{{ item.chargeType === 'ratio' ? '%' : 'j' }}</td>
                <td>{{ getItemCost(item) | currency : 'EUR' }}</td>
                <td class="actions">
                  <a [routerLink]="['/backlog', item.id]" class="btn-icon" title="Edit">
                    <img
                      src="/assets/pen-to-square-regular-full.svg"
                      alt="Edit"
                      width="20"
                      height="20"
                    />
                  </a>
                  <button (click)="duplicate(item)" class="btn-icon" title="Duplicate">
                    <img src="/assets/copy-regular-full.svg" alt="Copy" width="20" height="20" />
                  </button>
                </td>
              </tr>
              }
              <!-- Cluster Total -->
              <tr class="cluster-total">
                <td colspan="10" style="text-align: right; font-weight: 600;">
                  Total {{ clusterGroup.cluster }}:
                </td>
                <td style="font-weight: 600;">
                  {{ getClusterTotal(clusterGroup.items) | currency : 'EUR' }}
                </td>
                <td></td>
              </tr>
              }
            </tbody>
          </table>
        </div>
        }
      </div>
      } @if (groupedItems().length === 0) {
      <div class="empty-state">
        <p>No items found.</p>
      </div>
      } @if (selectedIds().length > 0) {
      <div class="bulk-actions">
        <span>{{ selectedIds().length }} selected</span>
        <button (click)="deleteSelected()" class="btn btn-danger btn-sm">Delete Selected</button>
      </div>
      }
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
      .filters {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
      }
      .search {
        flex: 2;
      }
      .form-control {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--card);
        color: var(--foreground);
        font-size: 0.875rem;
      }
      .form-control:focus {
        outline: none;
        border-color: var(--ring);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      .table-container {
        overflow: hidden;
        border-radius: var(--radius);
        border: 1px solid var(--border);
        background: var(--card);
      }
      table {
        width: auto;
        min-width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }
      th,
      td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid var(--border);
        vertical-align: middle;
      }
      th {
        background: var(--muted);
        font-weight: 600;
        color: var(--muted-foreground);
        white-space: nowrap;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      tbody tr {
        transition: background-color 0.15s ease;
      }
      tbody tr:hover {
        background: var(--muted);
      }
      tbody tr:last-child td {
        border-bottom: none;
      }
      .product-section {
        margin-bottom: 2rem;
      }
      .product-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
        margin-bottom: 1rem;
        padding: 0.75rem 1rem;
        background: #3f3f46;
        border-radius: var(--radius);
        cursor: pointer;
        user-select: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        transition: background-color 0.15s ease;
      }
      .product-title:hover {
        background: #52525b;
      }
      .product-name {
        flex: 1;
      }
      .product-cost {
        font-size: 1.125rem;
        font-weight: 700;
        margin-left: auto;
      }
      .chevron {
        font-size: 0.875rem;
        transition: transform 0.2s ease;
        display: inline-block;
      }
      .chevron.expanded {
        transform: rotate(90deg);
      }
      .cluster-header td {
        background: #e5e7eb;
        font-weight: 600;
        color: #374151;
        font-size: 0.9375rem;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border);
      }
      .cluster-total td {
        background: #f3f4f6;
        font-weight: 600;
        color: #374151;
        padding: 0.75rem 1rem;
        border-top: 2px solid var(--border);
      }
      .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--muted-foreground);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.625rem;
        border-radius: calc(var(--radius) - 2px);
        font-size: 0.75rem;
        font-weight: 600;
        white-space: nowrap;
      }
      .badge.MVP {
        background: #dcfce7;
        color: #166534;
      }
      .badge.V1 {
        background: #fef3c7;
        color: #92400e;
      }
      .badge.V2 {
        background: #dbeafe;
        color: #1e40af;
      }
      .badge.moscow {
        background: var(--muted);
        color: var(--muted-foreground);
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
      }
      .btn-primary {
        background: #e31937;
        color: var(--accent-foreground);
      }
      .btn-primary:hover {
        background: #c41530;
      }
      .btn-danger {
        background: #ef4444;
        color: white;
      }
      .btn-danger:hover {
        background: #dc2626;
      }
      .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.8125rem;
      }
      .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.1rem;
        margin-right: 0.5rem;
      }
      .bulk-actions {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: var(--primary);
        color: var(--primary-foreground);
        padding: 0.875rem 1.5rem;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        font-size: 0.875rem;
      }
      .empty {
        text-align: center;
        color: var(--muted-foreground);
        font-style: italic;
        padding: 3rem 1rem;
      }
      .text-small {
        font-size: 0.8125rem;
        max-width: 600px;
        min-width: 250px;
        white-space: pre-line;
        word-wrap: break-word;
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

  selectedIds = signal<string[]>([]);
  collapsedProducts = signal<Set<string>>(new Set());

  constructor() {
    this.profiles = this.profilesRepo.getAll();
    this.refresh();
  }

  refresh() {
    this.items.set(this.repo.getAll());
    this.selectedIds.set([]);
  }

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

  getClusterTotal(items: BacklogItem[]): number {
    return items.reduce((sum, item) => sum + this.getItemCost(item), 0);
  }

  getProductTotal(prodGroup: any): number {
    return prodGroup.clusters.reduce((sum: number, cluster: any) => {
      return sum + this.getClusterTotal(cluster.items);
    }, 0);
  }

  // Nested Grouping logic: Product -> Cluster -> Items
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

    const result = [];

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

  getProfileName(id: string): string {
    return this.profiles.find((p) => p.id === id)?.name || 'Unknown';
  }

  getItemCost(item: BacklogItem): number {
    const p = this.profiles.find((x) => x.id === item.profileId);
    return p ? this.calc.calculateItemCost(item.effortDays, p.dailyRate) : 0;
  }

  // Bulk Actions
  toggleAll(e: any) {
    if (e.target.checked) {
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

  isSelected(id: string) {
    return this.selectedIds().includes(id);
  }

  deleteSelected() {
    if (confirm(`Delete ${this.selectedIds().length} items?`)) {
      this.selectedIds().forEach((id) => this.repo.delete(id));
      this.refresh();
    }
  }

  duplicate(item: BacklogItem) {
    const newItem = { ...item, id: this.idService.generate(), title: item.title + ' (Copy)' };
    this.repo.save(newItem);
    this.refresh();
  }
}
