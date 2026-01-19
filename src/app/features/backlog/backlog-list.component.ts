import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { BacklogItem, Profile } from '../../core/models/domain.model';
import { CalculationService } from '../../core/services/calculation.service';
import { I18nService } from '../../core/services/i18n.service';
import { IdService } from '../../core/services/id.service';
import { BacklogRepository } from '../../data/backlog.repository';
import { ProfilesRepository } from '../../data/profiles.repository';
import { SettingsRepository } from '../../data/settings.repository';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardCheckboxComponent } from '../../shared/components/checkbox/checkbox.component';
import { ZardIconComponent } from '../../shared/components/icon/icon.component';
import { ZardSheetService } from '../../shared/components/sheet/sheet.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { BacklogFiltersComponent } from './backlog-filters.component';
import { BacklogFormComponent } from './backlog-form.component';
import { BacklogProductSectionComponent, ProductGroup } from './backlog-product-section.component';
import { BulkActionsComponent } from './bulk-actions.component';

@Component({
  selector: 'app-backlog-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    BacklogFiltersComponent,
    BacklogProductSectionComponent,
    BulkActionsComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardCheckboxComponent,
  ],
  templateUrl: './backlog-list.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BacklogListComponent {
  private repo = inject(BacklogRepository);
  private profilesRepo = inject(ProfilesRepository);
  private settingsRepo = inject(SettingsRepository);
  private calc = inject(CalculationService);
  private idService = inject(IdService);
  private sheetService = inject(ZardSheetService);
  private i18n = inject(I18nService);

  items = signal<BacklogItem[]>([]);
  settings = signal(this.settingsRepo.get());
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
  // Column Visibility
  availableColumns = [
    { id: 'description', label: 'backlog.description' },
    { id: 'hypotheses', label: 'backlog.hypotheses' },
    { id: 'comments', label: 'backlog.comments' },
    { id: 'moscow', label: 'backlog.moscow' },
    { id: 'scope', label: 'backlog.scope' },
    { id: 'profile', label: 'backlog.profile' },
    { id: 'chargeType', label: 'backlog.chargeType' },
    { id: 'effort', label: 'backlog.effort' },
    { id: 'cost', label: 'backlog.cost' },
  ];
  visibleColumns = signal<string[]>([
    'description',
    'moscow',
    'scope',
    'profile',
    'effort',
    'cost',
  ]);

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
  toggleAllProduct(checked: boolean, group: ProductGroup) {
    const current = new Set(this.selectedIds());
    const groupItemIds = group.clusters.flatMap((c) => c.items.map((i) => i.id));

    if (checked) {
      groupItemIds.forEach((id) => current.add(id));
    } else {
      groupItemIds.forEach((id) => current.delete(id));
    }
    this.selectedIds.set(Array.from(current));
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

  openBacklogSheet(item?: BacklogItem) {
    this.sheetService.create({
      zTitle: item
        ? this.i18n.translate('backlog.edit_title')
        : this.i18n.translate('backlog.create_title'),
      zDescription: item ? item.title : this.i18n.translate('backlog.create_desc'),
      zContent: BacklogFormComponent,
      zData: item,
      zOkText: this.i18n.translate('common.save'),
      zCancelText: this.i18n.translate('common.cancel'),
      zWidth: '800px',
      zOnOk: (instance: BacklogFormComponent) => {
        if (instance.save()) {
          this.refresh();
          return;
        }
        return false;
      },
    });
  }

  // Inline editing
  startEdit(itemId: string, field: string) {
    const item = this.items().find((i) => i.id === itemId);
    if (item) {
      this.openBacklogSheet(item);
    }
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

  toggleColumn(columnId: string) {
    const current = this.visibleColumns();
    if (current.includes(columnId)) {
      this.visibleColumns.set(current.filter((c) => c !== columnId));
    } else {
      this.visibleColumns.set([...current, columnId]);
    }
  }

  isColumnVisible(columnId: string): boolean {
    return this.visibleColumns().includes(columnId);
  }
}
