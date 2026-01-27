import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Profile } from '../core/models/domain.model';

@Injectable({
  providedIn: 'root',
})
export class ProfilesRepository {
  private http = inject(HttpClient);
  private apiUrl = `${environment.api.url}/profiles`;

  getAll(projectId: number): Observable<Profile[]> {
    return this.http.get<Profile[]>(`${this.apiUrl}/${projectId}`);
  }

  save(profile: Profile, projectId: number): Observable<Profile> {
    const data = { ...profile, projectId };

    if (profile.id && profile.id.length > 10) {
      return this.http.patch<Profile>(`${this.apiUrl}/${profile.id}`, data);
    } else {
      // Clean up empty ID for creation
      if (data.id === '') {
        const { id, ...payload } = data;
        return this.http.post<Profile>(this.apiUrl, payload as any);
      }
      return this.http.post<Profile>(this.apiUrl, data);
    }
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getById(id: string): Observable<Profile> {
    return this.http.get<Profile>(`${this.apiUrl}/item/${id}`);
  }

  getAvailableProjects(excludeProjectId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/import/available/${excludeProjectId}`);
  }

  importFromProject(sourceProjectId: number, targetProjectId: number): Observable<Profile[]> {
    return this.http.post<Profile[]>(`${this.apiUrl}/import`, {
      sourceProjectId,
      targetProjectId,
    });
  }
}
