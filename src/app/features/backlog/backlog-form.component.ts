import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BacklogItem } from '../../core/models/domain.model';
import { CalculationService } from '../../core/services/calculation.service';
import { IdService } from '../../core/services/id.service';
import { BacklogRepository } from '../../data/backlog.repository';
import { ProfilesRepository } from '../../data/profiles.repository';
import { ZardSheetRef } from '../../shared/components/sheet/sheet-ref';
import { Z_SHEET_DATA } from '../../shared/components/sheet/sheet.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-backlog-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './backlog-form.component.html',
  styleUrls: ['./backlog-form.component.css'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class BacklogFormComponent {
  private fb = inject(FormBuilder);
  private repo = inject(BacklogRepository);
  private profilesRepo = inject(ProfilesRepository);
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
    product: ['', Validators.required],
    cluster: ['', Validators.required],
    description: [''],
    hypotheses: [''],
    comments: [''],
    scope: ['MVP', Validators.required],
    moscow: ['MUST', Validators.required],
    chargeType: ['days', Validators.required],
    effortDays: [1, [Validators.required, Validators.min(0)]],
    profileId: ['', Validators.required],
  });

  isEditMode = signal(false);

  calculatedCost = computed(() => {
    return this.currentCost();
  });

  // Autocomplete data
  existingProducts = computed(() => {
    const items = this.repo.getAll();
    return [...new Set(items.map((i) => i.product).filter((p) => !!p))].sort();
  });

  existingClusters = computed(() => {
    const items = this.repo.getAll();
    const prod = this.currentProductInput();
    const filtered = prod ? items.filter((i) => i.product === prod) : items;
    return [...new Set(filtered.map((i) => i.cluster).filter((c) => !!c))].sort();
  });

  existingTitles = computed(() => {
    const items = this.repo.getAll();
    const prod = this.currentProductInput();
    const clust = this.currentClusterInput();

    let filtered = items;
    if (prod) filtered = filtered.filter((i) => i.product === prod);
    if (clust) filtered = filtered.filter((i) => i.cluster === clust);

    return [...new Set(filtered.map((i) => i.title).filter((t) => !!t))].sort();
  });

  currentProductInput = signal('');
  currentClusterInput = signal('');
  private currentCost = signal(0);

  isProductInputMode = signal(false);
  isClusterInputMode = signal(false);
  isTitleInputMode = signal(false);

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
        this.isProductInputMode.set(this.existingProducts().length === 0);
        this.isClusterInputMode.set(true);
        this.isTitleInputMode.set(true);
      }
    }

    this.form.valueChanges.subscribe(() => this.updateCost());
    this.form.controls.product.valueChanges.subscribe((val) =>
      this.currentProductInput.set(val || ''),
    );
    this.form.controls.cluster.valueChanges.subscribe((val) =>
      this.currentClusterInput.set(val || ''),
    );

    this.updateCost();
  }

  private initForm(item: Partial<BacklogItem>) {
    if (item.id) {
      this.isEditMode.set(true);
    }
    this.form.patchValue(item as any);
    this.currentProductInput.set(item.product || '');
    this.currentClusterInput.set(item.cluster || '');

    if (item.product) {
      this.isProductInputMode.set(!this.existingProducts().includes(item.product));
    }
    if (item.cluster) {
      this.isClusterInputMode.set(!this.existingClusters().includes(item.cluster));
    }
    if (item.title) {
      this.isTitleInputMode.set(!this.existingTitles().includes(item.title));
    } else if (!item.id) {
      // Default to text input for new items
      this.isTitleInputMode.set(true);
    }
  }

  onProductSelect(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (val === '__NEW__') {
      this.isProductInputMode.set(true);
      this.form.controls.product.setValue('');
    } else {
      // Logic to reset dependent fields if needed
      // Check if current cluster exists for new product (unlikely, but good to reset)
      // We rely on existingClusters computed to update based on valueChanges
      // But we might want to force cluster mode check after a tick or assume false
      setTimeout(() => {
        this.isClusterInputMode.set(this.existingClusters().length === 0);
      });
    }
  }

  onClusterSelect(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (val === '__NEW__') {
      this.isClusterInputMode.set(true);
      this.form.controls.cluster.setValue('');
    } else {
      setTimeout(() => {
        this.isTitleInputMode.set(this.existingTitles().length === 0);
      });
    }
  }

  onTitleSelect(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (val === '__NEW__') {
      this.isTitleInputMode.set(true);
      this.form.controls.title.setValue('');
    }
  }

  switchToProductSelect() {
    this.isProductInputMode.set(false);
  }

  switchToClusterSelect() {
    this.isClusterInputMode.set(false);
  }

  switchToTitleSelect() {
    this.isTitleInputMode.set(false);
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
