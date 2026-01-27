import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, map, of } from 'rxjs';
import { Profile } from '../../core/models/domain.model';
import { ProjectsService } from '../../core/services/projects.service';
import { ProfilesRepository } from '../../data/profiles.repository';
import { ZardInputDirective } from '../../shared/components/input';
import { Z_SHEET_DATA } from '../../shared/components/sheet/sheet.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, ZardInputDirective],
  templateUrl: './profile-form.component.html',
  styleUrls: ['./profile-form.component.css'],
})
export class ProfileFormComponent {
  private fb = inject(FormBuilder);
  private repo = inject(ProfilesRepository);
  private projectsService = inject(ProjectsService);
  private zData = inject(Z_SHEET_DATA, { optional: true });

  form = this.fb.group({
    id: [''],
    name: ['', Validators.required],
    username: [''],
    dailyRate: [0, [Validators.required, Validators.min(1)]],
    scr: [0, [Validators.min(0)]],
    active: [true],
  });

  isEditMode = signal(false);

  constructor() {
    if (this.zData) {
      this.isEditMode.set(true);
      this.form.patchValue(this.zData);
    }
  }

  save(): Observable<boolean> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return of(false);
    }

    const projectId = this.projectsService.currentProjectId();
    if (!projectId) return of(false);

    const val = this.form.value as Profile;
    return this.repo.save(val, Number(projectId)).pipe(map(() => true));
  }

  toggleActive() {
    const current = this.form.get('active')?.value;
    this.form.get('active')?.setValue(!current);
    this.form.markAsDirty();
  }
}
