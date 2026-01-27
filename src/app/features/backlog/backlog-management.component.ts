import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Cluster, Product } from '../../core/models/domain.model';
import { I18nService } from '../../core/services/i18n.service';
import { BacklogRepository } from '../../data/backlog.repository';
import { ClustersRepository } from '../../data/clusters.repository';
import { ProductsRepository } from '../../data/products.repository';
import { ZardAlertDialogService } from '../../shared/components/alert-dialog/alert-dialog.service';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardIconComponent } from '../../shared/components/icon/icon.component';

import { ZardDialogService } from '../../shared/components/dialog/dialog.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { RenameDialogComponent, RenameDialogData } from './rename-dialog/rename-dialog.component';

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
  private dialogService = inject(ZardDialogService);
  private i18n = inject(I18nService);

  products = this.productsRepo.items;
  clusters = this.clustersRepo.items;
  items = this.backlogRepo.items;

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
        this.productsRepo.delete(product.id).subscribe();
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
        this.clustersRepo.delete(cluster.id).subscribe();
      },
    });
  }

  async renameProduct(product: Product) {
    const ref = this.dialogService.create({
      zContent: RenameDialogComponent,
      zData: { name: product.name } as RenameDialogData,
      zOkText: this.i18n.translate('common.save') || 'Enregistrer',
      zOnOk: (component: RenameDialogComponent) => {
        if (component.form.valid) {
          return component.form.value;
        }
        return false;
      },
    });

    const res = await firstValueFrom(ref.afterClosed$);
    console.log('Rename Dialog Result:', res);

    if (res && res.name) {
      console.log('Proceeding to save with name:', res.name);
      const updated = { ...product, name: res.name };
      try {
        await firstValueFrom(this.productsRepo.save(updated));
        console.log('Product save success');
      } catch (err) {
        console.error('Product save error', err);
      }
    }
  }

  async renameCluster(cluster: Cluster) {
    const ref = this.dialogService.create({
      zContent: RenameDialogComponent,
      zData: { name: cluster.name } as RenameDialogData,
      zOkText: this.i18n.translate('common.save') || 'Enregistrer',
      zOnOk: (component: RenameDialogComponent) => {
        if (component.form.valid) {
          return component.form.value;
        }
        return false;
      },
    });

    const res = await firstValueFrom(ref.afterClosed$);

    if (res && res.name) {
      const updated = { ...cluster, name: res.name };
      await firstValueFrom(this.clustersRepo.save(updated));
    }
  }

  moveProduct(product: Product, direction: number) {
    const products = [...this.products()];
    const index = products.findIndex((p) => p.id === product.id);
    if (index === -1) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= products.length) return;

    [products[index], products[newIndex]] = [products[newIndex], products[index]];

    // Update order property
    products.forEach((p, i) => (p.order = i));

    this.productsRepo.saveBulk(products).subscribe();
  }

  moveCluster(cluster: Cluster, direction: number) {
    const allClusters = [...this.clusters()];
    const siblings = allClusters
      .filter((c) => c.productId === cluster.productId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const index = siblings.findIndex((c) => c.id === cluster.id);
    if (index === -1) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= siblings.length) return;

    // Swap in siblings array
    [siblings[index], siblings[newIndex]] = [siblings[newIndex], siblings[index]];

    // Update order
    siblings.forEach((c, i) => (c.order = i));

    this.clustersRepo.saveBulk(siblings).subscribe();
  }

  isFirst(item: any, list: any[]): boolean {
    return list.indexOf(item) === 0;
  }

  isLast(item: any, list: any[]): boolean {
    return list.indexOf(item) === list.length - 1;
  }
}
