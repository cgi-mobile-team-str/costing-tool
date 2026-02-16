import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { BacklogItem, Cluster, Product, Profile } from '../../core/models/domain.model';
import { CalculationService } from '../../core/services/calculation.service';
import { ExcelService } from '../../core/services/excel.service';
import { I18nService, Lang } from '../../core/services/i18n.service';
import { ProjectsService } from '../../core/services/projects.service';
import { BacklogRepository } from '../../data/backlog.repository';
import { ClustersRepository } from '../../data/clusters.repository';
import { ProductsRepository } from '../../data/products.repository';
import { ProfilesRepository } from '../../data/profiles.repository';
import { SettingsRepository } from '../../data/settings.repository';
import { ZardAlertDialogService } from '../../shared/components/alert-dialog/alert-dialog.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ImportModalComponent } from '../backlog/import-modal.component';

import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, ImportModalComponent],
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
  private i18n = inject(I18nService);
  private calc = inject(CalculationService);
  private alertDialogService = inject(ZardAlertDialogService);
  private projectsService = inject(ProjectsService);
  private authService = inject(MsalService);
  private excelService = inject(ExcelService);

  showImportModal = signal(false);
  itemsToImport = signal<BacklogItem[]>([]);
  profilesToImport = signal<Profile[]>([]);
  productsToImport = signal<Product[]>([]);
  clustersToImport = signal<Cluster[]>([]);
  importedProjectName = signal('');

  settings = signal(this.repo.get());
  currentProjectName = this.projectsService.currentProjectName;

  // User Info Claims
  userClaims = signal<any>(null);

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

    // Extract claims
    let account = this.authService.instance.getActiveAccount();

    if (!account) {
      const allAccounts = this.authService.instance.getAllAccounts();
      if (allAccounts.length > 0) {
        account = allAccounts[0];
        this.authService.instance.setActiveAccount(account);
      }
    }

    if (account) {
      this.userClaims.set(account.idTokenClaims);
    }
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
              this.projectsService.updateProject(projectId, { name: val.projectName }).subscribe();
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
    const products = this.productsRepo.getAll();
    const clusters = this.clustersRepo.getAll();
    const projectId = this.projectsService.currentProjectId();

    if (projectId) {
      this.profilesRepo.getAll(projectId).subscribe((profiles) => {
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
      });
    }
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

  isImportingExcel = signal(false);

  async importExcel(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const currentProjectId = this.projectsService.currentProjectId();
    if (!currentProjectId) {
      alert("Veuillez sélectionner un projet d'abord.");
      return;
    }

    this.isImportingExcel.set(true);

    try {
      const extractedProfiles = await this.excelService.extractProfiles(file);
      const extractedBacklog = await this.excelService.extractBacklog(file);

      if (extractedProfiles.length === 0 && extractedBacklog.items.length === 0) {
        alert('Aucune donnée trouvée dans le fichier Excel.');
        this.isImportingExcel.set(false);
        return;
      }

      this.alertDialogService.confirm({
        zTitle: 'Importer depuis Excel',
        zContent: `
          <div class="space-y-4 py-2">
            <style>
              .import-option-card {
                border: 2px solid #e2e8f0;
                transition: all 0.2s ease;
              }
              .import-option-card:hover {
                border-color: #fca5a5;
              }
              .import-option-card:has(input:checked) {
                border-color: #b91c1c !important;
                background-color: #fef2f2 !important;
                box-shadow: 0 0 0 1px #b91c1c;
              }
              .import-option-card input:checked {
                accent-color: #b91c1c;
              }
            </style>
            <p class="text-base text-slate-700">Voulez-vous importer <span class="font-bold text-red-700">${extractedProfiles.length} profils</span> et <span class="font-bold text-red-700">${extractedBacklog.items.length} items</span> de backlog ?</p>
            
            <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p class="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Mode d'importation :</p>
              
              <div class="space-y-3">
                <label class="import-option-card flex items-start gap-3 p-3 bg-white rounded-md cursor-pointer">
                  <input type="radio" name="import-mode" value="add-only" checked 
                    class="mt-1 w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500" 
                    style="accent-color: #b91c1c; min-width: 16px; min-height: 16px; visibility: visible !important; opacity: 1 !important; position: static !important;" />
                  <div>
                    <span class="block text-sm font-semibold text-slate-800">Ajouter uniquement</span>
                    <span class="block text-xs text-slate-500">Ajoute les nouveaux produits/clusters/items. Ignore ceux déjà présents (détection par nom/titre).</span>
                  </div>
                </label>
                
                <label class="import-option-card flex items-start gap-3 p-3 bg-white rounded-md cursor-pointer">
                  <input type="radio" name="import-mode" value="upsert" 
                    class="mt-1 w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500" 
                    style="accent-color: #b91c1c; min-width: 16px; min-height: 16px; visibility: visible !important; opacity: 1 !important; position: static !important;" />
                  <div>
                    <span class="block text-sm font-semibold text-slate-800">Mettre à jour tout (Sync)</span>
                    <span class="block text-xs text-slate-500">Ajoute les nouveaux ET met à jour les éléments existants si leurs propriétés (dont les charges) ont changé.</span>
                  </div>
                </label>
              </div>
            </div>
            
            <p class="text-xs text-slate-400 italic">Note: La détection des doublons se base sur le nom du produit, du cluster et le titre de l'item.</p>
          </div>
        `,
        zOkText: 'Importer',
        zOnOk: async () => {
          const projectId = currentProjectId;

          // Get selected import mode
          const selectedMode =
            (document.querySelector('input[name="import-mode"]:checked') as HTMLInputElement)
              ?.value || 'add-only';
          const isAddOnlyMode = selectedMode === 'add-only';

          // 0. Fetch existing data to avoid duplicates
          const [existingProfiles, hierarchy] = await Promise.all([
            lastValueFrom(this.profilesRepo.getAll(projectId)),
            lastValueFrom(this.backlogRepo.getFullBacklog(projectId)),
          ]);

          const existingProducts = (hierarchy as any).products as Product[];
          const existingClusters = (hierarchy as any).clusters as Cluster[];

          let addedCount = 0;
          let updatedCount = 0;
          let skippedCount = 0;

          // Helper to check if profile has changed
          const hasProfileChanged = (
            existing: Profile,
            incoming: { role: string; username?: string | null; tjm: number; scr: number },
          ) => {
            return (
              existing.name !== incoming.role ||
              existing.username !== (incoming.username || '') ||
              Number(existing.dailyRate) !== Number(incoming.tjm) ||
              Number(existing.scr) !== Number(incoming.scr)
            );
          };

          // 1. Import Profiles
          const savedProfiles: Profile[] = [];
          for (const p of extractedProfiles) {
            const existing = existingProfiles.find((ep: Profile) => ep.name === p.role);

            if (existing) {
              if (isAddOnlyMode) {
                // Skip existing in add-only mode
                savedProfiles.push(existing);
                skippedCount++;
                continue;
              }

              // Check if there are actual changes
              if (!hasProfileChanged(existing, p)) {
                savedProfiles.push(existing);
                skippedCount++;
                continue;
              }
            }

            const profile: Profile = {
              id: existing ? existing.id : '',
              name: p.role,
              username: p.username || '',
              dailyRate: p.tjm,
              scr: p.scr,
              active: true,
            };
            const saved = await lastValueFrom(this.profilesRepo.save(profile, projectId));
            savedProfiles.push(saved);

            if (existing) updatedCount++;
            else addedCount++;
          }

          // 2. Import Products (Upsert) - Excel Clusters
          const productMap = new Map<string, string>();
          for (const productName of extractedBacklog.products) {
            const existing = existingProducts.find((ep) => ep.name === productName);

            if (existing && isAddOnlyMode) {
              productMap.set(productName, existing.id);
              continue;
            }

            const product: Product = {
              id: existing ? existing.id : '',
              name: productName,
            };
            const saved = await lastValueFrom(this.productsRepo.save(product));
            productMap.set(productName, saved.id);
          }

          // 3. Import Clusters (Upsert) - Excel Features
          const clusterMap = new Map<string, string>();
          for (const c of extractedBacklog.clusters) {
            const productId = productMap.get(c.productName);
            if (productId) {
              const existing = existingClusters.find(
                (ec: Cluster) => ec.name === c.name && ec.productId === productId,
              );

              if (existing && isAddOnlyMode) {
                clusterMap.set(c.productName + c.name, existing.id);
                continue;
              }

              const cluster: Cluster = {
                id: existing ? existing.id : '',
                name: c.name,
                productId,
              };
              const saved = await lastValueFrom(this.clustersRepo.save(cluster));
              clusterMap.set(c.productName + c.name, saved.id);
            }
          }

          // 4. Import Backlog Items (Upsert) - Excel Tasks
          for (const item of extractedBacklog.items) {
            const productId = productMap.get(item.productName);
            const clusterId = clusterMap.get(item.productName + item.clusterName);
            const profile = savedProfiles.find((p) => p.name === item.profileName);

            if (productId && clusterId && profile) {
              const existingItem = hierarchy.items.find(
                (ei: BacklogItem) =>
                  ei.title === item.title &&
                  ei.clusterId === clusterId &&
                  ei.profileId === profile.id,
              );

              if (existingItem) {
                if (isAddOnlyMode) {
                  // Skip existing item in add-only mode
                  continue;
                }

                // Check if item has actually changed (handle string vs number for effortDays)
                const mappedMoscow = item.scope === 'S1' ? 'MUST' : 'SHOULD';
                const hasChanged =
                  existingItem.title !== item.title ||
                  existingItem.description !== item.description ||
                  Number(existingItem.effortDays) !== Number(item.effort) ||
                  existingItem.chargeType !== item.chargeType ||
                  existingItem.scope !== item.scope ||
                  existingItem.moscow !== mappedMoscow;

                if (!hasChanged) {
                  // No changes, skip
                  continue;
                }
              }

              const backlogItem: any = {
                id: existingItem ? existingItem.id : '',
                title: item.title,
                description: item.description,
                productId,
                clusterId,
                profileId: profile.id,
                effortDays: item.effort,
                chargeType: item.chargeType,
                moscow: item.scope === 'S1' ? 'MUST' : 'SHOULD',
                type: 'build',
                scope: item.scope || 'MVP',
                projectId: currentProjectId,
              };
              await lastValueFrom(this.backlogRepo.save(backlogItem));

              if (existingItem) updatedCount++;
              else addedCount++;
            }
          }

          this.isImportingExcel.set(false);

          const summary = isAddOnlyMode
            ? `Importation terminée !\n${addedCount} nouveaux éléments ajoutés\n${skippedCount} doublons ignorés`
            : `Importation terminée !\n${addedCount} nouveaux éléments\n${updatedCount} éléments mis à jour`;

          alert(summary);
          window.location.reload();
        },
        zOnCancel: () => {
          this.isImportingExcel.set(false);
        },
      });
    } catch (err: any) {
      this.isImportingExcel.set(false);
      alert('Erreur lors de la lecture du fichier Excel: ' + err.message);
      console.error(err);
    }
    event.target.value = '';
  }

  handleImportAction(event: { type: 'add' | 'replace' | 'cancel'; projectName: string }) {
    const items = this.itemsToImport();
    const profiles = this.profilesToImport();
    const products = this.productsToImport();
    const clusters = this.clustersToImport();

    const projectId = this.projectsService.currentProjectId();
    if (!projectId && event.type !== 'cancel') {
      alert('Aucun projet sélectionné.');
      return;
    }

    if (event.type !== 'cancel') {
      const current = this.repo.get();
      this.repo.save({ ...current, projectName: event.projectName });
      this.form.patchValue({ projectName: event.projectName });

      if (event.type === 'add' && projectId) {
        // Add profiles if they don't exist by ID
        this.profilesRepo.getAll(projectId).subscribe((existingProfiles) => {
          profiles.forEach((p) => {
            if (!existingProfiles.some((ep: Profile) => ep.id === p.id)) {
              this.profilesRepo.save(p, projectId!).subscribe();
            }
          });
        });

        // Add products and clusters similarly
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
        // Since we don't have a clear "delete all profiles for project" yet,
        // we'll just save them. If ID conflicts, it updates.
        profiles.forEach((p) => {
          this.profilesRepo.save(p, projectId!).subscribe();
        });

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

  deleteCurrentProject() {
    const projectId = this.projectsService.currentProjectId();
    const projectName = this.currentProjectName();

    if (!projectId) return;

    this.alertDialogService.confirm({
      zTitle: this.i18n.translate('settings.delete_project'),
      zDescription: this.i18n
        .translate('settings.confirm_delete_project')
        .replace('{name}', projectName || ''),
      zOkText: this.i18n.translate('settings.delete_project'),
      zOkDestructive: true,
      zOnOk: () => {
        this.projectsService.deleteProject(projectId).subscribe({
          next: () => {
            alert('Projet supprimé avec succès.');
            window.location.href = '/select-project';
          },
          error: (err) => {
            alert('Erreur lors de la suppression du projet.');
            console.error(err);
          },
        });
      },
    });
  }
}
