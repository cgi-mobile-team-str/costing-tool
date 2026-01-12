import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Profile } from '../../core/models/domain.model';

@Component({
  selector: 'app-backlog-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filters">
      <input
        type="text"
        [ngModel]="searchTerm"
        (ngModelChange)="searchTermChange.emit($event)"
        placeholder="Search..."
        class="form-control search"
      />
      <select
        [ngModel]="scopeFilter"
        (ngModelChange)="scopeFilterChange.emit($event)"
        class="form-control"
      >
        <option value="">All Scopes</option>
        <option value="MVP">MVP</option>
        <option value="V1">V1</option>
        <option value="V2">V2</option>
      </select>
      <select
        [ngModel]="profileFilter"
        (ngModelChange)="profileFilterChange.emit($event)"
        class="form-control"
      >
        <option value="">All Profiles</option>
        @for (p of profiles; track p.id) {
        <option [value]="p.id">{{ p.name }}</option>
        }
      </select>
    </div>
  `,
  styles: [
    `
      .filters {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
      }
      .search {
        flex: 2;
      }
      .form-control {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--card);
        color: var(--foreground);
        font-size: 0.875rem;
      }
      .form-control:focus {
        outline: none;
        border-color: var(--ring);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    `,
  ],
})
export class BacklogFiltersComponent {
  @Input() profiles: Profile[] = [];
  @Input() searchTerm = '';
  @Input() scopeFilter = '';
  @Input() profileFilter = '';

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() scopeFilterChange = new EventEmitter<string>();
  @Output() profileFilterChange = new EventEmitter<string>();
}
