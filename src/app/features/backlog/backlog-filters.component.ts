import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Profile } from '../../core/models/domain.model';

@Component({
  selector: 'app-backlog-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './backlog-filters.component.html',
  encapsulation: ViewEncapsulation.None,
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
