import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../core/models/domain.model';
import { ProjectsService } from '../core/services/projects.service';

@Injectable({
  providedIn: 'root',
})
export class ProductsRepository {
  private http = inject(HttpClient);
  private projectsService = inject(ProjectsService);
  private apiUrl = `${environment.api.url}/backlog/products`;

  private _items = signal<Product[]>([]);

  setItems(items: Product[]) {
    this._items.set(items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  }

  get items() {
    return this._items.asReadonly();
  }

  getAll(): Product[] {
    return this._items();
  }

  get(id: string): Product | undefined {
    return this._items().find((p) => p.id === id);
  }

  save(product: Product): Observable<Product> {
    console.log('ProductsRepository.save', product);
    if (product.id && !product.id.includes('product-')) {
      const payload = { name: product.name, order: product.order };
      return this.http.patch<Product>(`${this.apiUrl}/${product.id}`, payload).pipe(
        tap((updated) => {
          console.log('Patch success', updated);
          this.updateLocal(updated);
        }),
      );
    } else {
      const payload = {
        name: product.name,
        projectId: this.projectsService.currentProjectId()!,
        order: product.order,
      };
      return this.http.post<Product>(this.apiUrl, payload).pipe(
        tap((created) => {
          console.log('Post success', created);
          this.addLocal(created);
        }),
      );
    }
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this._items.update((list) => list.filter((p) => p.id !== id))));
  }

  saveBulk(products: Product[]): Observable<Product[]> {
    this._items.set(products);

    // Since backend doesn't support bulk update, we update one by one (simplified)
    const updates = products.map((p) => this.save(p));
    return forkJoin(updates);
  }

  private updateLocal(item: Product) {
    this._items.update((list) =>
      list
        .map((i) => (i.id === item.id ? item : i))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    );
  }

  private addLocal(item: Product) {
    this._items.update((list) => [...list, item].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  }
}
