import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  template: `
    <div class="product-section">
      <h3 class="product-title" (click)="toggleExpand.emit(productGroup.product)">
        <span class="chevron" [class.expanded]="isExpanded">▶</span>
        <span class="product-name">{{ productGroup.product }}</span>
        <span class="product-cost">{{ productTotal | currency : 'EUR' }}</span>
      </h3>
      @if (isExpanded) {
      <app-backlog-table
        [clusterGroups]="productGroup.clusters"
        [profiles]="profiles"
        [selectedIds]="selectedIds"
        [editingCell]="editingCell"
        [visibleColumns]="visibleColumns"
        [getItemCost]="getItemCost"
        (toggleAll)="toggleAll.emit($event)"
        (selectionToggle)="selectionToggle.emit($event)"
        (editStart)="editStart.emit($event)"
        (editSave)="editSave.emit($event)"
        (editCancel)="editCancel.emit()"
        (duplicateItem)="duplicateItem.emit($event)"
      />
      }
    </div>
  `,
  styles: [
    `
      .product-section {
        margin-bottom: 2rem;
      }
      .product-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
        margin-bottom: 1rem;
        padding: 0.75rem 1rem;
        background: #3f3f46;
        border-radius: var(--radius);
        cursor: pointer;
        user-select: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        transition: background-color 0.15s ease;
      }
      .product-title:hover {
        background: #52525b;
      }
      .product-name {
        flex: 1;
      }
      .product-cost {
        font-size: 1.125rem;
        font-weight: 700;
        margin-left: auto;
      }
      .chevron {
        font-size: 0.875rem;
        transition: transform 0.2s ease;
        display: inline-block;
      }
      .chevron.expanded {
        transform: rotate(90deg);
      }
    `,
  ],
})
export class BacklogProductSectionComponent {
  @Input() productGroup!: ProductGroup;
  @Input() profiles: Profile[] = [];
  @Input() isExpanded = true;
  @Input() selectedIds: string[] = [];
  @Input() editingCell: { itemId: string; field: string } | null = null;
  @Input() productTotal = 0;
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
