import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Profile } from '../../core/models/domain.model';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-backlog-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './backlog-filters.component.html',
  styleUrls: ['./backlog-filters.component.css'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class BacklogFiltersComponent {
  @Input() profiles: Profile[] = [];
  @Input() searchTerm = '';
  @Input() scopeFilter = '';
  @Input() profileFilter: string[] = [];
  @Input() historyFilter = '';

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() scopeFilterChange = new EventEmitter<string>();
  @Output() profileFilterChange = new EventEmitter<string[]>();
  @Output() historyFilterChange = new EventEmitter<string>();

  toggleProfile(profileId: string) {
    if (this.profileFilter.includes(profileId)) {
      this.profileFilterChange.emit(this.profileFilter.filter((id) => id !== profileId));
    } else {
      this.profileFilterChange.emit([...this.profileFilter, profileId]);
    }
  }
}
