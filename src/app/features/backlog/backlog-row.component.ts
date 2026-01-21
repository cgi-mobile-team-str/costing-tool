import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BacklogItem, Profile } from '../../core/models/domain.model';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardCheckboxComponent } from '../../shared/components/checkbox/checkbox.component';
import { ZardDropdownMenuItemComponent } from '../../shared/components/dropdown/dropdown-item.component';
import { ZardDropdownMenuContentComponent } from '../../shared/components/dropdown/dropdown-menu-content.component';
import { ZardDropdownDirective } from '../../shared/components/dropdown/dropdown-trigger.directive';
import { ZardIconComponent } from '../../shared/components/icon/icon.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-backlog-row',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardCheckboxComponent,
    ZardButtonComponent,
    ZardDropdownMenuItemComponent,
    ZardDropdownMenuContentComponent,
    ZardDropdownMenuContentComponent,
    ZardDropdownDirective,
    ZardIconComponent,
    TranslatePipe,
  ],
  templateUrl: './backlog-row.component.html',
  styleUrls: ['./backlog-row.component.css'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class BacklogRowComponent {
  @Input() item!: BacklogItem;
  @Input() profiles: Profile[] = [];
  @Input() isSelected = false;
  @Input() editingCell: { itemId: string; field: string } | null = null;
  @Input() visibleColumns: string[] = [];

  @Input() itemCost = 0;
  @Input() isFirst = false;
  @Input() isLast = false;

  @Output() selectionToggle = new EventEmitter<string>();
  @Output() editStart = new EventEmitter<{ itemId: string; field: string }>();
  @Output() editSave = new EventEmitter<BacklogItem>();
  @Output() editCancel = new EventEmitter<void>();
  @Output() duplicateItem = new EventEmitter<BacklogItem>();
  @Output() deleteItem = new EventEmitter<BacklogItem>();
  @Output() moveItemUp = new EventEmitter<BacklogItem>();
  @Output() moveItemDown = new EventEmitter<BacklogItem>();

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

  getMoscowLabel(value?: string | null): string {
    if (!value) return '';
    // Maps MUST -> backlog.moscow_must
    return `backlog.moscow_${value.toLowerCase()}`;
  }

  getScopeLabel(value?: string | null): string {
    if (!value) return '';
    // Maps MVP -> backlog.scope_mvp
    return `backlog.scope_${value.toLowerCase()}`;
  }
}
