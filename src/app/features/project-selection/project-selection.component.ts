import { ProjectsService } from '@/core/services/projects.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Project } from '../../core/models/domain.model';
import { LocalStorageService } from '../../core/services/local-storage.service';

@Component({
  selector: 'app-project-selection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div
        class="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100"
      >
        <h1 class="text-2xl font-bold mb-2 text-slate-900">Bienvenue</h1>
        <p class="text-slate-500 mb-8">
          Veuillez sélectionner le projet sur lequel vous souhaitez travailler pour continuer.
        </p>

        <!-- DEBUG INFO -->
        <div *ngIf="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
          <p class="text-red-600 text-sm font-medium">Erreur lors du chargement des projets :</p>
          <p class="text-red-500 text-xs mt-1">{{ errorMessage }}</p>
          <button
            (click)="retry()"
            class="mt-3 text-red-700 text-xs font-bold underline hover:text-red-900"
          >
            Réessayer
          </button>
        </div>

        <div class="space-y-3 max-h-[400px] overflow-y-auto mb-8 pr-2 custom-scrollbar">
          <button
            *ngFor="let project of projects"
            (click)="selectProject(project)"
            class="w-full text-left p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div class="flex justify-between items-center">
              <div>
                <div class="font-bold text-slate-900 group-hover:text-blue-700 text-lg">
                  {{ project.name }}
                </div>
                <div class="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
                  Créé le {{ project.createdAt | date: 'dd MMMM yyyy' }}
                </div>
              </div>
              <div
                class="opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0"
              >
                <span class="text-blue-600 text-2xl">→</span>
              </div>
            </div>
          </button>

          <div
            *ngIf="projects.length === 0 && !loading && !errorMessage"
            class="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200"
          >
            <p class="text-slate-400 text-sm">Aucun projet trouvé.</p>
          </div>

          <div *ngIf="loading" class="space-y-3">
            <div
              *ngFor="let i of [1, 2, 3]"
              class="h-20 bg-slate-50 animate-pulse rounded-xl"
            ></div>
          </div>
        </div>

        <div class="flex flex-col items-center gap-2">
          <p class="text-slate-400 text-xs font-medium">CGI Costing Tool &bull; v1.0.0</p>
          <div class="flex gap-4 text-slate-300 text-[10px]">
            <span>API: {{ apiUrl }}</span>
            <span>Status: {{ loading ? 'Loading...' : projects.length + ' projects' }}</span>
          </div>
          <button
            (click)="loadProjects()"
            class="mt-2 text-[10px] text-blue-400 hover:text-blue-600 underline"
          >
            Forcer la recharge
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `,
  ],
})
export class ProjectSelectionComponent implements OnInit {
  private projectsService = inject(ProjectsService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private storage = inject(LocalStorageService);

  projects: Project[] = [];
  loading = true;
  errorMessage: string | null = null;
  apiUrl = '';

  ngOnInit() {
    console.log('ProjectSelectionComponent ngOnInit');
    this.apiUrl = this.projectsService.apiUrl;
    console.log('Service API URL:', this.apiUrl);
    this.loadProjects();
  }

  loadProjects() {
    console.log('loadProjects() called');
    this.loading = true;
    this.errorMessage = null;
    this.projectsService.getProjects().subscribe({
      next: (projects) => {
        console.log('SUCCESS: Projects received in component:', projects);
        this.ngZone.run(() => {
          this.projects = projects;
          this.loading = false;
          this.cdr.detectChanges();
          console.log('View updated in zone, loading is:', this.loading);
        });
      },
      error: (err) => {
        console.error('ERROR in ProjectSelectionComponent:', err);
        this.ngZone.run(() => {
          this.errorMessage = err.message || 'Une erreur inconnue est survenue.';
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      complete: () => {
        console.log('Subscription completed');
      },
    });
  }

  retry() {
    this.loadProjects();
  }

  selectProject(project: Project) {
    this.projectsService.setSelectedProject(project);
    this.router.navigate(['/dashboard']);
  }
}
