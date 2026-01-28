import { Injectable, inject } from '@angular/core';
import { Settings } from '../core/models/domain.model';
import { ProjectsService } from '../core/services/projects.service';

@Injectable({
  providedIn: 'root',
})
export class SettingsRepository {
  private key = 'settings';
  private projectsService = inject(ProjectsService);

  get(): Settings {
    return {
      projectName: this.projectsService.currentProjectName() || 'Mon Projet Costing',
      marginRate: this.projectsService.marginRate(),
      currency: this.projectsService.currency(),
      version: '1.0.0',
    };
  }

  save(settings: Settings): void {
    const projectId = this.projectsService.currentProjectId();
    if (projectId) {
      this.projectsService
        .updateProject(projectId, {
          name: settings.projectName,
          marginRate: settings.marginRate,
          currency: settings.currency,
        })
        .subscribe();
    }
  }
}
