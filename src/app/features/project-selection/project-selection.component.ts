import { ProjectsService } from '@/core/services/projects.service';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Project } from '../../core/models/domain.model';

@Component({
  selector: 'app-project-selection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-selection.component.html',
  styleUrls: ['./project-selection.component.css'],
})
export class ProjectSelectionComponent implements OnInit {
  private projectsService = inject(ProjectsService);
  private router = inject(Router);

  projects = signal<Project[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  apiUrl = '';

  // Creation State
  isCreating = signal(false);
  isCreatingProject = signal(false);
  newProjectName = '';

  ngOnInit() {
    console.log('ProjectSelectionComponent ngOnInit');
    this.apiUrl = this.projectsService.apiUrl;
    console.log('Service API URL:', this.apiUrl);
    this.loadProjects();
  }

  loadProjects() {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.projectsService.getProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('ERROR in ProjectSelectionComponent:', err);
        this.errorMessage.set(err.message || 'Une erreur inconnue est survenue.');
        this.loading.set(false);
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

    this.isCreatingProject.set(true);
    this.projectsService.createProject(name).subscribe({
      next: (project) => {
        this.isCreatingProject.set(false);
        this.isCreating.set(false);
        this.newProjectName = '';
        // Reload projects or just push? Reload ensures sort/consistency
        this.loadProjects();
        // Optional: Auto-select?
        // this.selectProject(project);
      },
      error: (err) => {
        console.error('Error creating project', err);
        this.isCreatingProject.set(false);
        this.errorMessage.set('Erreur lors de la création du projet.');
      },
    });
  }

  cancelCreate() {
    this.isCreating.set(false);
    this.newProjectName = '';
    this.errorMessage.set(null);
  }
}
