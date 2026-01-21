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
import { ClustersRepository } from '../../data/clusters.repository';
import { ProductsRepository } from '../../data/products.repository';
import { ProfilesRepository } from '../../data/profiles.repository';
import { SettingsRepository } from '../../data/settings.repository';
import { ZardAlertDialogService } from '../../shared/components/alert-dialog/alert-dialog.service';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardDropdownService } from '../../shared/components/dropdown/dropdown.service';
import { ZardIconComponent } from '../../shared/components/icon/icon.component';
import { ZardSheetService } from '../../shared/components/sheet/sheet.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { BacklogFiltersComponent } from './backlog-filters.component';
import { BacklogFormComponent } from './backlog-form.component';
import { BacklogProductSectionComponent, ProductGroup } from './backlog-product-section.component';
import { BulkActionsToastComponent } from './bulk-actions-toast.component';
import { ColumnSelectorComponent } from './column-selector.component';

@Component({
  selector: 'app-backlog-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    BacklogFiltersComponent,
    BacklogProductSectionComponent,
    BulkActionsToastComponent,
    ColumnSelectorComponent,
    ZardButtonComponent,
    ZardIconComponent,
  ],
  templateUrl: './backlog-list.component.html',
  styleUrls: ['./backlog-list.component.css'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BacklogListComponent {
  private repo = inject(BacklogRepository);
  private productsRepo = inject(ProductsRepository);
  private clustersRepo = inject(ClustersRepository);
  private profilesRepo = inject(ProfilesRepository);
  private settingsRepo = inject(SettingsRepository);
  private calc = inject(CalculationService);
  private idService = inject(IdService);
  private sheetService = inject(ZardSheetService);
  private dropdownService = inject(ZardDropdownService);
  private alertDialogService = inject(ZardAlertDialogService);
  i18n = inject(I18nService);

  items = signal<BacklogItem[]>([]);
  settings = signal(this.settingsRepo.get());
  profiles: Profile[] = [];

  // Filters
  searchTerm = signal('');
  scopeFilter = signal('');
  profileFilter = signal<string[]>([]);

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

  getProductEffort(prodGroup: ProductGroup): number {
    return prodGroup.clusters.reduce((sum: number, cluster: any) => {
      return (
        sum +
        cluster.items.reduce((itemSum: number, item: BacklogItem) => {
          return itemSum + (item.effortDays || 0);
        }, 0)
      );
    }, 0);
  }

  // Grouping logic
  groupedItems = computed(() => {
    let res = this.items();
    const allProducts = this.productsRepo.getAll();
    const allClusters = this.clustersRepo.getAll();

    // Filtering
    const term = this.searchTerm().toLowerCase();
    const scope = this.scopeFilter();
    const profiles = this.profileFilter();

    if (term) {
      res = res.filter((i) => i.title.toLowerCase().includes(term));
    }
    if (scope) {
      res = res.filter((i) => i.scope === scope);
    }
    if (profiles.length > 0) {
      res = res.filter((i) => profiles.includes(i.profileId));
    }

    // Grouping
    // We group by Product ID now
    const productMap = new Map<string, BacklogItem[]>();
    // Handle items with no product ID (legacy or error) - maybe group under "Unknown"

    res.forEach((item) => {
      const pid = item.productId || 'unknown';
      if (!productMap.has(pid)) {
        productMap.set(pid, []);
      }
      productMap.get(pid)!.push(item);
    });

    const result: ProductGroup[] = [];

    // Sort products by name
    const sortedProductIds = Array.from(productMap.keys()).sort((a, b) => {
      const nameA = allProducts.find((p) => p.id === a)?.name || 'Unknown';
      const nameB = allProducts.find((p) => p.id === b)?.name || 'Unknown';
      return nameA.localeCompare(nameB);
    });

    for (const pid of sortedProductIds) {
      const prodItems = productMap.get(pid)!;
      const productName = allProducts.find((p) => p.id === pid)?.name || 'Unknown Product';

      // Group by Cluster ID
      const clusterMap = new Map<string, BacklogItem[]>();
      prodItems.forEach((item) => {
        const cid = item.clusterId || 'unknown';
        if (!clusterMap.has(cid)) {
          clusterMap.set(cid, []);
        }
        clusterMap.get(cid)!.push(item);
      });

      const sortedClusterIds = Array.from(clusterMap.keys()).sort((a, b) => {
        const nameA = allClusters.find((c) => c.id === a)?.name || 'General';
        const nameB = allClusters.find((c) => c.id === b)?.name || 'General';
        return nameA.localeCompare(nameB);
      });

      const clusterGroups = [];
      for (const cid of sortedClusterIds) {
        const clusterName = allClusters.find((c) => c.id === cid)?.name || 'General';
        clusterGroups.push({
          clusterId: cid,
          cluster: clusterName,
          items: clusterMap.get(cid)!, // items are already filtered by product and cluster
        });
      }

      result.push({
        productId: pid,
        product: productName,
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
    this.dropdownService.close(); // Keep close to be safe, though alert manages focus
    this.alertDialogService.confirm({
      zTitle: this.i18n.translate('common.delete_selected'),
      zDescription: this.i18n
        .translate('common.confirm_bulk_delete_with_count')
        .replace('{count}', this.selectedIds().length.toString()),
      zOkText: this.i18n.translate('common.delete'),
      zOkDestructive: true,
      zOnOk: () => {
        this.selectedIds().forEach((id) => this.repo.delete(id));
        this.refresh();
      },
    });
  }

  // Item actions
  duplicate(item: BacklogItem) {
    const newItem = { ...item, id: this.idService.generate(), title: item.title + ' (Copy)' };
    this.repo.save(newItem);
    this.refresh();
  }

  delete(item: BacklogItem) {
    this.dropdownService.close();
    this.alertDialogService.confirm({
      zTitle: this.i18n.translate('backlog.delete_title') || 'Delete Item',
      zDescription: this.i18n.translate('backlog.delete_confirm'),
      zOkText: this.i18n.translate('common.delete'),
      zOkDestructive: true,
      zOnOk: () => {
        this.repo.delete(item.id);
        this.refresh();
      },
    });
  }

  openBacklogSheet(item?: BacklogItem, defaults?: { productId: string; clusterId: string }) {
    this.sheetService.create({
      zTitle: item
        ? this.i18n.translate('backlog.edit_title')
        : this.i18n.translate('backlog.create_title'),
      zDescription: item ? item.title : this.i18n.translate('backlog.create_desc'),
      zContent: BacklogFormComponent,
      zData: item || defaults,
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

  openAddItemWithDefaults(defaults: { productId: string; clusterId: string }) {
    this.openBacklogSheet(undefined, defaults);
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

  onMoveItemUp(item: BacklogItem) {
    const allItems = this.repo.getAll();
    const index = allItems.findIndex((i) => i.id === item.id);
    if (index <= 0) return;

    // Find the previous item *in the same group* (fragmented list support)
    let prevIndex = -1;
    for (let i = index - 1; i >= 0; i--) {
      if (allItems[i].productId === item.productId && allItems[i].clusterId === item.clusterId) {
        prevIndex = i;
        break;
      }
    }

    if (prevIndex !== -1) {
      const newItems = [...allItems];
      // Swap
      newItems[index] = newItems[prevIndex];
      newItems[prevIndex] = item;

      this.repo.saveBulk(newItems);
      this.refresh();
    }
  }

  onMoveItemDown(item: BacklogItem) {
    const allItems = this.repo.getAll();
    const index = allItems.findIndex((i) => i.id === item.id);
    if (index === -1 || index >= allItems.length - 1) return;

    // Find the next item *in the same group*
    let nextIndex = -1;
    for (let i = index + 1; i < allItems.length; i++) {
      if (allItems[i].productId === item.productId && allItems[i].clusterId === item.clusterId) {
        nextIndex = i;
        break;
      }
    }

    if (nextIndex !== -1) {
      const newItems = [...allItems];
      // Swap
      newItems[index] = newItems[nextIndex];
      newItems[nextIndex] = item;

      this.repo.saveBulk(newItems);
      this.refresh();
    }
  }

  onRenameProduct(event: { productId: string; newName: string }) {
    console.log('BacklogList: onRenameProduct', event);
    const product = this.productsRepo.get(event.productId);
    console.log('Found product:', product);
    if (product) {
      product.name = event.newName;
      this.productsRepo.save(product);
      this.refresh();
      console.log('Product saved');
    }
  }

  onRenameCluster(event: { clusterId: string; newName: string }) {
    const cluster = this.clustersRepo.get(event.clusterId);
    if (cluster) {
      cluster.name = event.newName;
      this.clustersRepo.save(cluster);
      this.refresh();
    }
  }
}
