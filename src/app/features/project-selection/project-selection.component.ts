import { ProjectsService } from '@/core/services/projects.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Project } from '../../core/models/domain.model';
import { LocalStorageService } from '../../core/services/local-storage.service';

@Component({
  selector: 'app-project-selection',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
            class="w-full text-left p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-red-200 hover:bg-red-50/50 hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div class="flex justify-between items-center">
              <div>
                <div class="font-bold text-slate-900 group-hover:text-red-700 text-lg">
                  {{ project.name }}
                </div>
                <div class="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
                  Créé le {{ project.createdAt | date: 'dd MMMM yyyy' }}
                </div>
              </div>
              <div
                class="opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0"
              >
                <span class="text-red-600 text-2xl">→</span>
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

        <!-- Create New Project Section -->
        <div class="mb-8 pt-4 border-t border-slate-100">
          <div *ngIf="!isCreating">
            <button
              (click)="isCreating = true"
              class="w-full py-3 px-4 bg-white border-2 border-dashed border-slate-300 text-slate-500 rounded-xl hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all font-medium flex items-center justify-center gap-2"
            >
              <span class="text-xl leading-none">+</span> Créer un nouveau projet
            </button>
          </div>

          <div
            *ngIf="isCreating"
            class="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2"
          >
            <label class="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide"
              >Nom du projet</label
            >
            <input
              type="text"
              [(ngModel)]="newProjectName"
              (keydown.enter)="createProject()"
              placeholder="Ex: Mon Super Projet"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all mb-3 text-sm"
              autofocus
            />
            <div class="flex gap-2">
              <button
                (click)="createProject()"
                [disabled]="!newProjectName.trim() || isCreatingProject"
                class="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-red-200"
              >
                {{ isCreatingProject ? 'Création...' : 'Créer' }}
              </button>
              <button
                (click)="cancelCreate()"
                class="py-2 px-4 bg-white border border-slate-300 text-slate-600 rounded-lg font-medium text-sm hover:bg-slate-50 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center gap-2">
          <p class="text-slate-400 text-xs font-medium">CGI Costing Tool &bull; v1.0.0</p>
          <div class="flex gap-4 text-slate-300 text-[10px]">
            <!-- <span>API: {{ apiUrl }}</span> -->
            <span>Status: {{ loading ? 'Loading...' : projects.length + ' projects' }}</span>
          </div>
          <!-- <button
            (click)="loadProjects()"
            class="mt-2 text-[10px] text-red-400 hover:text-red-600 underline"
          >
            Forcer la recharge
          </button> -->
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
      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      .animate-in {
        animation: fade-in 0.2s ease-out;
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

  // Creation State
  isCreating = false;
  isCreatingProject = false;
  newProjectName = '';

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

  createProject() {
    const name = this.newProjectName.trim();
    if (!name) return;

    this.isCreatingProject = true;
    this.projectsService.createProject(name).subscribe({
      next: (project) => {
        this.ngZone.run(() => {
          this.isCreatingProject = false;
          this.isCreating = false;
          this.newProjectName = '';
          // Reload projects or just push? Reload ensures sort/consistency
          this.loadProjects();
          // Optional: Auto-select?
          // this.selectProject(project);
        });
      },
      error: (err) => {
        console.error('Error creating project', err);
        this.ngZone.run(() => {
          this.isCreatingProject = false;
          this.errorMessage = 'Erreur lors de la création du projet.';
          this.cdr.detectChanges();
        });
      },
    });
  }

  cancelCreate() {
    this.isCreating = false;
    this.newProjectName = '';
    this.errorMessage = null;
  }
}
