import { Injectable, inject } from '@angular/core';
import { Cluster } from '../core/models/domain.model';
import { LocalStorageService } from '../core/services/local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class ClustersRepository {
  private key = 'clusters';
  private storage = inject(LocalStorageService);

  getAll(): Cluster[] {
    const list = this.storage.getItem<Cluster[]>(this.key) || [];
    // Ensure all clusters have an order
    let changed = false;
    list.forEach((c, i) => {
      if (c.order === undefined) {
        c.order = i;
        changed = true;
      }
    });
    if (changed) {
      this.saveBulk(list);
    }
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  getByProductId(productId: string): Cluster[] {
    return this.getAll().filter((c) => c.productId === productId);
  }

  save(cluster: Cluster): void {
    const list = this.getAll();
    const index = list.findIndex((i) => i.id === cluster.id);
    if (index >= 0) {
      list[index] = cluster;
    } else {
      // Assign order as the last + 1 within the same product?
      // Actually global order is fine too if we sort by product then order,
      // but repository getAll returns all.
      const maxOrder = list.reduce((max, c) => Math.max(max, c.order ?? 0), -1);
      cluster.order = maxOrder + 1;
      list.push(cluster);
    }
    this.storage.setItem(this.key, list);
  }

  saveBulk(clusters: Cluster[]): void {
    this.storage.setItem(this.key, clusters);
  }

  delete(id: string): void {
    let list = this.getAll();
    list = list.filter((i) => i.id !== id);
    this.storage.setItem(this.key, list);
  }

  get(id: string): Cluster | undefined {
    return this.getAll().find((c) => c.id === id);
  }
}
