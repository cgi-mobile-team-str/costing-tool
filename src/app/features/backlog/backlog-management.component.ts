import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { BacklogItem, Cluster, Product } from '../../core/models/domain.model';
import { I18nService } from '../../core/services/i18n.service';
import { BacklogRepository } from '../../data/backlog.repository';
import { ClustersRepository } from '../../data/clusters.repository';
import { ProductsRepository } from '../../data/products.repository';
import { ZardAlertDialogService } from '../../shared/components/alert-dialog/alert-dialog.service';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardIconComponent } from '../../shared/components/icon/icon.component';

import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-backlog-management',
  standalone: true,
  imports: [CommonModule, ZardButtonComponent, ZardIconComponent, TranslatePipe],
  templateUrl: './backlog-management.component.html',
  styleUrls: ['./backlog-management.component.css'],
})
export class BacklogManagementComponent {
  private productsRepo = inject(ProductsRepository);
  private clustersRepo = inject(ClustersRepository);
  private backlogRepo = inject(BacklogRepository);
  private alertDialog = inject(ZardAlertDialogService);
  private i18n = inject(I18nService);

  products = signal<Product[]>([]);
  clusters = signal<Cluster[]>([]);
  items = signal<BacklogItem[]>([]);

  constructor() {
    this.refresh();
  }

  refresh() {
    this.products.set(this.productsRepo.getAll());
    this.clusters.set(this.clustersRepo.getAll());
    this.items.set(this.backlogRepo.getAll());
  }

  getClustersByProduct(productId: string): Cluster[] {
    return this.clusters().filter((c) => c.productId === productId);
  }

  isProductUsed(productId: string): boolean {
    const hasClusters = this.clusters().some((c) => c.productId === productId);
    const hasItems = this.items().some((i) => i.productId === productId);
    return hasClusters || hasItems;
  }

  isClusterUsed(clusterId: string): boolean {
    return this.items().some((i) => i.clusterId === clusterId);
  }

  deleteProduct(product: Product) {
    if (this.isProductUsed(product.id)) {
      this.alertDialog.warning({
        zTitle: this.i18n.translate('management.delete_blocked') || 'Suppression bloquée',
        zDescription:
          this.i18n.translate('management.product_used_desc') ||
          'Ce produit est utilisé et ne peut pas être supprimé.',
        zOkText: 'OK',
      });
      return;
    }

    this.alertDialog.confirm({
      zTitle: this.i18n.translate('management.delete_product') || 'Supprimer le produit',
      zDescription: (
        this.i18n.translate('management.confirm_delete_product') ||
        'Voulez-vous vraiment supprimer le produit {name} ?'
      ).replace('{name}', product.name),
      zOkText: this.i18n.translate('common.delete') || 'Supprimer',
      zOkDestructive: true,
      zOnOk: () => {
        this.productsRepo.delete(product.id);
        this.refresh();
      },
    });
  }

  deleteCluster(cluster: Cluster) {
    if (this.isClusterUsed(cluster.id)) {
      this.alertDialog.warning({
        zTitle: this.i18n.translate('management.delete_blocked') || 'Suppression bloquée',
        zDescription:
          this.i18n.translate('management.cluster_used_desc') ||
          'Ce cluster est utilisé et ne peut pas être supprimé.',
        zOkText: 'OK',
      });
      return;
    }

    this.alertDialog.confirm({
      zTitle: this.i18n.translate('management.delete_cluster') || 'Supprimer le cluster',
      zDescription: (
        this.i18n.translate('management.confirm_delete_cluster') ||
        'Voulez-vous vraiment supprimer le cluster {name} ?'
      ).replace('{name}', cluster.name),
      zOkText: this.i18n.translate('common.delete') || 'Supprimer',
      zOkDestructive: true,
      zOnOk: () => {
        this.clustersRepo.delete(cluster.id);
        this.refresh();
      },
    });
  }
}
