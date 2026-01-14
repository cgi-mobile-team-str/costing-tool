import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <div class="app-layout">
      <aside class="sidebar" [class.collapsed]="isCollapsed">
        <div class="sidebar-header">
          <div class="logo">
            <svg
              (click)="toggleSidebar()"
              style="cursor: pointer"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
            <span>CGI Costing</span>
          </div>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>{{ 'nav.dashboard' | translate }}</span>
          </a>
          <a routerLink="/backlog" routerLinkActive="active" class="nav-item">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span>{{ 'nav.backlog' | translate }}</span>
          </a>
          <a routerLink="/profiles" routerLinkActive="active" class="nav-item">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span>{{ 'nav.profiles' | translate }}</span>
          </a>
          <a routerLink="/settings" routerLinkActive="active" class="nav-item">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"
              />
            </svg>
            <span>{{ 'nav.settings' | translate }}</span>
          </a>
        </nav>
      </aside>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .app-layout {
        display: flex;
        min-height: 100vh;
        background: var(--background);
      }

      .sidebar {
        width: 240px;
        background: #18181b;
        color: #fafafa;
        display: flex;
        flex-direction: column;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
        transition: width 0.3s ease;
      }

      .sidebar.collapsed {
        width: 64px;
      }

      .sidebar-header {
        padding: 1.5rem 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        overflow: hidden;
      }

      .sidebar.collapsed .sidebar-header {
        padding: 1.5rem 0.5rem;
        display: flex;
        justify-content: center;
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 600;
        font-size: 1.125rem;
        white-space: nowrap;
      }

      .logo svg {
        opacity: 0.9;
        min-width: 24px;
      }
      
      .sidebar.collapsed .logo span {
        display: none;
      }

      .sidebar-nav {
        padding: 1rem 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 0.375rem;
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;
        transition: all 0.15s ease;
        font-size: 0.875rem;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
      }

      .sidebar.collapsed .nav-item {
        padding: 0.75rem;
        justify-content: center;
      }

      .nav-item:hover {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;
      }

      .nav-item.active {
        background: rgba(255, 255, 255, 0.15);
        color: #ffffff;
      }

      .nav-item svg {
        flex-shrink: 0;
      }
      
      .sidebar.collapsed .nav-item span {
        display: none;
      }

      .main-content {
        flex: 1;
        padding: 2rem;
        overflow-x: auto;
      }
    `,
  ],
})
export class MainLayoutComponent {
  isCollapsed = false;

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}
