import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  EventEmitter,
  Input,
  Output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

export type FieldType = 'text' | 'textarea' | 'number' | 'select';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-editable-cell',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editable-cell.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class EditableCellComponent {
  @Input() value: any;
  @Input() fieldType: FieldType = 'text';
  @Input() options: SelectOption[] = [];
  @Input() isEditing = false;

  @Output() editStart = new EventEmitter<void>();
  @Output() editSave = new EventEmitter<any>();
  @Output() editCancel = new EventEmitter<void>();

  editValue: any;
  private focusSignal = signal(false);

  constructor() {
    // Auto-focus when editing starts
    effect(() => {
      if (this.focusSignal()) {
        setTimeout(() => {
          const input = document.querySelector('.inline-edit, .inline-edit-select') as HTMLElement;
          if (input) {
            input.focus();
          }
        }, 0);
      }
    });
  }

  ngOnChanges() {
    if (this.isEditing && this.editValue === undefined) {
      this.editValue = this.value;
      this.focusSignal.set(true);
    } else if (!this.isEditing) {
      this.focusSignal.set(false);
    }
  }

  onSave() {
    this.editSave.emit(this.editValue);
    this.editValue = undefined;
  }

  onCancel() {
    this.editCancel.emit();
    this.editValue = undefined;
  }
}
