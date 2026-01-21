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
    return this.storage.getItem<Product[]>(this.key) || [];
  }

  save(product: Product): void {
    const list = this.getAll();
    const index = list.findIndex((i) => i.id === product.id);
    if (index >= 0) {
      list[index] = product;
    } else {
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
