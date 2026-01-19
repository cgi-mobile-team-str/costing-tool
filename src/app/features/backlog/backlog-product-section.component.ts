import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { BacklogItem, Profile } from '../../core/models/domain.model';
import { BacklogTableComponent, ClusterGroup } from './backlog-table.component';

export interface ProductGroup {
  product: string;
  clusters: ClusterGroup[];
}

@Component({
  selector: 'app-backlog-product-section',
  standalone: true,
  imports: [CommonModule, BacklogTableComponent, CurrencyPipe],
  templateUrl: './backlog-product-section.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class BacklogProductSectionComponent {
  @Input() productGroup!: ProductGroup;
  @Input() profiles: Profile[] = [];
  @Input() isExpanded = true;
  @Input() selectedIds: string[] = [];
  @Input() editingCell: { itemId: string; field: string } | null = null;
  @Input() productTotal = 0;
  @Input() productEffort = 0;
  @Input() visibleColumns: string[] = [];
  @Input() getItemCost!: (item: BacklogItem) => number;

  @Output() toggleExpand = new EventEmitter<string>();
  @Output() toggleAll = new EventEmitter<boolean>();
  @Output() selectionToggle = new EventEmitter<string>();
  @Output() editStart = new EventEmitter<{ itemId: string; field: string }>();
  @Output() editSave = new EventEmitter<BacklogItem>();
  @Output() editCancel = new EventEmitter<void>();
  @Output() duplicateItem = new EventEmitter<BacklogItem>();
}
