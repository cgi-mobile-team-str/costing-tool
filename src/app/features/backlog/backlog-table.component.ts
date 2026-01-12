import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BacklogItem, Profile } from '../../core/models/domain.model';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { BacklogRowComponent } from './backlog-row.component';

export interface ClusterGroup {
  cluster: string;
  items: BacklogItem[];
}

@Component({
  selector: 'app-backlog-table',
  standalone: true,
  imports: [CommonModule, BacklogRowComponent, CurrencyPipe, TranslatePipe],
  template: `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th width="40">
              <input type="checkbox" (change)="toggleAll.emit($event.target.checked)" />
            </th>
            <th>{{ 'backlog.title' | translate }}</th>
            <th>{{ 'backlog.description' | translate }}</th>
            <th>{{ 'backlog.hypotheses' | translate }}</th>
            <th>{{ 'backlog.comments' | translate }}</th>
            <th>{{ 'backlog.moscow' | translate }}</th>
            <th>{{ 'backlog.scope' | translate }}</th>
            <th>{{ 'backlog.profile' | translate }}</th>
            <th>{{ 'backlog.chargeType' | translate }}</th>
            <th>{{ 'backlog.effort' | translate }}</th>
            <th>{{ 'backlog.cost' | translate }} (HT)</th>
            <th>{{ 'common.actions' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          @for (clusterGroup of clusterGroups; track clusterGroup.cluster) {
          <tr class="cluster-header">
            <td colspan="12">{{ clusterGroup.cluster }}</td>
          </tr>
          @for (item of clusterGroup.items; track item.id) {
          <app-backlog-row
            [item]="item"
            [profiles]="profiles"
            [isSelected]="isItemSelected(item.id)"
            [editingCell]="editingCell"
            [itemCost]="getItemCost(item)"
            (selectionToggle)="selectionToggle.emit($event)"
            (editStart)="editStart.emit($event)"
            (editSave)="editSave.emit($event)"
            (editCancel)="editCancel.emit()"
            (duplicateItem)="duplicateItem.emit($event)"
          />
          }
          <!-- Cluster Total -->
          <tr class="cluster-total">
            <td colspan="10" style="text-align: right; font-weight: 600;">
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
      .table-container {
        overflow: hidden;
        border-radius: var(--radius);
        border: 1px solid var(--border);
        background: var(--card);
      }
      table {
        width: auto;
        min-width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }
      th,
      td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid var(--border);
        vertical-align: middle;
      }
      th {
        background: var(--muted);
        font-weight: 600;
        color: var(--muted-foreground);
        white-space: nowrap;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      tbody tr:last-child td {
        border-bottom: none;
      }
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
}
