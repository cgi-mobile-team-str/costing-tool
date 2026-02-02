import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardIconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-bulk-actions-toast',
  standalone: true,
  imports: [CommonModule, ZardButtonComponent, ZardIconComponent],
  templateUrl: './bulk-actions-toast.component.html',
  styleUrls: ['./bulk-actions-toast.component.css'],
})
export class BulkActionsToastComponent {
  count = input.required<number>();
  visible = input.required<boolean>();
  message = input.required<string>();
  deleteLabel = input.required<string>();
  editLabel = input<string>('Modifier');

  close = output<void>();
  delete = output<void>();
  edit = output<void>();

  onClose() {
    this.close.emit();
  }

  onDelete() {
    this.delete.emit();
  }

  onEdit() {
    this.edit.emit();
  }
}
