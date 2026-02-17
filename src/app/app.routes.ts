import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { projectGuard } from './core/guards/project.guard';
import { MainLayoutComponent } from './core/layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'select-project',
    canActivate: [MsalGuard],
    loadComponent: () =>
      import('./features/project-selection/project-selection.component').then(
        (m) => m.ProjectSelectionComponent,
      ),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [MsalGuard, projectGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'profiles',
        loadComponent: () =>
          import('./features/profiles/profiles-list.component').then(
            (m) => m.ProfilesListComponent,
          ),
      },
      {
        path: 'backlog',
        loadComponent: () =>
          import('./features/backlog/backlog-list.component').then((m) => m.BacklogListComponent),
      },
      {
        path: 'backlog/new',
        loadComponent: () =>
          import('./features/backlog/backlog-form.component').then((m) => m.BacklogFormComponent),
      },
      {
        path: 'backlog/:id',
        loadComponent: () =>
          import('./features/backlog/backlog-form.component').then((m) => m.BacklogFormComponent),
      },
      {
        path: 'planning',
        loadComponent: () =>
          import('./features/planning/planning.component').then((m) => m.PlanningComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'summary',
        loadComponent: () =>
          import('./features/summary/financial-summary.component').then(
            (m) => m.FinancialSummaryComponent,
          ),
      },
    ],
  },
];
