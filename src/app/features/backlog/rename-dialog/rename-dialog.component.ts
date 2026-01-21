import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Z_MODAL_DATA } from '../../../shared/components/dialog/dialog.service';
import { ZardInputDirective } from '../../../shared/components/input/index';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

export interface RenameDialogData {
  name: string;
}

@Component({
  selector: 'app-rename-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ZardInputDirective, TranslatePipe],
  template: `
    <form [formGroup]="form" class="grid gap-4">
      <div class="grid gap-3">
        <label
          for="name"
          class="flex items-center gap-2 text-sm leading-none font-medium select-none"
        >
          {{ 'common.new_title' | translate }}
        </label>
        <input
          z-input
          formControlName="name"
          id="name"
          [placeholder]="'common.name_placeholder' | translate"
        />
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RenameDialogComponent implements AfterViewInit {
  private zData: RenameDialogData = inject(Z_MODAL_DATA);

  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
  });

  ngAfterViewInit(): void {
    if (this.zData) {
      this.form.patchValue({ name: this.zData.name });
    }
  }
}
