import { Injectable, inject } from '@angular/core';
import { Profile } from '../core/models/domain.model';
import { IdService } from '../core/services/id.service';
import { LocalStorageService } from '../core/services/local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class ProfilesRepository {
  private key = 'profiles';
  private storage = inject(LocalStorageService);
  private idService = inject(IdService);

  getAll(): Profile[] {
    const data = this.storage.getItem<Profile[]>(this.key);
    if (!data || data.length === 0) {
      const seed = this.getSeedData();
      this.storage.setItem(this.key, seed);
      return seed;
    }
    return data;
  }

  save(profile: Profile): void {
    const list = this.getAll();
    const index = list.findIndex((p) => p.id === profile.id);
    if (index >= 0) {
      list[index] = profile;
    } else {
      list.push(profile);
    }
    this.storage.setItem(this.key, list);
  }

  delete(id: string): void {
    let list = this.getAll();
    list = list.filter((p) => p.id !== id);
    this.storage.setItem(this.key, list);
  }

  saveBulk(profiles: Profile[]): void {
    this.storage.setItem(this.key, profiles);
  }

  getById(id: string): Profile | undefined {
    return this.getAll().find((p) => p.id === id);
  }

  private getSeedData(): Profile[] {
    return [
      { id: this.idService.generate(), name: 'UX Designer', dailyRate: 550, active: true },
      { id: this.idService.generate(), name: 'Business Analyst', dailyRate: 600, active: true },
      { id: this.idService.generate(), name: 'Chef de projet', dailyRate: 700, active: true },
      { id: this.idService.generate(), name: 'Architecte', dailyRate: 800, active: true },
      { id: this.idService.generate(), name: 'Tech Lead Frontend', dailyRate: 750, active: true },
      { id: this.idService.generate(), name: 'Tech Lead Backend', dailyRate: 800, active: true },
      { id: this.idService.generate(), name: 'Dév Senior Frontend', dailyRate: 650, active: true },
    ];
  }
}
