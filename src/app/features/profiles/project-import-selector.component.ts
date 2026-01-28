import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ProfilesRepository } from '../../data/profiles.repository';
import { ZardIconComponent } from '../../shared/components/icon/icon.component';
import { Z_SHEET_DATA } from '../../shared/components/sheet/sheet.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-project-import-selector',
  standalone: true,
  imports: [CommonModule, TranslatePipe, ZardIconComponent],
  template: `
    <div class="flex flex-col gap-4 p-4">
      <p class="text-muted-foreground">
        {{ 'profiles.import_select_desc' | translate }}
      </p>

      @if (loading()) {
        <div class="flex justify-center py-8">
          <z-icon zType="loader-circle" class="animate-spin opacity-50" style="font-size: 2rem" />
        </div>
      } @else if (availableProjects().length === 0) {
        <div class="text-center py-8 border-2 border-dashed rounded-lg">
          <p class="text-muted-foreground">{{ 'profiles.no_projects_to_import' | translate }}</p>
        </div>
      } @else {
        <div class="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          @for (project of availableProjects(); track project.id) {
            <button
              class="project-item"
              [class.selected]="selectedProjectId() === project.id"
              (click)="selectedProjectId.set(project.id)"
            >
              <div class="flex items-center gap-3">
                <z-icon zType="folder" />
                <span class="font-medium">{{ project.name }}</span>
              </div>
              @if (selectedProjectId() === project.id) {
                <z-icon zType="check" class="text-success" />
              }
            </button>
          }
        </div>
      }
    </div>

    <style>
      .project-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        background: transparent;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
        width: 100%;
      }
      .project-item:hover {
        background: var(--muted);
        border-color: var(--muted-foreground);
      }
      .project-item.selected {
        border-color: var(--brand-red, #e30613);
        background: var(--brand-red-light, #fff5f5);
      }
    </style>
  `,
})
export class ProjectImportSelectorComponent implements OnInit {
  private repo = inject(ProfilesRepository);
  private zData = inject(Z_SHEET_DATA, { optional: true });

  excludeProjectId: string | null = null;
  availableProjects = signal<any[]>([]);
  selectedProjectId = signal<string | null>(null);
  loading = signal(true);

  constructor() {
    if (this.zData?.excludeProjectId) {
      this.excludeProjectId = this.zData.excludeProjectId;
    }
  }

  ngOnInit() {
    if (this.excludeProjectId !== null) {
      this.repo.getAvailableProjects(this.excludeProjectId).subscribe({
        next: (projects) => {
          this.availableProjects.set(projects);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.loading.set(false);
    }
  }

  getSelectedId() {
    return this.selectedProjectId();
  }
}
