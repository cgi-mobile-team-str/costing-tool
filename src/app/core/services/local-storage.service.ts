import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private prefix = 'estimator.';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  getItem<T>(key: string): T | null {
    if (!this.isBrowser()) return null;
    const item = localStorage.getItem(this.prefix + key);
    return item ? JSON.parse(item) : null;
  }

  setItem<T>(key: string, value: T): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
  }

  removeItem(key: string): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (!this.isBrowser()) return;
    // Only clear keys starting with our prefix to be safe neighbors
    Object.keys(localStorage)
      .filter((k) => k.startsWith(this.prefix))
      .forEach((k) => localStorage.removeItem(k));
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
