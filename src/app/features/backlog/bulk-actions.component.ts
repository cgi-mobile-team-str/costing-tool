import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-bulk-actions',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (selectedCount > 0) {
    <div class="bulk-actions">
      <span>{{ selectedCount }} selected</span>
      <button (click)="deleteSelected.emit()" class="btn btn-danger btn-sm">Delete Selected</button>
    </div>
    }
  `,
  styles: [
    `
      .bulk-actions {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: var(--primary);
        color: var(--primary-foreground);
        padding: 0.875rem 1.5rem;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        font-size: 0.875rem;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem;
        border-radius: var(--radius);
        font-size: 0.875rem;
        font-weight: 500;
        border: none;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .btn-danger {
        background: #ef4444;
        color: white;
      }
      .btn-danger:hover {
        background: #dc2626;
      }
      .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.8125rem;
      }
    `,
  ],
})
export class BulkActionsComponent {
  @Input() selectedCount = 0;
  @Output() deleteSelected = new EventEmitter<void>();
}
