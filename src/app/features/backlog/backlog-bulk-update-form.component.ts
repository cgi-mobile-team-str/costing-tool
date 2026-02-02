import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Profile } from '../../core/models/domain.model';
import { ProjectsService } from '../../core/services/projects.service';
import { ClustersRepository } from '../../data/clusters.repository';
import { ProductsRepository } from '../../data/products.repository';
import { ProfilesRepository } from '../../data/profiles.repository';
import { ZardFormImports } from '../../shared/components/form/form.imports';
import { ZardSheetRef } from '../../shared/components/sheet/sheet-ref';

@Component({
  selector: 'app-backlog-bulk-update-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ZardFormImports],
  template: `
    <div class="bulk-update-form">
      <form [formGroup]="form">
        <div class="flex flex-col gap-6">
          <!-- Product & Cluster -->
          <div class="field-card">
            <div class="field-header">
              <input
                type="checkbox"
                formControlName="updateProduct"
                id="updateProduct"
                class="z-checkbox"
              />
              <label for="updateProduct" class="field-label">Produit</label>
            </div>
            <div class="field-content" [class.disabled]="!form.value.updateProduct">
              <select z-input formControlName="productId">
                <option value="">Sélectionner un produit</option>
                @for (p of allProducts(); track p.id) {
                  <option [value]="p.id">{{ p.name }}</option>
                }
              </select>
            </div>
          </div>

          <div class="field-card">
            <div class="field-header">
              <input
                type="checkbox"
                formControlName="updateCluster"
                id="updateCluster"
                class="z-checkbox"
              />
              <label for="updateCluster" class="field-label">Cluster</label>
            </div>
            <div class="field-content" [class.disabled]="!form.value.updateCluster">
              <select z-input formControlName="clusterId">
                <option value="">Sélectionner un cluster</option>
                @for (c of availableClusters(); track c.id) {
                  <option [value]="c.id">{{ c.name }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Scope & MoSCoW -->
          <div class="grid grid-cols-2 gap-4">
            <div class="field-card">
              <div class="field-header">
                <input
                  type="checkbox"
                  formControlName="updateScope"
                  id="updateScope"
                  class="z-checkbox"
                />
                <label for="updateScope" class="field-label">Scope</label>
              </div>
              <div class="field-content" [class.disabled]="!form.value.updateScope">
                <select z-input formControlName="scope">
                  <option value="MVP">MVP</option>
                  <option value="V1">V1</option>
                  <option value="V2">V2</option>
                </select>
              </div>
            </div>

            <div class="field-card">
              <div class="field-header">
                <input
                  type="checkbox"
                  formControlName="updateMoscow"
                  id="updateMoscow"
                  class="z-checkbox"
                />
                <label for="updateMoscow" class="field-label">MoSCoW</label>
              </div>
              <div class="field-content" [class.disabled]="!form.value.updateMoscow">
                <select z-input formControlName="moscow">
                  <option value="MUST">MUST</option>
                  <option value="SHOULD">SHOULD</option>
                  <option value="COULD">COULD</option>
                  <option value="WONT">WONT</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Profile -->
          <div class="field-card">
            <div class="field-header">
              <input
                type="checkbox"
                formControlName="updateProfile"
                id="updateProfile"
                class="z-checkbox"
              />
              <label for="updateProfile" class="field-label">Profil de charge</label>
            </div>
            <div class="field-content" [class.disabled]="!form.value.updateProfile">
              <select z-input formControlName="profileId">
                <option value="">Sélectionner un profil</option>
                @for (p of profiles(); track p.id) {
                  <option [value]="p.id">{{ p.name }}</option>
                }
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="field-card">
              <div class="field-header">
                <input
                  type="checkbox"
                  formControlName="updateType"
                  id="updateType"
                  class="z-checkbox"
                />
                <label for="updateType" class="field-label">Type d'item</label>
              </div>
              <div class="field-content" [class.disabled]="!form.value.updateType">
                <select z-input formControlName="type">
                  <option value="build">Build</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>

            <div class="field-card">
              <div class="field-header">
                <input
                  type="checkbox"
                  formControlName="updateChargeType"
                  id="updateChargeType"
                  class="z-checkbox"
                />
                <label for="updateChargeType" class="field-label">Mode de charge</label>
              </div>
              <div class="field-content" [class.disabled]="!form.value.updateChargeType">
                <select z-input formControlName="chargeType">
                  <option value="days">Jours (RTU)</option>
                  <option value="ratio">% du total build</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .bulk-update-form {
        padding: 0.5rem;
      }
      .field-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.75rem;
        transition: all 0.2s ease;
      }
      .field-card:has(input:checked) {
        background: #f0f7ff;
        border-color: #3b82f6;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.05);
      }
      .field-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }
      .field-label {
        font-weight: 600;
        font-size: 0.875rem;
        color: #1e293b;
        cursor: pointer;
        user-select: none;
      }
      .field-content {
        transition: opacity 0.2s ease;
      }
      .field-content.disabled {
        opacity: 0.4;
        pointer-events: none;
      }
      .z-checkbox {
        width: 1.125rem;
        height: 1.125rem;
        cursor: pointer;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.Emulated,
})
export class BacklogBulkUpdateFormComponent {
  private fb = inject(FormBuilder);
  private profilesRepo = inject(ProfilesRepository);
  private productsRepo = inject(ProductsRepository);
  private clustersRepo = inject(ClustersRepository);
  private projectsService = inject(ProjectsService);
  private sheetRef = inject(ZardSheetRef);

  profiles = signal<Profile[]>([]);

  form = this.fb.group({
    updateProduct: [false],
    productId: [''],
    updateCluster: [false],
    clusterId: [''],
    updateScope: [false],
    scope: ['MVP'],
    updateMoscow: [false],
    moscow: ['MUST'],
    updateProfile: [false],
    profileId: [''],
    updateType: [false],
    type: ['build'],
    updateChargeType: [false],
    chargeType: ['days'],
  });

  allProducts = computed(() => this.productsRepo.getAll());
  availableClusters = computed(() => {
    const pid = this.form.value.productId;
    if (!pid) return [];
    return this.clustersRepo.getByProductId(pid);
  });

  constructor() {
    const projectId = this.projectsService.currentProjectId();
    if (projectId) {
      this.profilesRepo.getAll(projectId).subscribe((p) => {
        this.profiles.set(p.filter((x) => x.active));
      });
    }

    this.form.controls.productId.valueChanges.subscribe(() => {
      this.form.patchValue({ clusterId: '' });
    });
  }

  getUpdates(): any {
    const val = this.form.value;
    const updates: any = {};
    if (val.updateProduct) updates.productId = val.productId;
    if (val.updateCluster) updates.clusterId = val.clusterId;
    if (val.updateScope) updates.scope = val.scope;
    if (val.updateMoscow) updates.moscow = val.moscow;
    if (val.updateProfile) updates.profileId = val.profileId;
    if (val.updateType) updates.type = val.type;
    if (val.updateChargeType) updates.chargeType = val.chargeType;
    return updates;
  }
}
