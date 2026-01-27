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
  public currentProjectName = signal<string | null>(this.storage.getItem<string>('projectName'));

  getProjects(): Observable<Project[]> {
    const url = `${this.apiUrl}?t=${Date.now()}`;
    console.log('ProjectsService.getProjects() calling URL:', url);
    return this.http.get<Project[]>(url).pipe(
      tap({
        next: (data) => console.log('ProjectsService SUCCESS: Received', data.length, 'projects'),
        error: (err) => console.error('ProjectsService ERROR:', err),
        complete: () => console.log('ProjectsService Observable COMPLETE'),
      }),
    );
  }

  setSelectedProject(project: Project | null) {
    if (project) {
      this.storage.setItem('projectId', project.id.toString());
      this.storage.setItem('projectName', project.name);
      this.currentProjectId.set(project.id.toString());
      this.currentProjectName.set(project.name);
    } else {
      this.storage.removeItem('projectId');
      this.storage.removeItem('projectName');
      this.currentProjectId.set(null);
      this.currentProjectName.set(null);
    }
  }

  setProjectName(name: string) {
    this.storage.setItem('projectName', name);
    this.currentProjectName.set(name);
  }
}
