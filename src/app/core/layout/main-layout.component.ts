import { CommonModule } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LocalStorageService } from '../services/local-storage.service';
import { ProjectsService } from '../services/projects.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class MainLayoutComponent {
  private storage = inject(LocalStorageService);
  private authService = inject(MsalService);
  private projectsService = inject(ProjectsService);
  private readonly STORAGE_KEY = 'sidebar_collapsed';

  public currentProjectName = this.projectsService.currentProjectName;

  isCollapsed = this.storage.getItem<boolean>(this.STORAGE_KEY) || false;

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.storage.setItem(this.STORAGE_KEY, this.isCollapsed);
  }

  logout() {
    this.projectsService.setSelectedProject(null);
    this.authService.logoutRedirect();
  }
}
