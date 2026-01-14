import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
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
            (m) => m.ProfilesListComponent
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
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
];
