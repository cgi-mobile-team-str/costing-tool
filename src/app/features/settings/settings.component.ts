import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BacklogItem, Cluster, Product, Profile } from '../../core/models/domain.model';
import { CalculationService } from '../../core/services/calculation.service';
import { I18nService, Lang } from '../../core/services/i18n.service';
import { LocalStorageService } from '../../core/services/local-storage.service';
import { ProjectsService } from '../../core/services/projects.service';
import { BacklogRepository } from '../../data/backlog.repository';
import { ClustersRepository } from '../../data/clusters.repository';
import { ProductsRepository } from '../../data/products.repository';
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
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent {
  private fb = inject(FormBuilder);
  private repo = inject(SettingsRepository);
  private backlogRepo = inject(BacklogRepository);
  private profilesRepo = inject(ProfilesRepository);
  private productsRepo = inject(ProductsRepository);
  private clustersRepo = inject(ClustersRepository);
  private storage = inject(LocalStorageService);
  private i18n = inject(I18nService);
  private calc = inject(CalculationService);
  private alertDialogService = inject(ZardAlertDialogService);
  private projectsService = inject(ProjectsService);

  showImportModal = signal(false);
  itemsToImport = signal<BacklogItem[]>([]);
  profilesToImport = signal<Profile[]>([]);
  productsToImport = signal<Product[]>([]);
  clustersToImport = signal<Cluster[]>([]);
  importedProjectName = signal('');

  settings = signal(this.repo.get());
  currentProjectName = this.projectsService.currentProjectName;

  form = this.fb.group({
    projectName: ['', Validators.required],
    currency: ['EUR', Validators.required],
  });

  currentLang = this.i18n.getLang.bind(this.i18n);

  constructor() {
    const s = this.repo.get();
    this.form.patchValue({
      projectName: this.currentProjectName() || s.projectName || '',
      currency: s.currency,
    });
  }

  save() {
    if (this.form.valid) {
      const val = this.form.value;
      const current = this.repo.get();

      this.alertDialogService.confirm({
        zTitle: this.i18n.translate('settings.confirm_save_title'),
        zDescription: this.i18n.translate('settings.confirm_save_desc'),
        zOkText: this.i18n.translate('common.save'),
        zOnOk: () => {
          const newSettings = {
            ...current,
            projectName: val.projectName || current.projectName,
            currency: val.currency || 'EUR',
          };
          this.repo.save(newSettings);
          this.settings.set(newSettings);

          // Sync with global project name and backend
          if (val.projectName) {
            const projectId = this.projectsService.currentProjectId();
            if (projectId) {
              this.projectsService.updateProject(Number(projectId), val.projectName).subscribe();
            } else {
              // Fallback if no project ID (should not happen in main app)
              this.projectsService.setProjectName(val.projectName);
            }
          }

          this.form.markAsPristine();
          // Removed alert('Settings saved') for better UX with dialog
        },
      });
    }
  }

  exportJson() {
    const s = this.repo.get();
    const items = this.backlogRepo.getAll();
    const profiles = this.profilesRepo.getAll();
    const products = this.productsRepo.getAll();
    const clusters = this.clustersRepo.getAll();

    const data = {
      projectName: s.projectName,
      exportDate: new Date().toISOString(),
      products,
      clusters,
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
        let products: Product[] = [];
        let clusters: Cluster[] = [];
        let projectName = '';

        if (content.items && content.projectName) {
          items = content.items as BacklogItem[];
          profiles = (content.profiles || []) as Profile[];
          products = (content.products || []) as Product[];
          clusters = (content.clusters || []) as Cluster[];
          projectName = content.projectName;
        } else if (Array.isArray(content)) {
          // Legacy handling or error? assuming basic import
          items = content as BacklogItem[];
          projectName = 'Project Imported';
        }

        if (Array.isArray(items)) {
          this.itemsToImport.set(items);
          this.profilesToImport.set(profiles);
          this.productsToImport.set(products);
          this.clustersToImport.set(clusters);
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
    const products = this.productsToImport();
    const clusters = this.clustersToImport();

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

        // Add products and clusters similarly (or just overwrite if conflicting? Safe to add if ID not exists)
        const existingProducts = this.productsRepo.getAll();
        products.forEach((p) => {
          if (!existingProducts.some((ep) => ep.id === p.id)) {
            this.productsRepo.save(p);
          }
        });

        const existingClusters = this.clustersRepo.getAll();
        clusters.forEach((c) => {
          if (!existingClusters.some((ec) => ec.id === c.id)) {
            this.clustersRepo.save(c);
          }
        });

        items.forEach((item) => this.backlogRepo.save(item));
      } else if (event.type === 'replace') {
        if (profiles.length > 0) {
          this.profilesRepo.saveBulk(profiles);
        }
        if (products.length > 0) this.productsRepo.saveBulk(products);
        if (clusters.length > 0) this.clustersRepo.saveBulk(clusters);

        this.backlogRepo.saveBulk(items);
      }
      alert('Importation réussie');
    }

    this.showImportModal.set(false);
    this.itemsToImport.set([]);
    this.profilesToImport.set([]);
    this.productsToImport.set([]);
    this.clustersToImport.set([]);
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
