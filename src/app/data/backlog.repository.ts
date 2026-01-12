import { Injectable, inject } from '@angular/core';
import { BacklogItem } from '../core/models/domain.model';
import { LocalStorageService } from '../core/services/local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class BacklogRepository {
  private key = 'backlog';
  private storage = inject(LocalStorageService);

  getAll(): BacklogItem[] {
    return this.storage.getItem<BacklogItem[]>(this.key) || [];
  }

  save(item: BacklogItem): void {
    const list = this.getAll();
    const index = list.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.push(item);
    }
    this.storage.setItem(this.key, list);
  }

  delete(id: string): void {
    let list = this.getAll();
    list = list.filter((i) => i.id !== id);
    this.storage.setItem(this.key, list);
  }

  saveBulk(items: BacklogItem[]): void {
    this.storage.setItem(this.key, items);
  }
}
