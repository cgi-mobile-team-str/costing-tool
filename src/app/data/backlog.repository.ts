import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, map, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { BacklogItem } from '../core/models/domain.model';

@Injectable({
  providedIn: 'root',
})
export class BacklogRepository {
  private http = inject(HttpClient);
  private apiUrl = `${environment.api.url}/backlog/items`;

  // In-memory store
  private _items = signal<BacklogItem[]>([]);

  get items() {
    return this._items.asReadonly();
  }

  setItems(items: BacklogItem[]) {
    this._items.set(items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  }

  getAll(): BacklogItem[] {
    return this._items();
  }

  getAllItems(projectId: string): Observable<BacklogItem[]> {
    return this.http
      .get<{
        items: BacklogItem[];
        products: any[];
        clusters: any[];
      }>(`${environment.api.url}/backlog/project/${projectId}`)
      .pipe(
        map((res) => res.items || []),
        tap((items) => this.setItems(items)),
      );
  }

  getFullBacklog(projectId: string): Observable<{
    items: BacklogItem[];
    products: any[];
    clusters: any[];
  }> {
    return this.http.get<{ items: BacklogItem[]; products: any[]; clusters: any[] }>(
      `${environment.api.url}/backlog/project/${projectId}`,
    );
  }

  save(item: BacklogItem): Observable<BacklogItem> {
    const isNew = !item.id || item.id.length < 10 || item.id.includes('item-'); // Simple check, or rely on caller
    // Actually, backend generates ID.
    // If ID is valid UUID, it's update. If it's temp, it's create.

    // We assume if it has a real UUID it's an update.
    // Ideally we check if it exists in _items with a real ID?
    // Let's assume the component acts correctly.

    if (item.id && !item.id.toString().includes('item-') && item.id.length > 10) {
      // Destructure to remove non-updatable fields like createdAt, userId from payload
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { id, projectId, userId, createdAt, productId, clusterId, ...rest } = item as any;

      // Re-add potentially needed fields that are allowed to change or needed for identification?
      // Actually productId/clusterId are allowed in UpdateItemDto
      const payload: Partial<BacklogItem> = { ...rest, productId, clusterId };
      // Note: projectId is not in BacklogItem interface but might be in UpdateItemDto?
      // UpdateItemDto extends CreateItemDto which has projectId.
      // So payload should probably include it if we want to change projects?
      // But typically we don't move items between projects this way.
      // Let's stick to standard fields.

      return this.http
        .patch<BacklogItem>(`${this.apiUrl}/${item.id}`, payload)
        .pipe(tap((updated) => this.updateLocal(updated)));
    } else {
      // Create
      return this.http
        .post<BacklogItem>(this.apiUrl, item)
        .pipe(tap((created) => this.addLocal(created)));
    }
  }
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this._items.update((list) => list.filter((i) => i.id !== id));
      }),
    );
  }

  saveBulk(items: BacklogItem[]): Observable<BacklogItem[]> {
    this._items.set(items);
    // Since backend doesn't support bulk update, we update one by one (simplified)
    const updates = items.map((i) => this.save(i));
    return forkJoin(updates);
  }

  private updateLocal(item: BacklogItem) {
    if (!item) return;
    this._items.update((list) => list.map((i) => (i.id === item.id ? item : i)));
  }

  private addLocal(item: BacklogItem) {
    if (!item) return;
    this._items.update((list) => [...list, item]);
  }
}
