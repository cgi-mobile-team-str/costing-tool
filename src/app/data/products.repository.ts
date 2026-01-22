import { Injectable, inject } from '@angular/core';
import { Product } from '../core/models/domain.model';
import { LocalStorageService } from '../core/services/local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class ProductsRepository {
  private key = 'products';
  private storage = inject(LocalStorageService);

  getAll(): Product[] {
    const list = this.storage.getItem<Product[]>(this.key) || [];
    // Ensure all products have an order
    let changed = false;
    list.forEach((p, i) => {
      if (p.order === undefined) {
        p.order = i;
        changed = true;
      }
    });
    if (changed) {
      this.saveBulk(list);
    }
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  save(product: Product): void {
    const list = this.getAll();
    const index = list.findIndex((i) => i.id === product.id);
    if (index >= 0) {
      list[index] = product;
    } else {
      // Assign order as the last + 1
      const maxOrder = list.reduce((max, p) => Math.max(max, p.order ?? 0), -1);
      product.order = maxOrder + 1;
      list.push(product);
    }
    this.storage.setItem(this.key, list);
  }

  saveBulk(products: Product[]): void {
    this.storage.setItem(this.key, products);
  }

  delete(id: string): void {
    let list = this.getAll();
    list = list.filter((i) => i.id !== id);
    this.storage.setItem(this.key, list);
  }

  get(id: string): Product | undefined {
    return this.getAll().find((p) => p.id === id);
  }
}
