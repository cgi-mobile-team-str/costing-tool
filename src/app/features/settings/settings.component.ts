import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BacklogItem, Profile } from '../../core/models/domain.model';
import { CalculationService } from '../../core/services/calculation.service';
import { I18nService, Lang } from '../../core/services/i18n.service';
import { LocalStorageService } from '../../core/services/local-storage.service';
import { BacklogRepository } from '../../data/backlog.repository';
import { ProfilesRepository } from '../../data/profiles.repository';
import { SettingsRepository } from '../../data/settings.repository';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ImportModalComponent } from '../backlog/import-modal.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, ImportModalComponent],
  template: `
    <div class="container ps-container">
      <div class="header">
        <div>
          <span class="context-label">{{ 'nav.settings' | translate }}</span>
          <h2>{{ settings().projectName }}</h2>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="card">
          <h3>Projet</h3>
          <div class="form-group">
            <label>Nom du projet</label>
            <input type="text" formControlName="projectName" class="form-control" />
          </div>
        </div>

        <div class="card">
          <h3>Calculations</h3>

          <div class="form-group">
            <label>Currency</label>
            <select formControlName="currency" class="form-control">
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>

        <div class="card">
          <h3>Interface</h3>
          <div class="form-group">
            <label>Language</label>
            <select [value]="currentLang()" (change)="changeLang($event)" class="form-control">
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div class="actions">
          <button type="submit" [disabled]="form.invalid || form.pristine" class="btn btn-primary">
            {{ 'common.save' | translate }}
          </button>
        </div>
      </form>

      <div class="card" style="margin-top: 2rem;">
        <h3>Gestion des données</h3>
        <p class="hint" style="margin-bottom: 1.5rem;">
          Exportez votre backlog actuel ou importez un nouveau projet à partir d'un fichier JSON.
        </p>
        <div class="data-actions">
          <input
            type="file"
            #fileInput
            style="display: none"
            (change)="importJson($event)"
            accept=".json"
          />
          <button (click)="fileInput.click()" class="btn btn-secondary">
            Importer un Backlog (JSON)
          </button>
          <button (click)="exportJson()" class="btn btn-secondary">
            Exporter le Backlog (JSON)
          </button>
        </div>
      </div>

      <div class="danger-zone">
        <h3>Danger Zone</h3>
        <button (click)="resetApp()" class="btn btn-danger">Reset App Data</button>
      </div>

      @if (showImportModal()) {
      <app-import-modal
        [itemCount]="itemsToImport().length"
        [projectName]="importedProjectName()"
        (action)="handleImportAction($event)"
      />
      }
    </div>
  `,
  styles: [
    `
      .ps-container {
        max-width: 600px;
        margin: 0 auto;
      }
      .header {
        margin-bottom: 2.5rem;
        padding-top: 1rem;
      }
      .context-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: #6c757d;
        font-weight: 600;
        margin-bottom: 0.25rem;
        display: block;
      }
      .header h2 {
        margin: 0;
        font-size: 2.5rem;
        font-weight: 800;
        background: linear-gradient(135deg, var(--brand-red) 0%, #a31227 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -0.03em;
        line-height: 1.1;
      }
      .card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      h3 {
        margin-top: 0;
        font-size: 1.1rem;
        border-bottom: 1px solid #eee;
        padding-bottom: 0.5rem;
      }
      .form-group {
        margin-bottom: 1rem;
      }
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      .form-control {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ced4da;
        border-radius: 4px;
      }
      .actions {
        text-align: right;
      }
      /* Button styles inherited */
      .data-actions {
        display: flex;
        gap: 1rem;
      }
      .danger-zone {
        border-top: 1px solid #dc3545;
        padding-top: 1rem;
        margin-top: 3rem;
      }
      .hint {
        display: block;
        margin-top: 0.25rem;
        color: #6c757d;
        font-size: 0.875rem;
      }
    `,
  ],
})
export class SettingsComponent {
  private fb = inject(FormBuilder);
  private repo = inject(SettingsRepository);
  private backlogRepo = inject(BacklogRepository);
  private profilesRepo = inject(ProfilesRepository);
  private storage = inject(LocalStorageService);
  private i18n = inject(I18nService);
  private calc = inject(CalculationService);

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
        .replace(/\s+/g, '-')
      }-export-${date}.json`;
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
    if (
      confirm(
        'ATTENTION: Cela va effacer toutes les données (Profils, Backlog, Settings). Continuer ?'
      )
    ) {
      this.storage.clear();
      window.location.reload();
    }
  }
}
