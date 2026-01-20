import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

export interface ColumnDefinition {
  id: string;
  label: string;
}

@Component({
  selector: 'app-column-selector',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './column-selector.component.html',
  styleUrls: ['./column-selector.component.css'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ColumnSelectorComponent {
  @Input() availableColumns: ColumnDefinition[] = [];
  @Input() visibleColumns: string[] = [];

  @Output() visibleColumnsChange = new EventEmitter<string[]>();

  toggleColumn(columnId: string) {
    if (this.visibleColumns.includes(columnId)) {
      this.visibleColumnsChange.emit(this.visibleColumns.filter((c) => c !== columnId));
    } else {
      this.visibleColumnsChange.emit([...this.visibleColumns, columnId]);
    }
  }

  isColumnVisible(columnId: string): boolean {
    return this.visibleColumns.includes(columnId);
  }

  isAllColumnsVisible(): boolean {
    return this.availableColumns.length === this.visibleColumns.length;
  }

  selectAllColumns() {
    const allColumnIds = this.availableColumns.map((col) => col.id);
    this.visibleColumnsChange.emit(allColumnIds);
  }
}
