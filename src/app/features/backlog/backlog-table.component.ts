import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BacklogItem, Profile } from '../../core/models/domain.model';
import { ZardCheckboxComponent } from '../../shared/components/checkbox/checkbox.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { BacklogRowComponent } from './backlog-row.component';

export interface ClusterGroup {
  cluster: string;
  items: BacklogItem[];
}

@Component({
  selector: 'app-backlog-table',
  standalone: true,
  imports: [CommonModule, BacklogRowComponent, CurrencyPipe, TranslatePipe, ZardCheckboxComponent],
  template: `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th width="32" style="padding-right: 0;">
              <z-checkbox [checked]="allSelected" (checkChange)="toggleAllItems($event)" />
            </th>
            <th style="padding-left: 0.5rem;">{{ 'backlog.title' | translate }}</th>
            @if (visibleColumns.includes('description')) {
            <th>{{ 'backlog.description' | translate }}</th>
            } @if (visibleColumns.includes('hypotheses')) {
            <th>{{ 'backlog.hypotheses' | translate }}</th>
            } @if (visibleColumns.includes('comments')) {
            <th>{{ 'backlog.comments' | translate }}</th>
            } @if (visibleColumns.includes('moscow')) {
            <th>{{ 'backlog.moscow' | translate }}</th>
            } @if (visibleColumns.includes('scope')) {
            <th>{{ 'backlog.scope' | translate }}</th>
            } @if (visibleColumns.includes('profile')) {
            <th>{{ 'backlog.profile' | translate }}</th>
            } @if (visibleColumns.includes('chargeType')) {
            <th>{{ 'backlog.chargeType' | translate }}</th>
            } @if (visibleColumns.includes('effort')) {
            <th>{{ 'backlog.effort' | translate }}</th>
            } @if (visibleColumns.includes('cost')) {
            <th>{{ 'backlog.cost' | translate }} (HT)</th>
            }
            <th>{{ 'common.actions' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          @for (clusterGroup of clusterGroups; track clusterGroup.cluster) {
          <tr class="cluster-header">
            <td [attr.colspan]="visibleColumnCount + 3">{{ clusterGroup.cluster }}</td>
          </tr>
          @for (item of clusterGroup.items; track item.id) {
          <app-backlog-row
            [item]="item"
            [profiles]="profiles"
            [isSelected]="isItemSelected(item.id)"
            [editingCell]="editingCell"
            [itemCost]="getItemCost(item)"
            [visibleColumns]="visibleColumns"
            (selectionToggle)="selectionToggle.emit($event)"
            (editStart)="editStart.emit($event)"
            (editSave)="editSave.emit($event)"
            (editCancel)="editCancel.emit()"
            (duplicateItem)="duplicateItem.emit($event)"
          />
          }
          <!-- Cluster Total -->
          <tr class="cluster-total">
            <td
              [attr.colspan]="visibleColumnCount + 1"
              style="text-align: right; font-weight: 600;"
            >
              Total {{ clusterGroup.cluster }}:
            </td>
            <td style="font-weight: 600;">
              {{ getClusterTotal(clusterGroup.items) | currency : 'EUR' }}
            </td>
            <td></td>
          </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      /* Inherits global table styles */
      .cluster-header td {
        background: #e5e7eb;
        font-weight: 600;
        color: #374151;
        font-size: 0.9375rem;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border);
      }
      .cluster-total td {
        background: #f3f4f6;
        font-weight: 600;
        color: #374151;
        padding: 0.75rem 1rem;
        border-top: 2px solid var(--border);
      }
    `,
  ],
})
export class BacklogTableComponent {
  @Input() clusterGroups: ClusterGroup[] = [];
  @Input() profiles: Profile[] = [];
  @Input() selectedIds: string[] = [];
  @Input() editingCell: { itemId: string; field: string } | null = null;
  @Input() visibleColumns: string[] = [];
  @Input() getItemCost!: (item: BacklogItem) => number;

  @Output() toggleAll = new EventEmitter<boolean>();
  @Output() selectionToggle = new EventEmitter<string>();
  @Output() editStart = new EventEmitter<{ itemId: string; field: string }>();
  @Output() editSave = new EventEmitter<BacklogItem>();
  @Output() editCancel = new EventEmitter<void>();
  @Output() duplicateItem = new EventEmitter<BacklogItem>();

  isItemSelected(id: string): boolean {
    return this.selectedIds.includes(id);
  }

  getClusterTotal(items: BacklogItem[]): number {
    return items.reduce((sum, item) => sum + this.getItemCost(item), 0);
  }

  get visibleColumnCount(): number {
    return this.visibleColumns.length;
  }

  get allSelected(): boolean {
    const allItems = this.clusterGroups.flatMap((cg) => cg.items);
    return allItems.length > 0 && allItems.every((item) => this.selectedIds.includes(item.id));
  }

  toggleAllItems(checked: boolean) {
    this.toggleAll.emit(checked);
  }

  isColumnVisible(columnId: string): boolean {
    return this.visibleColumns.includes(columnId);
  }
}
