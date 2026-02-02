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
import { firstValueFrom } from 'rxjs';
import { BacklogItem, Profile } from '../../core/models/domain.model';
import { BacklogService } from '../../core/services/backlog.service';
import { CalculationService } from '../../core/services/calculation.service';
import { I18nService } from '../../core/services/i18n.service';
import { IdService } from '../../core/services/id.service';
import { ProjectsService } from '../../core/services/projects.service';
import { ToastService } from '../../core/services/toast.service';
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
import { BacklogBulkUpdateFormComponent } from './backlog-bulk-update-form.component';
import { BacklogFiltersComponent } from './backlog-filters.component';
import { BacklogFormComponent } from './backlog-form.component';
import { BacklogManagementComponent } from './backlog-management.component';
import { BacklogProductSectionComponent, ProductGroup } from './backlog-product-section.component';
import { ClusterGroup } from './backlog-table.component';
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
  private projectsService = inject(ProjectsService);
  private backlogService = inject(BacklogService);
  i18n = inject(I18nService);
  private toastService = inject(ToastService);

  // items = signal<BacklogItem[]>([]); // Replaced by repo signal
  items = this.repo.items;
  settings = signal(this.settingsRepo.get());
  currentProjectName = this.projectsService.currentProjectName;
  profiles = signal<Profile[]>([]);

  // Filters
  searchTerm = signal('');
  scopeFilter = signal('');
  profileFilter = signal<string[]>([]);

  // State
  selectedIds = signal<string[]>([]);
  collapsedProducts = signal<Set<string>>(new Set());
  allClustersExpanded = signal(true);
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
    effect(
      () => {
        // React to project change
        const projectId = this.projectsService.currentProjectId();
        if (projectId) {
          this.refresh();
        }
      },
      { allowSignalWrites: true },
    );

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

  totalBuildEffort = computed(() => {
    return this.calc.calculateTotalBuildEffort(this.items());
  });

  refresh() {
    const projectId = this.projectsService.currentProjectId();
    if (projectId) {
      this.backlogService.loadProjectData(projectId).subscribe(() => {
        // this.items.set(this.repo.getAll()); // Handled by signal connection
        this.selectedIds.set([]);

        this.profilesRepo.getAll(projectId).subscribe((p) => {
          this.profiles.set(p);
        });
      });
    }
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
    const p = this.profiles().find((x) => x.id === item.profileId);
    if (!p) return 0;
    return this.calc.getItemCost(item, this.totalBuildEffort(), p.dailyRate);
  }

  getItemEffort(item: BacklogItem): number {
    return this.calc.getItemEffort(item, this.totalBuildEffort());
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
          return itemSum + this.calc.getItemEffort(item, this.totalBuildEffort());
        }, 0)
      );
    }, 0);
  }

  // Grouping logic
  groupedItems = computed(() => {
    let res = this.items();
    const allProducts = this.productsRepo.getAll();
    const allClusters = this.clustersRepo.getAll();
    const sortedItems = [...res].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Filtering
    const term = this.searchTerm().toLowerCase();
    const scope = this.scopeFilter();
    const profiles = this.profileFilter();

    let itemsToProcess = sortedItems;

    if (term) {
      itemsToProcess = itemsToProcess.filter((i) => i.title.toLowerCase().includes(term));
    }
    if (scope) {
      itemsToProcess = itemsToProcess.filter((i) => i.scope === scope);
    }
    if (profiles.length > 0) {
      itemsToProcess = itemsToProcess.filter((i) => profiles.includes(i.profileId));
    }

    // Grouping
    // We group by Product ID now
    const productMap = new Map<string, BacklogItem[]>();
    // Handle items with no product ID (legacy or error) - maybe group under "Unknown"

    itemsToProcess.forEach((item) => {
      const pid = item.productId || 'unknown';
      if (!productMap.has(pid)) {
        productMap.set(pid, []);
      }
      productMap.get(pid)!.push(item);
    });

    const result: ProductGroup[] = [];

    // Sort products by order
    const sortedProductIds = Array.from(productMap.keys()).sort((a, b) => {
      const prodA = allProducts.find((p) => p.id === a);
      const prodB = allProducts.find((p) => p.id === b);
      return (prodA?.order ?? 0) - (prodB?.order ?? 0);
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
        const clusterA = allClusters.find((c) => c.id === a);
        const clusterB = allClusters.find((c) => c.id === b);
        return (clusterA?.order ?? 0) - (clusterB?.order ?? 0);
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

  toggleAllExpand() {
    const newVal = !this.allClustersExpanded();
    this.allClustersExpanded.set(newVal);

    if (newVal) {
      // Expand all: clear collapsed products
      this.collapsedProducts.set(new Set());
    } else {
      // Collapse all: add all product IDs to collapsedProducts
      const allProductIds = this.groupedItems().map((g) => g.product);
      this.collapsedProducts.set(new Set(allProductIds));
    }
  }

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

  toggleAllCluster(checked: boolean, clusterGroup: ClusterGroup) {
    const current = new Set(this.selectedIds());
    const itemIds = clusterGroup.items.map((i: BacklogItem) => i.id);

    if (checked) {
      itemIds.forEach((id: string) => current.add(id));
    } else {
      itemIds.forEach((id: string) => current.delete(id));
    }
    this.selectedIds.set(Array.from(current));
  }

  toggleSelection(id: string) {
    const current = this.selectedIds();
    if (current.includes(id)) {
      this.selectedIds.set(current.filter((x: string) => x !== id));
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
      zOnOk: async () => {
        const deletePromises = this.selectedIds().map((id) => firstValueFrom(this.repo.delete(id)));
        await Promise.all(deletePromises);
        this.refresh();
      },
    });
  }

  editSelected() {
    this.sheetService.create({
      zTitle: 'Modification en masse',
      zDescription: `Mettre à jour ${this.selectedIds().length} éléments sélectionnés`,
      zContent: BacklogBulkUpdateFormComponent,
      zOkText: this.i18n.translate('common.save'),
      zCancelText: this.i18n.translate('common.cancel'),
      zWidth: '500px',
      zOnOk: async (instance: BacklogBulkUpdateFormComponent) => {
        const updates = instance.getUpdates();
        if (Object.keys(updates).length === 0) return true;

        const currentItems = this.repo.getAll();
        const itemsToUpdate = currentItems.filter((i) => this.selectedIds().includes(i.id));

        const updatePromises = itemsToUpdate.map((item) => {
          const updatedItem = { ...item, ...updates };
          return firstValueFrom(this.repo.save(updatedItem));
        });

        await Promise.all(updatePromises);
        this.refresh();
        return true;
      },
    });
  }

  // Item actions
  async duplicate(item: BacklogItem) {
    const { order, id, ...rest } = item;
    const newItem = {
      ...rest,
      id: `item-${this.idService.generate()}`,
      title: item.title + ' (Copy)',
    };
    await firstValueFrom(this.repo.save(newItem as BacklogItem));
    this.refresh();
  }

  delete(item: BacklogItem) {
    this.dropdownService.close();
    this.alertDialogService.confirm({
      zTitle: this.i18n.translate('backlog.delete_title') || 'Delete Item',
      zDescription: this.i18n.translate('backlog.delete_confirm'),
      zOkText: this.i18n.translate('common.delete'),
      zOkDestructive: true,
      zOnOk: async () => {
        await firstValueFrom(this.repo.delete(item.id));
        this.refresh();
      },
    });
  }

  openBacklogSheet(item?: BacklogItem, defaults?: { productId: string; clusterId: string }) {
    if (!item && this.profiles().length === 0) {
      this.toastService.warning(this.i18n.translate('profiles.empty_title') || 'No profiles found');
      return;
    }
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

  openManagementSheet() {
    this.sheetService.create({
      zTitle: this.i18n.translate('management.title'),
      zDescription: this.i18n.translate('management.desc'),
      zContent: BacklogManagementComponent,
      zWidth: '600px',
      zOnOk: () => {
        this.refresh();
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

  async saveEdit(item: BacklogItem) {
    await firstValueFrom(this.repo.save(item));
    this.editingCell.set(null);
    this.originalItem = null;
    this.refresh();
  }

  async cancelEdit() {
    if (this.originalItem) {
      await firstValueFrom(this.repo.save(this.originalItem));
      this.originalItem = null;
    }
    this.editingCell.set(null);
    this.refresh();
  }

  async onMoveItemUp(item: BacklogItem) {
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
      const prevItem = allItems[prevIndex];

      // Swap orders
      const tempOrder = item.order ?? 0;
      item.order = prevItem.order ?? 0;
      prevItem.order = tempOrder;

      // Save only the modified items
      await Promise.all([
        firstValueFrom(this.repo.save(item)),
        firstValueFrom(this.repo.save(prevItem)),
      ]);
      this.refresh();
    }
  }

  async onMoveItemDown(item: BacklogItem) {
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
      const nextItem = allItems[nextIndex];

      // Swap orders
      const tempOrder = item.order ?? 0;
      item.order = nextItem.order ?? 0;
      nextItem.order = tempOrder;

      // Save only the modified items
      await Promise.all([
        firstValueFrom(this.repo.save(item)),
        firstValueFrom(this.repo.save(nextItem)),
      ]);
      this.refresh();
    }
  }

  async onRenameProduct(event: { productId: string; newName: string }) {
    const product = this.productsRepo.get(event.productId);
    if (product) {
      product.name = event.newName;
      await firstValueFrom(this.productsRepo.save(product));
      this.refresh();
    }
  }

  async onMoveProductUp(productId: string) {
    const allProducts = this.productsRepo.getAll();
    const index = allProducts.findIndex((p) => p.id === productId);
    if (index <= 0) return;

    const currentProduct = allProducts[index];
    const prevProduct = allProducts[index - 1];

    // Swap orders
    const tempOrder = currentProduct.order;
    currentProduct.order = prevProduct.order;
    prevProduct.order = tempOrder;

    await firstValueFrom(this.productsRepo.saveBulk(allProducts));
    this.refresh();
  }

  async onMoveProductDown(productId: string) {
    const allProducts = this.productsRepo.getAll();
    const index = allProducts.findIndex((p) => p.id === productId);
    if (index === -1 || index >= allProducts.length - 1) return;

    const currentProduct = allProducts[index];
    const nextProduct = allProducts[index + 1];

    // Swap orders
    const tempOrder = currentProduct.order;
    currentProduct.order = nextProduct.order;
    nextProduct.order = tempOrder;

    await firstValueFrom(this.productsRepo.saveBulk(allProducts));
    this.refresh();
  }

  async onRenameCluster(event: { clusterId: string; newName: string }) {
    const cluster = this.clustersRepo.get(event.clusterId);
    if (cluster) {
      cluster.name = event.newName;
      await firstValueFrom(this.clustersRepo.save(cluster));
      this.refresh();
    }
  }

  async onMoveClusterUp(clusterId: string) {
    const cluster = this.clustersRepo.get(clusterId);
    if (!cluster) return;

    const allClusters = this.clustersRepo.getByProductId(cluster.productId);
    const index = allClusters.findIndex((c) => c.id === clusterId);
    if (index <= 0) return;

    const currentCluster = allClusters[index];
    const prevCluster = allClusters[index - 1];

    // Swap orders
    const tempOrder = currentCluster.order;
    currentCluster.order = prevCluster.order;
    prevCluster.order = tempOrder;

    // We need to save all clusters of the product to ensure consistency
    // Simple save of the two modified clusters is enough since they have IDs
    await firstValueFrom(this.clustersRepo.save(currentCluster));
    await firstValueFrom(this.clustersRepo.save(prevCluster));
    this.refresh();
  }

  async onMoveClusterDown(clusterId: string) {
    const cluster = this.clustersRepo.get(clusterId);
    if (!cluster) return;

    const allClusters = this.clustersRepo.getByProductId(cluster.productId);
    const index = allClusters.findIndex((c) => c.id === clusterId);
    if (index === -1 || index >= allClusters.length - 1) return;

    const currentCluster = allClusters[index];
    const nextCluster = allClusters[index + 1];

    // Swap orders
    const tempOrder = currentCluster.order;
    currentCluster.order = nextCluster.order;
    nextCluster.order = tempOrder;

    await firstValueFrom(this.clustersRepo.save(currentCluster));
    await firstValueFrom(this.clustersRepo.save(nextCluster));
    this.refresh();
  }
}
