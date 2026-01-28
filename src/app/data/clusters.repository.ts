import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cluster } from '../core/models/domain.model';
import { ProjectsService } from '../core/services/projects.service';

@Injectable({
  providedIn: 'root',
})
export class ClustersRepository {
  private http = inject(HttpClient);
  private projectsService = inject(ProjectsService);
  private apiUrl = `${environment.api.url}/backlog/clusters`;

  private _items = signal<Cluster[]>([]);

  setItems(items: Cluster[]) {
    this._items.set(items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  }

  get items() {
    return this._items.asReadonly();
  }

  getAll(): Cluster[] {
    return this._items();
  }

  getByProductId(productId: string): Cluster[] {
    return this._items().filter((c) => c.productId === productId);
  }

  get(id: string): Cluster | undefined {
    return this._items().find((c) => c.id === id);
  }

  save(cluster: Cluster): Observable<Cluster> {
    if (cluster.id && !cluster.id.includes('cluster-')) {
      const payload = { name: cluster.name, order: cluster.order };
      return this.http
        .patch<Cluster>(`${this.apiUrl}/${cluster.id}`, payload)
        .pipe(tap((updated) => this.updateLocal(updated)));
    } else {
      const payload = {
        name: cluster.name,
        productId: cluster.productId,
        projectId: this.projectsService.currentProjectId()!,
        order: cluster.order,
      };
      return this.http
        .post<Cluster>(this.apiUrl, payload)
        .pipe(tap((created) => this.addLocal(created)));
    }
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this._items.update((list) => list.filter((c) => c.id !== id))));
  }

  saveBulk(clusters: Cluster[]): Observable<Cluster[]> {
    this._items.set(clusters);

    const updates = clusters.map((c) => this.save(c));
    return forkJoin(updates);
  }

  private updateLocal(item: Cluster) {
    this._items.update((list) =>
      list
        .map((i) => (i.id === item.id ? item : i))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    );
  }

  private addLocal(item: Cluster) {
    this._items.update((list) => [...list, item].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  }
}
