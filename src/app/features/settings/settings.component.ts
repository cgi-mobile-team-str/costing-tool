import { CommonModule } from '@angular/common';
import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BacklogItem, Profile } from '../../core/models/domain.model';
import { CalculationService } from '../../core/services/calculation.service';
import { I18nService, Lang } from '../../core/services/i18n.service';
import { LocalStorageService } from '../../core/services/local-storage.service';
import { BacklogRepository } from '../../data/backlog.repository';
import { ProfilesRepository } from '../../data/profiles.repository';
import { SettingsRepository } from '../../data/settings.repository';
import { ZardAlertDialogService } from '../../shared/components/alert-dialog/alert-dialog.service';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ImportModalComponent } from '../backlog/import-modal.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    ImportModalComponent,
    ZardButtonComponent,
  ],
  templateUrl: './settings.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class SettingsComponent {
  private fb = inject(FormBuilder);
  private repo = inject(SettingsRepository);
  private backlogRepo = inject(BacklogRepository);
  private profilesRepo = inject(ProfilesRepository);
  private storage = inject(LocalStorageService);
  private i18n = inject(I18nService);
  private calc = inject(CalculationService);
  private alertDialogService = inject(ZardAlertDialogService);

  showImportModal = signal(false);
  itemsToImport = signal<BacklogItem[]>([]);
  profilesToImport = signal<Profile[]>([]);
  importedProjectName = signal('');

  settings = signal(this.repo.get());

  form = this.fb.group({
    projectName: ['', Validators.required],
    currency: ['EUR', Validators.required],
  });

  currentLang = this.i18n.getLang.bind(this.i18n);

  constructor() {
    const s = this.repo.get();
    this.form.patchValue({
      projectName: s.projectName || '',
      currency: s.currency,
    });
  }

  save() {
    if (this.form.valid) {
      const val = this.form.value;
      const current = this.repo.get();
      const newSettings = {
        ...current,
        projectName: val.projectName || current.projectName,
        currency: val.currency || 'EUR',
      };
      this.repo.save(newSettings);
      this.settings.set(newSettings);
      this.form.markAsPristine();
      alert('Settings saved');
    }
  }

  exportJson() {
    const s = this.repo.get();
    const items = this.backlogRepo.getAll();
    const profiles = this.profilesRepo.getAll();
    const data = {
      projectName: s.projectName,
      exportDate: new Date().toISOString(),
      items,
      profiles,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `${(s.projectName || 'export')
      .toLowerCase()
      .replace(/\s+/g, '-')}-export-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importJson(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const content = JSON.parse(e.target.result);
        let items: BacklogItem[] = [];
        let profiles: Profile[] = [];
        let projectName = '';

        if (content.items && content.projectName) {
          items = content.items as BacklogItem[];
          profiles = (content.profiles || []) as Profile[];
          projectName = content.projectName;
        } else if (Array.isArray(content)) {
          items = content as BacklogItem[];
          projectName = 'Project Imported';
        }

        if (Array.isArray(items)) {
          this.itemsToImport.set(items);
          this.profilesToImport.set(profiles);
          this.importedProjectName.set(projectName);
          this.showImportModal.set(true);
        } else {
          alert('Format de fichier invalide.');
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier JSON.');
        console.error(err);
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  }

  handleImportAction(event: { type: 'add' | 'replace' | 'cancel'; projectName: string }) {
    const items = this.itemsToImport();
    const profiles = this.profilesToImport();

    if (event.type !== 'cancel') {
      const current = this.repo.get();
      this.repo.save({ ...current, projectName: event.projectName });
      this.form.patchValue({ projectName: event.projectName });

      if (event.type === 'add') {
        // Add profiles if they don't exist by ID
        const existingProfiles = this.profilesRepo.getAll();
        profiles.forEach((p) => {
          if (!existingProfiles.some((ep: Profile) => ep.id === p.id)) {
            this.profilesRepo.save(p);
          }
        });
        items.forEach((item) => this.backlogRepo.save(item));
      } else if (event.type === 'replace') {
        if (profiles.length > 0) {
          this.profilesRepo.saveBulk(profiles);
        }
        this.backlogRepo.saveBulk(items);
      }
      alert('Importation réussie');
    }

    this.showImportModal.set(false);
    this.itemsToImport.set([]);
  }

  changeLang(e: Event) {
    const val = (e.target as HTMLSelectElement).value as Lang;
    this.i18n.setLang(val);
  }

  resetApp() {
    this.alertDialogService.confirm({
      zTitle: this.i18n.translate('settings.danger_zone'),
      zDescription:
        'ATTENTION: Cela va effacer toutes les données (Profils, Backlog, Settings). Continuer ?',
      zOkText: this.i18n.translate('settings.reset_app'),
      zOkDestructive: true,
      zOnOk: () => {
        this.storage.clear();
        window.location.reload();
      },
    });
  }
}
