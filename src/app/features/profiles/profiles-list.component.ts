import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Profile } from '../../core/models/domain.model';
import { CalculationService } from '../../core/services/calculation.service';
import { I18nService } from '../../core/services/i18n.service';
import { ProjectsService } from '../../core/services/projects.service';
import { ProfilesRepository } from '../../data/profiles.repository';
import { SettingsRepository } from '../../data/settings.repository';
import { ZardAlertDialogService } from '../../shared/components/alert-dialog/alert-dialog.service';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardIconComponent } from '../../shared/components/icon/icon.component';
import { ZardSheetService } from '../../shared/components/sheet/sheet.service';
import { ZardTableImports } from '../../shared/components/table/table.imports';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ProfileFormComponent } from './profile-form.component';
import { ProjectImportSelectorComponent } from './project-import-selector.component';

@Component({
  selector: 'app-profiles-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    FormsModule,
    DragDropModule,
    ZardButtonComponent,
    ZardIconComponent,
    ...ZardTableImports,
  ],
  templateUrl: './profiles-list.component.html',
  styleUrls: ['./profiles-list.component.css'],
})
export class ProfilesListComponent {
  private repo = inject(ProfilesRepository);
  private settingsRepo = inject(SettingsRepository);
  private calc = inject(CalculationService);
  private sheetService = inject(ZardSheetService);
  private i18n = inject(I18nService);
  private alertDialogService = inject(ZardAlertDialogService);
  private projectsService = inject(ProjectsService);

  profiles = signal<Profile[]>([]);
  searchTerm = signal('');
  hasNoProfiles = computed(() => this.profiles().length === 0);
  settings = signal(this.settingsRepo.get());
  currentProjectName = this.projectsService.currentProjectName;
  marginPercent = 0;

  // Sorting state
  sortKey = signal<keyof Profile | 'order'>('order');
  sortDirection = signal<'asc' | 'desc'>('asc');

  filteredProfiles = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    let result = [...this.profiles()];

    if (term) {
      result = result.filter((p) => p.name.toLowerCase().includes(term));
    }

    const key = this.sortKey();
    const dir = this.sortDirection();

    result.sort((a, b) => {
      const valA = a[key as keyof Profile] ?? '';
      const valB = b[key as keyof Profile] ?? '';

      if (valA < valB) return dir === 'asc' ? -1 : 1;
      if (valA > valB) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  });

  toggleSort(key: keyof Profile | 'order') {
    if (this.sortKey() === key) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDirection.set('asc');
    }
  }

  constructor() {
    this.refresh();
    const s = this.settings();
    this.marginPercent = s.marginRate * 100;
  }

  refresh() {
    const projectId = this.projectsService.currentProjectId();
    if (projectId) {
      this.repo.getAll(projectId).subscribe((profiles) => {
        // Sort by order if available
        const sorted = [...profiles].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        this.profiles.set(sorted);
      });
    }
  }

  drop(event: CdkDragDrop<Profile[]>) {
    const profiles = [...this.profiles()];
    moveItemInArray(profiles, event.previousIndex, event.currentIndex);

    // Reset sorting to custom order when dragging
    this.sortKey.set('order');
    this.sortDirection.set('asc');

    // Normalize ALL orders based on new positions
    const updatedProfiles = profiles.map((p, i) => ({
      ...p,
      order: i,
    }));

    this.repo.saveBulk(updatedProfiles).subscribe(() => {
      this.refresh();
    });
  }

  updateMargin() {
    const current = this.settingsRepo.get();
    const updated = {
      ...current,
      marginRate: this.marginPercent / 100,
    };
    this.settingsRepo.save(updated);
    this.settings.set(updated);
  }

  calculatePreview() {
    return this.calc.applyMargin(1000, this.marginPercent / 100);
  }

  openProfileSheet(profile?: Profile) {
    const sheetRef = this.sheetService.create({
      zTitle: profile
        ? this.i18n.translate('profiles.edit_title')
        : this.i18n.translate('profiles.create_title'),
      zDescription: this.i18n.translate('profiles.edit_desc'),
      zContent: ProfileFormComponent,
      zData: profile,
      zOkText: this.i18n.translate('profiles.save_changes'),
      zCancelText: this.i18n.translate('common.cancel'),
      zWidth: '400px',
      zOnOk: (instance: ProfileFormComponent) => {
        instance.save().subscribe((success) => {
          if (success) {
            this.refresh();
            sheetRef.close();
          }
        });
        return false;
      },
    });
  }

  openImportSheet() {
    const sheetRef = this.sheetService.create({
      zTitle: this.i18n.translate('profiles.import_title'),
      zDescription: this.i18n.translate('profiles.import_desc'),
      zContent: ProjectImportSelectorComponent,
      zData: { excludeProjectId: Number(this.projectsService.currentProjectId()) },
      zOkText: this.i18n.translate('common.import'),
      zCancelText: this.i18n.translate('common.cancel'),
      zWidth: '500px',
      zOnOk: (instance: ProjectImportSelectorComponent) => {
        const sourceId = instance.getSelectedId();
        if (sourceId) {
          const targetId = this.projectsService.currentProjectId();
          if (targetId) {
            this.repo.importFromProject(sourceId, targetId).subscribe(() => {
              this.refresh();
              sheetRef.close();
            });
          }
        }
        return false;
      },
    });
  }

  delete(profile: Profile) {
    this.alertDialogService.confirm({
      zTitle: this.i18n.translate('common.delete'),
      zDescription: this.i18n.translate('common.confirm_delete'),
      zOkText: this.i18n.translate('common.delete'),
      zOkDestructive: true,
      zOnOk: () => {
        this.repo.delete(profile.id).subscribe(() => {
          this.refresh();
        });
      },
    });
  }
}
