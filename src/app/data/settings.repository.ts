import { Injectable, inject } from '@angular/core';
import { Settings } from '../core/models/domain.model';
import { LocalStorageService } from '../core/services/local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class SettingsRepository {
  private key = 'settings';
  private storage = inject(LocalStorageService);

  private defaultSettings: Settings = {
    projectName: 'Mon Projet Costing',
    marginRate: 0.15,
    currency: 'EUR',
    version: '1.0.0',
  };

  get(): Settings {
    const data = this.storage.getItem<Settings>(this.key);
    return data ? { ...this.defaultSettings, ...data } : this.defaultSettings;
  }

  save(settings: Settings): void {
    this.storage.setItem(this.key, settings);
  }
}
