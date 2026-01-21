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
    return this.storage.getItem<Cluster[]>(this.key) || [];
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
