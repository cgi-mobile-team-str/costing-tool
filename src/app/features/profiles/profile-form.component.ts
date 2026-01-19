import { CommonModule } from '@angular/common';
import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Profile } from '../../core/models/domain.model';
import { IdService } from '../../core/services/id.service';
import { ProfilesRepository } from '../../data/profiles.repository';
import { ZardInputDirective } from '../../shared/components/input';
import { Z_SHEET_DATA } from '../../shared/components/sheet/sheet.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, ZardInputDirective],
  templateUrl: './profile-form.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class ProfileFormComponent {
  private fb = inject(FormBuilder);
  private repo = inject(ProfilesRepository);
  private idService = inject(IdService);
  private zData = inject(Z_SHEET_DATA, { optional: true });

  form = this.fb.group({
    id: [''],
    name: ['', Validators.required],
    username: [''],
    dailyRate: [0, [Validators.required, Validators.min(1)]],
    active: [true],
  });

  isEditMode = signal(false);

  constructor() {
    if (this.zData) {
      this.isEditMode.set(true);
      this.form.patchValue(this.zData);
    }
  }

  save(): boolean {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return false;
    }

    const val = this.form.value as Profile;
    // Check name uniqueness (naive impl)
    const all = this.repo.getAll();
    const exists = all.find(
      (p) => p.name.toLowerCase() === val.name.toLowerCase() && p.id !== val.id
    );
    if (exists) {
      this.form.setErrors({ nameExists: true });
      return false;
    }

    if (!val.id) {
      val.id = this.idService.generate();
    }

    this.repo.save(val as Profile);
    return true;
  }

  toggleActive() {
    const current = this.form.get('active')?.value;
    this.form.get('active')?.setValue(!current);
    this.form.markAsDirty();
  }
}
