import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BacklogItem, BacklogItemType, ChargeType } from '../../core/models/domain.model';
import { CalculationService } from '../../core/services/calculation.service';
import { IdService } from '../../core/services/id.service';
import { BacklogRepository } from '../../data/backlog.repository';
import { ClustersRepository } from '../../data/clusters.repository';
import { ProductsRepository } from '../../data/products.repository';
import { ProfilesRepository } from '../../data/profiles.repository';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardFormImports } from '../../shared/components/form/form.imports';
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
  private sheetRef = inject(ZardSheetRef, { optional: true });
  private zData = inject(Z_SHEET_DATA, { optional: true });
  isSheetMode = !!this.sheetRef;
  profiles = signal(this.profilesRepo.getAll().filter((p) => p.active));

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

  currentProductId = signal('');
  currentClusterId = signal('');
  private currentCost = signal(0);

  isProductInputMode = signal(false);
  isClusterInputMode = signal(false);

  constructor() {
    // Set default profile if available
    const active = this.profiles();
    if (active.length > 0) {
      this.form.patchValue({ profileId: active[0].id });
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
    const name = this.newProductName().trim();
    if (name) {
      const p = { id: this.idService.generate(), name };
      this.productsRepo.save(p);
      this.refreshSignal.update((v) => v + 1);
      this.isProductInputMode.set(false);
      this.form.controls.productId.setValue(p.id);
      this.newProductName.set('');

      // Auto-trigger new cluster mode
      this.isClusterInputMode.set(true);
      this.form.controls.clusterId.setValue('');
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
      const c = { id: this.idService.generate(), name, productId: pid };
      this.clustersRepo.save(c);
      this.refreshSignal.update((v) => v + 1);
      this.isClusterInputMode.set(false);
      this.form.controls.clusterId.setValue(c.id);
      this.newClusterName.set('');
    }
  }

  cancelNewCluster() {
    this.isClusterInputMode.set(false);
    this.newClusterName.set('');
    this.form.controls.clusterId.setValue('');
  }

  updateCost() {
    const val = this.form.value;
    const profile = this.profiles().find((p) => p.id === val.profileId);
    if (profile && val.effortDays != undefined) {
      this.currentCost.set(this.calc.calculateItemCost(val.effortDays, profile.dailyRate));
    } else {
      this.currentCost.set(0);
    }
  }

  save(): boolean {
    if (this.isProductInputMode()) {
      this.saveNewProduct(); // Auto save if still in input mode? Or block?
      // If user typed name but didn't click check, let's assume valid if not empty
      if (this.isProductInputMode()) return false; // Prevent submit if create specific UI is pending
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
      val.id = this.idService.generate();
    }

    this.repo.save(val as BacklogItem);

    if (!this.isSheetMode) {
      this.router.navigate(['/backlog']);
    }
    return true;
  }
}
