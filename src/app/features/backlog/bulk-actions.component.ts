import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-bulk-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-actions.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class BulkActionsComponent {
  @Input() selectedCount = 0;
  @Output() deleteSelected = new EventEmitter<void>();
}
