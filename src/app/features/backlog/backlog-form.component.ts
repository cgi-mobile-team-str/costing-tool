import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
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
  template: `
    <div class="form-container">
      <form [formGroup]="form" (ngSubmit)="save()">
        <!-- Hierarchy: Product > Cluster > Feature -->
        <div class="row">
          <div class="form-group col">
            <label>{{ 'backlog.product' | translate }}</label>

            @if (!isProductInputMode() && existingProducts().length > 0) {
            <div class="input-group">
              <select
                [value]="form.controls.product.value"
                (change)="onProductSelect($event)"
                class="form-control"
              >
                <option value="" disabled selected>Sélectionner...</option>
                @for (p of existingProducts(); track p) {
                <option [value]="p">{{ p }}</option>
                }
                <option value="__NEW__">➕ Nouveau Produit...</option>
              </select>
            </div>
            } @else {
            <div class="input-group d-flex">
              <input
                type="text"
                formControlName="product"
                class="form-control"
                placeholder="ex: Mobile App"
              />
              @if(existingProducts().length > 0) {
              <button
                type="button"
                (click)="switchToProductSelect()"
                class="btn btn-sm btn-outline"
                title="Choisir existant"
              >
                📋
              </button>
              }
            </div>
            }
          </div>

          <div class="form-group col">
            <label>{{ 'backlog.cluster' | translate }}</label>
            @if (!isClusterInputMode() && existingClusters().length > 0) {
            <div class="input-group">
              <select
                [value]="form.controls.cluster.value"
                (change)="onClusterSelect($event)"
                class="form-control"
              >
                <option value="" disabled selected>Sélectionner...</option>
                @for (c of existingClusters(); track c) {
                <option [value]="c">{{ c }}</option>
                }
                <option value="__NEW__">➕ Nouveau Cluster...</option>
              </select>
            </div>
            } @else {
            <div class="input-group d-flex">
              <input
                type="text"
                formControlName="cluster"
                class="form-control"
                placeholder="ex: Auth, Profile"
              />
              @if(existingClusters().length > 0) {
              <button
                type="button"
                (click)="switchToClusterSelect()"
                class="btn btn-sm btn-outline"
                title="Choisir existant"
              >
                📋
              </button>
              }
            </div>
            }
          </div>
        </div>

        <div class="form-group">
          <label>{{ 'backlog.title' | translate }}</label>
          @if (!isTitleInputMode() && existingTitles().length > 0) {
          <div class="input-group">
            <select
              [value]="form.controls.title.value"
              (change)="onTitleSelect($event)"
              class="form-control"
            >
              <option value="" disabled selected>Sélectionner...</option>
              @for (t of existingTitles(); track t) {
              <option [value]="t">{{ t }}</option>
              }
              <option value="__NEW__">➕ Nouvelle Feature...</option>
            </select>
          </div>
          } @else {
          <div class="input-group d-flex">
            <input
              type="text"
              formControlName="title"
              class="form-control"
              placeholder="ex: Login Screen"
            />
            @if(existingTitles().length > 0) {
            <button
              type="button"
              (click)="switchToTitleSelect()"
              class="btn btn-sm btn-outline"
              title="Choisir existant"
            >
              📋
            </button>
            }
          </div>
          }
        </div>

        <!-- Description -->
        <div class="form-group">
          <label>{{ 'backlog.description' | translate }}</label>
          <textarea formControlName="description" class="form-control" rows="2"></textarea>
        </div>

        <!-- Hypotheses & Comments -->
        <div class="row">
          <div class="form-group col">
            <label>{{ 'backlog.hypotheses' | translate }}</label>
            <textarea formControlName="hypotheses" class="form-control" rows="2"></textarea>
          </div>
          <div class="form-group col">
            <label>{{ 'backlog.comments' | translate }}</label>
            <textarea formControlName="comments" class="form-control" rows="2"></textarea>
          </div>
        </div>

        <!-- Scope & MoSCoW -->
        <div class="row">
          <div class="form-group col">
            <label>{{ 'backlog.scope' | translate }}</label>
            <select formControlName="scope" class="form-control">
              <option value="MVP">MVP</option>
              <option value="V1">V1</option>
              <option value="V2">V2</option>
            </select>
          </div>
          <div class="form-group col">
            <label>{{ 'backlog.moscow' | translate }}</label>
            <select formControlName="moscow" class="form-control">
              <option value="MUST">Must Have</option>
              <option value="SHOULD">Should Have</option>
              <option value="COULD">Could Have</option>
              <option value="WONT">Won't Have</option>
            </select>
          </div>
        </div>

        <!-- Profile, Type, Effort -->
        <div class="row">
          <div class="form-group col">
            <label>{{ 'backlog.profile' | translate }}</label>
            <select formControlName="profileId" class="form-control">
              @for (p of profiles(); track p.id) {
              <option [value]="p.id">{{ p.name }} ({{ p.dailyRate }}€/j)</option>
              }
            </select>
          </div>
          <div class="form-group col">
            <label>{{ 'backlog.chargeType' | translate }}</label>
            <select formControlName="chargeType" class="form-control">
              <option value="days">RTU</option>
              <option value="ratio">Ratio (%)</option>
            </select>
          </div>
          <div class="form-group col">
            <label>{{ 'backlog.effort' | translate }}</label>
            <input type="number" formControlName="effortDays" class="form-control" step="0.1" />
          </div>
        </div>

        <div class="cost-preview">
          <strong>{{ 'backlog.cost' | translate }} (HT):</strong>
          {{ calculatedCost() | currency : 'EUR' }}
        </div>

        @if (!isSheetMode) {
        <div class="actions">
          <button type="button" routerLink="/backlog" class="btn btn-secondary">
            {{ 'common.cancel' | translate }}
          </button>
          <button type="submit" [disabled]="form.invalid" class="btn btn-primary">
            {{ 'common.save' | translate }}
          </button>
        </div>
        }
      </form>
    </div>
  `,
  styles: [
    `
      .form-container {
        padding: 1rem;
      }
      .form-group {
        margin-bottom: 1rem;
      }
      .row {
        display: flex;
        gap: 1rem;
      }
      .col {
        flex: 1;
      }
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--foreground);
      }
      .form-control {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-family: inherit;
        font-size: 0.875rem;
      }
      textarea.form-control {
        resize: vertical;
      }
      .cost-preview {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1.5rem;
        text-align: right;
        font-size: 1.1rem;
        border: 1px solid #e9ecef;
      }
      .actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
      }
      .d-flex {
        display: flex;
        gap: 0.5rem;
      }
      .btn-outline {
        background: white;
        border: 1px solid #ced4da;
        color: #6c757d;
        padding: 0.25rem 0.5rem;
      }
    `,
  ],
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
      this.currentProductInput.set(val || '')
    );
    this.form.controls.cluster.valueChanges.subscribe((val) =>
      this.currentClusterInput.set(val || '')
    );

    this.updateCost();
  }

  private initForm(item: BacklogItem) {
    this.isEditMode.set(true);
    this.form.patchValue(item as any);
    this.currentProductInput.set(item.product || '');
    this.currentClusterInput.set(item.cluster || '');

    this.isProductInputMode.set(!this.existingProducts().includes(item.product));
    this.isClusterInputMode.set(!this.existingClusters().includes(item.cluster));
    this.isTitleInputMode.set(!this.existingTitles().includes(item.title));
  }

  onProductSelect(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (val === '__NEW__') {
      this.isProductInputMode.set(true);
      this.form.controls.product.setValue('');
      this.currentProductInput.set('');
    } else {
      this.form.controls.product.setValue(val);
      this.currentProductInput.set(val);
      this.isClusterInputMode.set(this.existingClusters().length === 0);
    }
  }

  onClusterSelect(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (val === '__NEW__') {
      this.isClusterInputMode.set(true);
      this.form.controls.cluster.setValue('');
      this.currentClusterInput.set('');
    } else {
      this.form.controls.cluster.setValue(val);
      this.currentClusterInput.set(val);
      this.isTitleInputMode.set(this.existingTitles().length === 0);
    }
  }

  onTitleSelect(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (val === '__NEW__') {
      this.isTitleInputMode.set(true);
      this.form.controls.title.setValue('');
    } else {
      this.form.controls.title.setValue(val);
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
