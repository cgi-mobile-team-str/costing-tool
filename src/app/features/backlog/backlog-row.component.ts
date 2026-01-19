import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BacklogItem, Profile } from '../../core/models/domain.model';
import { ZardCheckboxComponent } from '../../shared/components/checkbox/checkbox.component';

@Component({
  selector: 'app-backlog-row',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardCheckboxComponent],
  templateUrl: './backlog-row.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class BacklogRowComponent {
  @Input() item!: BacklogItem;
  @Input() profiles: Profile[] = [];
  @Input() isSelected = false;
  @Input() editingCell: { itemId: string; field: string } | null = null;
  @Input() visibleColumns: string[] = [];
  @Input() itemCost = 0;

  @Output() selectionToggle = new EventEmitter<string>();
  @Output() editStart = new EventEmitter<{ itemId: string; field: string }>();
  @Output() editSave = new EventEmitter<BacklogItem>();
  @Output() editCancel = new EventEmitter<void>();
  @Output() duplicateItem = new EventEmitter<BacklogItem>();

  isEditing(field: string): boolean {
    return (
      this.editingCell !== null &&
      this.editingCell.itemId === this.item.id &&
      this.editingCell.field === field
    );
  }

  startEdit(field: string) {
    this.editStart.emit({ itemId: this.item.id, field });
  }

  saveEdit() {
    this.editSave.emit(this.item);
  }

  cancelEdit() {
    this.editCancel.emit();
  }

  getProfileName(id: string): string {
    return this.profiles.find((p) => p.id === id)?.name || 'Unknown';
  }

  isColumnVisible(columnId: string): boolean {
    return this.visibleColumns.includes(columnId);
  }
}
