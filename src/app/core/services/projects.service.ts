import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '@env/environment';
import { Observable, of, tap } from 'rxjs';
import { Project } from '../models/domain.model';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private http = inject(HttpClient);
  private storage = inject(LocalStorageService);

  public apiUrl = environment.api.url + '/projects';

  // Signals for global project state
  public currentProjectId = signal<string | null>(this.storage.getItem<string>('projectId'));
  public currentProjectName = signal<string | null>(this.storage.getItem<string>('projectName'));
  public marginRate = signal<number>(Number(this.storage.getItem<string>('marginRate') || 0.15));
  public currency = signal<string>(this.storage.getItem<string>('currency') || 'EUR');

  constructor() {}

  public initProject(): Observable<any> {
    const id = this.currentProjectId();
    if (id) {
      const name = this.currentProjectName();
      const margin = this.storage.getItem<string>('marginRate');
      const currency = this.storage.getItem<string>('currency');

      // If we are missing details but have an ID, fetch from API
      if (!name || !margin || !currency) {
        return this.getProject(id);
      }
    }
    // Return a dummy observable if no fetch is needed
    return of(null);
  }

  getProjects(): Observable<Project[]> {
    const url = `${this.apiUrl}?t=${Date.now()}`;
    return this.http.get<Project[]>(url);
  }

  getProject(id: string): Observable<Project> {
    const url = `${this.apiUrl}/${id}?t=${Date.now()}`;
    return this.http.get<Project>(url).pipe(
      tap({
        next: (project) => {
          if (this.currentProjectId() === id) {
            this.syncProjectData(project);
          }
        },
      }),
    );
  }

  setSelectedProject(project: Project | null) {
    if (project) {
      this.storage.setItem('projectId', project.id);
      this.currentProjectId.set(project.id);
      this.syncProjectData(project);
    } else {
      this.storage.removeItem('projectId');
      this.storage.removeItem('projectName');
      this.storage.removeItem('marginRate');
      this.storage.removeItem('currency');
      this.currentProjectId.set(null);
      this.currentProjectName.set(null);
    }
  }

  private syncProjectData(project: Project) {
    this.storage.setItem('projectName', project.name);
    this.storage.setItem('marginRate', project.marginRate?.toString() || '0.15');
    this.storage.setItem('currency', project.currency || 'EUR');

    this.currentProjectName.set(project.name);
    this.marginRate.set(Number(project.marginRate || 0.15));
    this.currency.set(project.currency || 'EUR');
  }

  updateProject(id: string, updates: Partial<Project>): Observable<Project> {
    const url = `${this.apiUrl}/${id}`;
    const payload = {
      ...updates,
      marginRate: updates.marginRate?.toString(),
    };
    return this.http.patch<Project>(url, payload).pipe(
      tap({
        next: (project) => {
          if (this.currentProjectId() === id) {
            this.syncProjectData(project);
          }
        },
      }),
    );
  }

  createProject(name: string): Observable<Project> {
    const url = this.apiUrl;
    return this.http.post<Project>(url, { name });
  }

  deleteProject(id: string): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete(url).pipe(
      tap(() => {
        if (this.currentProjectId() === id) {
          this.setSelectedProject(null);
        }
      }),
    );
  }

  duplicateProject(id: string, name?: string): Observable<Project> {
    const url = `${this.apiUrl}/${id}/duplicate`;
    return this.http.post<Project>(url, { name });
  }
}
