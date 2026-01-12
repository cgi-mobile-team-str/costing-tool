import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, effect, signal } from '@angular/core';
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
  template: `
    @if (isEditing) { @if (fieldType === 'text') {
    <input
      type="text"
      class="inline-edit"
      [(ngModel)]="editValue"
      (blur)="onSave()"
      (keydown.enter)="onSave()"
      (keydown.escape)="onCancel()"
    />
    } @else if (fieldType === 'textarea') {
    <textarea
      class="inline-edit"
      [(ngModel)]="editValue"
      (blur)="onSave()"
      (keydown.escape)="onCancel()"
      rows="2"
    ></textarea>
    } @else if (fieldType === 'number') {
    <input
      type="number"
      class="inline-edit"
      [(ngModel)]="editValue"
      (blur)="onSave()"
      (keydown.enter)="onSave()"
      (keydown.escape)="onCancel()"
      step="0.5"
      min="0"
    />
    } @else if (fieldType === 'select') {
    <select
      class="inline-edit-select"
      [(ngModel)]="editValue"
      (blur)="onCancel()"
      (change)="onSave()"
    >
      @for (opt of options; track opt.value) {
      <option [value]="opt.value">{{ opt.label }}</option>
      }
    </select>
    } } @else {
    <ng-content></ng-content>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .inline-edit,
      .inline-edit-select {
        width: 100%;
        padding: 0.375rem 0.5rem;
        border: 2px solid #3b82f6;
        border-radius: 4px;
        font-size: 0.875rem;
        background: white;
        color: var(--foreground);
        outline: none;
      }
      .inline-edit:focus,
      .inline-edit-select:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    `,
  ],
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
