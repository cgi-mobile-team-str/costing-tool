import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '@env/environment';
import { Observable, tap } from 'rxjs';
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
  public currentProjectName = signal<string | null>(null);
  public marginRate = signal<number>(0.15);
  public currency = signal<string>('EUR');

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
            this.currentProjectName.set(project.name);
            this.marginRate.set(Number(project.marginRate || 0.15));
            this.currency.set(project.currency || 'EUR');
          }
        },
      }),
    );
  }

  setSelectedProject(project: Project | null) {
    if (project) {
      this.storage.setItem('projectId', project.id);
      this.currentProjectId.set(project.id);
      this.currentProjectName.set(project.name);
      this.marginRate.set(Number(project.marginRate || 0.15));
      this.currency.set(project.currency || 'EUR');
    } else {
      this.storage.removeItem('projectId');
      this.currentProjectId.set(null);
      this.currentProjectName.set(null);
    }
  }

  updateProject(id: string, updates: Partial<Project>): Observable<Project> {
    const url = `${this.apiUrl}/${id}`;
    // Margin rate is numeric/string in backend DTO for safety
    const payload = {
      ...updates,
      marginRate: updates.marginRate?.toString(),
    };
    return this.http.patch<Project>(url, payload).pipe(
      tap({
        next: (project) => {
          if (this.currentProjectId() === id) {
            this.currentProjectName.set(project.name);
            this.marginRate.set(Number(project.marginRate || 0.15));
            this.currency.set(project.currency || 'EUR');
          }
        },
      }),
    );
  }

  createProject(name: string): Observable<Project> {
    const url = this.apiUrl;
    console.log(`ProjectsService.createProject() calling POST ${url}`, { name });
    return this.http.post<Project>(url, { name }).pipe(
      tap({
        next: (project) => console.log('ProjectsService SUCCESS: Project created', project),
        error: (err) => console.error('ProjectsService ERROR creating project:', err),
      }),
    );
  }
}
