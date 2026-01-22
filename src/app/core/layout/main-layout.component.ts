import { Component, inject, ViewEncapsulation } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LocalStorageService } from '../services/local-storage.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class MainLayoutComponent {
  private storage = inject(LocalStorageService);
  private readonly STORAGE_KEY = 'sidebar_collapsed';

  isCollapsed = this.storage.getItem<boolean>(this.STORAGE_KEY) || false;

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.storage.setItem(this.STORAGE_KEY, this.isCollapsed);
  }
}
