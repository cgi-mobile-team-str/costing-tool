import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-bulk-actions',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './bulk-actions.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class BulkActionsComponent {
  @Input() selectedCount = 0;
  @Output() deleteSelected = new EventEmitter<void>();
}
