import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BacklogItem, BacklogItemType, ChargeType, Profile } from '../../core/models/domain.model';
import { BacklogService } from '../../core/services/backlog.service';
import { CalculationService } from '../../core/services/calculation.service';
import { IdService } from '../../core/services/id.service';
import { ProjectsService } from '../../core/services/projects.service';
import { BacklogRepository } from '../../data/backlog.repository';
import { ClustersRepository } from '../../data/clusters.repository';
import { ProductsRepository } from '../../data/products.repository';
import { ProfilesRepository } from '../../data/profiles.repository';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardDialogService } from '../../shared/components/dialog/dialog.service';
import { ZardFormImports } from '../../shared/components/form/form.imports';
import { HistoryDialogComponent } from '../../shared/components/history-dialog/history-dialog.component';
import { ZardInputDirective } from '../../shared/components/input';
import { ZardSheetRef } from '../../shared/components/sheet/sheet-ref';
import { Z_SHEET_DATA } from '../../shared/components/sheet/sheet.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { generateId } from '../../shared/utils/merge-classes';

@Component({
  selector: 'app-backlog-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    FormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    ZardFormImports,
  ],
  templateUrl: './backlog-form.component.html',
  styleUrls: ['./backlog-form.component.css'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class BacklogFormComponent {
  protected readonly idProduct = generateId('product');
  protected readonly idCluster = generateId('cluster');
  protected readonly idTitle = generateId('title');
  protected readonly idDescription = generateId('description');
  protected readonly idHypotheses = generateId('hypotheses');
  protected readonly idComments = generateId('comments');
  protected readonly idScope = generateId('scope');
  protected readonly idMoscow = generateId('moscow');
  protected readonly idProfile = generateId('profile');
  protected readonly idChargeType = generateId('chargeType');
  protected readonly idType = generateId('type');
  protected readonly idEffort = generateId('effort');

  private fb = inject(FormBuilder);
  private repo = inject(BacklogRepository);
  private profilesRepo = inject(ProfilesRepository);
  private productsRepo = inject(ProductsRepository);
  private clustersRepo = inject(ClustersRepository);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private idService = inject(IdService);
  private calc = inject(CalculationService);
  private projectsService = inject(ProjectsService);
  private backlogService = inject(BacklogService);
  private dialogService = inject(ZardDialogService);
  private sheetRef = inject(ZardSheetRef, { optional: true });
  private zData = inject(Z_SHEET_DATA, { optional: true });
  isSheetMode = !!this.sheetRef;
  profiles = signal<Profile[]>([]);

  form = this.fb.group({
    id: [''],
    title: ['', Validators.required],
    productId: ['', Validators.required],
    clusterId: ['', Validators.required],
    description: [''],
    hypotheses: [''],
    comments: [''],
    scope: ['MVP'],
    moscow: ['MUST'],
    type: ['build' as BacklogItemType, Validators.required],
    chargeType: ['days' as ChargeType, Validators.required],
    effortDays: [1, [Validators.required, Validators.min(0)]],
    profileId: [''],
  });

  isEditMode = signal(false);

  calculatedCost = computed(() => {
    return this.currentCost();
  });

  // Data sources
  private refreshSignal = signal(0);

  allProducts = computed(() => {
    this.refreshSignal();
    return this.productsRepo.getAll();
  });

  availableClusters = computed(() => {
    this.refreshSignal();
    const pid = this.currentProductId();
    if (!pid) return [];
    return this.clustersRepo.getByProductId(pid);
  });

  // Inputs for new creation
  newProductName = signal('');
  newClusterName = signal('');

  public currentProductId = signal<string>('');
  private currentClusterId = signal('');
  private currentItem = signal<BacklogItem | null>(null);
  private currentCost = signal(0);

  isProductInputMode = signal(false);
  isClusterInputMode = signal(false);

  constructor() {
    const projectId = this.projectsService.currentProjectId();
    if (projectId) {
      this.profilesRepo.getAll(projectId).subscribe((p) => {
        const active = p.filter((x) => x.active);
        this.profiles.set(active);

        // Set default profile if available and not in edit mode
        if (active.length > 0 && !this.isEditMode()) {
          this.form.patchValue({ profileId: active[0].id });
        }
      });
    }

    if (this.zData) {
      this.initForm(this.zData as BacklogItem);
    } else {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        const item = this.repo.getAll().find((i) => i.id === id);
        if (item) {
          this.initForm(item);
        }
      } else {
        // Check for defaults passed via openAddItemWithDefaults
        // passed as zData but typed loosely above
        // If zData has productId/clusterId but no id, it's defaults
        const defaults = this.zData as any;
        if (defaults && (defaults.productId || defaults.clusterId)) {
          this.form.patchValue({
            productId: defaults.productId || '',
            clusterId: defaults.clusterId || '',
          });
        }
      }
    }

    this.form.valueChanges.subscribe(() => this.updateCost());
    this.form.controls.productId.valueChanges.subscribe((val) =>
      this.currentProductId.set(val || ''),
    );
    this.form.controls.clusterId.valueChanges.subscribe((val) =>
      this.currentClusterId.set(val || ''),
    );
    this.form.controls.type.valueChanges.subscribe((val) => {
      if (val === 'build' && this.form.controls.chargeType.value === 'ratio') {
        this.form.controls.chargeType.setValue('days');
      }
    });

    this.updateCost();
  }

  private initForm(item: Partial<BacklogItem>) {
    if (item.id) {
      this.isEditMode.set(true);
      this.currentItem.set(item as BacklogItem);
    }
    this.form.patchValue(item as any);
    this.currentProductId.set(item.productId || '');
    this.currentClusterId.set(item.clusterId || '');
  }

  onProductSelect(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (val === '__NEW__') {
      this.isProductInputMode.set(true);
      this.form.controls.productId.setValue('');
    } else {
      this.isProductInputMode.set(false);
      // Reset cluster when product changes
      this.form.controls.clusterId.setValue('');
    }
  }

  onClusterSelect(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (val === '__NEW__') {
      this.isClusterInputMode.set(true);
      this.form.controls.clusterId.setValue('');
    } else {
      this.isClusterInputMode.set(false);
    }
  }

  saveNewProduct() {
    // API call should be here, but for now we leave it local-ish
    // or update repo to save via API which returns Observable
    // For this simplified pass, we rely on repository save logic
    const name = this.newProductName().trim();
    if (name) {
      const p = {
        id: 'product-new',
        name,
        projectId: this.projectsService.currentProjectId()!,
      };
      this.productsRepo.save(p).subscribe((saved) => {
        this.refreshSignal.update((v) => v + 1);
        this.isProductInputMode.set(false);
        this.form.controls.productId.setValue(saved.id);
        this.newProductName.set('');

        // Auto-trigger new cluster mode
        this.isClusterInputMode.set(true);
        this.form.controls.clusterId.setValue('');
      });
    }
  }

  cancelNewProduct() {
    this.isProductInputMode.set(false);
    this.newProductName.set('');
    // If we were on new product and cancelled, we might want to revert to empty or previous?
    this.form.controls.productId.setValue(''); // Reset selection
  }

  saveNewCluster() {
    const name = this.newClusterName().trim();
    const pid = this.currentProductId();
    if (name && pid) {
      const c = {
        id: 'cluster-new',
        name,
        productId: pid,
        projectId: this.projectsService.currentProjectId()!,
      };
      this.clustersRepo.save(c).subscribe((saved) => {
        this.refreshSignal.update((v) => v + 1);
        this.isClusterInputMode.set(false);
        this.form.controls.clusterId.setValue(saved.id);
        this.newClusterName.set('');
      });
    }
  }

  cancelNewCluster() {
    this.isClusterInputMode.set(false);
    this.newClusterName.set('');
    this.form.controls.clusterId.setValue('');
  }

  totalBuildEffort = computed(() => {
    const allItems = this.repo.getAll();
    const currentId = this.form.get('id')?.value;
    const items = currentId ? allItems.filter((i) => i.id !== currentId) : allItems;
    return this.calc.calculateTotalBuildEffort(items);
  });

  updateCost() {
    const val = this.form.value;
    const profile = this.profiles().find((p) => p.id === val.profileId);
    if (profile && val.effortDays != undefined) {
      this.currentCost.set(
        this.calc.getItemCost(val as BacklogItem, this.totalBuildEffort(), profile.dailyRate),
      );
    } else {
      this.currentCost.set(0);
    }
  }

  save(): boolean {
    // If input modes are active, we might want to block or auto-save
    // For now, let's just return false if inputs are pending and invalid
    if (this.isProductInputMode()) {
      this.saveNewProduct();
      if (this.isProductInputMode()) return false;
    }
    if (this.isClusterInputMode()) {
      this.saveNewCluster();
      if (this.isClusterInputMode()) return false;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return false;
    }
    const val = this.form.value as any;

    if (!val.id) {
      // Backend handles ID generation for new items
      // val.id = this.idService.generate();
      delete val.id; // ensure it is undefined/null
    }

    // Ensure projectId is set
    val.projectId = this.projectsService.currentProjectId()!;

    this.repo.save(val as BacklogItem).subscribe(() => {
      if (!this.isSheetMode) {
        this.router.navigate(['/backlog']);
      }
      // Since saving is async, the sheet closing relies on the sheetService callback which expects bool.
      // This is tricky. The sheet callback `zOnOk` in `BacklogListComponent` calls `instance.save()`.
      // If `save()` returns true, it closes.
      // But `save()` is now async.
      // We need to handle this manually or change the sheet flow.
      // For now, we can rely on `this.sheetRef.close()` if injected?
      if (this.sheetRef) {
        this.sheetRef.close(true);
      }
    });

    return false; // Return false to prevent automatic close, we close manually in subscribe
  }

  openHistory() {
    const id = this.form.get('id')?.value;
    if (id) {
      this.backlogService.getItemHistory(id).subscribe((history) => {
        // Fallback to form values if currentItem signal is null
        const itemToPass = this.currentItem() || {
          ...this.form.getRawValue(),
          id, // ensure ID is present
        };

        this.dialogService.create({
          zContent: HistoryDialogComponent,
          zData: {
            history,
            item: itemToPass,
            profiles: this.profiles(),
            products: this.allProducts(),
            clusters: this.availableClusters(),
          },
          zWidth: '85vw',
          zCustomClasses:
            'max-w-none !max-w-none h-[80vh] m-0 rounded-xl p-0 border-none shadow-2xl',
          zClosable: false,
          zHideFooter: true,
        });
      });
    }
  }
}
