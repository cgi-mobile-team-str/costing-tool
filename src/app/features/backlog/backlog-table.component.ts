import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { BacklogItem, ClusterGroup, Profile } from '../../core/models/domain.model';
import { ZardCheckboxComponent } from '../../shared/components/checkbox/checkbox.component';
import { ZardDialogService } from '../../shared/components/dialog/dialog.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { BacklogRowComponent } from './backlog-row.component';
import { RenameDialogComponent, RenameDialogData } from './rename-dialog/rename-dialog.component';

@Component({
  selector: 'app-backlog-table',
  standalone: true,
  imports: [CommonModule, BacklogRowComponent, TranslatePipe, ZardCheckboxComponent],
  templateUrl: './backlog-table.component.html',
  styleUrls: ['./backlog-table.component.css'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class BacklogTableComponent {
  private dialogService = inject(ZardDialogService);
  @Input() clusterGroup!: ClusterGroup;
  @Input() profiles: Profile[] = [];
  @Input() selectedIds: string[] = [];
  @Input() editingCell: { itemId: string; field: string } | null = null;
  @Input() visibleColumns: string[] = [];
  @Input() getItemCost!: (item: BacklogItem) => number;
  @Input() getItemEffort!: (item: BacklogItem) => number;
  @Input() showHeader = true;
  @Input() showItems = true;
  @Input() isReadOnly = false;

  @Output() toggleAll = new EventEmitter<boolean>();
  @Output() selectionToggle = new EventEmitter<string>();
  @Output() editStart = new EventEmitter<{ itemId: string; field: string }>();
  @Output() editSave = new EventEmitter<BacklogItem>();
  @Output() editCancel = new EventEmitter<void>();
  @Output() duplicateItem = new EventEmitter<BacklogItem>();
  @Output() deleteItem = new EventEmitter<BacklogItem>();
  @Output() addItemToCluster = new EventEmitter<string>();
  @Output() moveItemUp = new EventEmitter<BacklogItem>();
  @Output() moveItemDown = new EventEmitter<BacklogItem>();
  @Output() moveClusterUp = new EventEmitter<string>();
  @Output() moveClusterDown = new EventEmitter<string>();
  @Output() renameCluster = new EventEmitter<{ clusterId: string; newName: string }>();
  @Output() viewHistory = new EventEmitter<BacklogItem>();

  expandedClusters = signal<Set<string>>(new Set());

  toggleCluster(clusterId: string) {
    const set = new Set(this.expandedClusters());
    if (set.has(clusterId)) {
      set.delete(clusterId);
    } else {
      set.add(clusterId);
    }
    this.expandedClusters.set(set);
  }

  isClusterExpanded(clusterId: string): boolean {
    return this.expandedClusters().has(clusterId);
  }

  openRenameClusterDialog(clusterName: string, clusterId: string) {
    this.dialogService.create({
      zTitle: 'Renommer le cluster',
      zContent: RenameDialogComponent,
      zData: { name: clusterName } as RenameDialogData,
      zOkText: 'Enregistrer',
      zOnOk: (instance: RenameDialogComponent) => {
        if (instance.form.valid) {
          const newName = instance.form.value.name;
          if (newName && newName !== clusterName) {
            this.renameCluster.emit({
              clusterId: clusterId,
              newName: newName,
            });
          }
        }
      },
      zWidth: '400px',
    });
  }

  isItemSelected(id: string): boolean {
    return this.selectedIds.includes(id);
  }

  get allSelected(): boolean {
    if (!this.clusterGroup) return false;
    const allItems = this.clusterGroup.items;
    return allItems.length > 0 && allItems.every((item) => this.selectedIds.includes(item.id));
  }

  toggleAllItems(checked: boolean) {
    this.toggleAll.emit(checked);
  }
  getClusterTotal(items: BacklogItem[]): number {
    return items.reduce((sum, item) => sum + this.getItemCost(item), 0);
  }

  getClusterEffort(items: BacklogItem[]): number {
    return items.reduce((sum, item) => sum + this.getItemEffort(item), 0);
  }

  isColumnVisible(columnId: string): boolean {
    return this.visibleColumns.includes(columnId);
  }

  readonly columnsOrder = [
    'description',
    'hypotheses',
    'comments',
    'moscow',
    'scope',
    'profile',
    'chargeType',
    'effort',
    'cost',
  ];

  get sortedVisibleColumns(): string[] {
    return this.columnsOrder.filter((col) => this.visibleColumns.includes(col));
  }

  get firstVisibleColumn(): string | null {
    return (
      this.columnsOrder
        .slice(0, 7) // Columns before effort/cost
        .find((col) => this.visibleColumns.includes(col)) || null
    );
  }

  getColumnClass(columnId: string): string {
    switch (columnId) {
      case 'description':
        return 'desc-col';
      case 'hypotheses':
        return 'hyp-col';
      case 'comments':
        return 'comm-col';
      case 'moscow':
        return 'moscow-col';
      case 'scope':
        return 'scope-col';
      case 'profile':
        return 'profile-col';
      case 'chargeType':
        return 'type-col';
      case 'effort':
        return 'effort-col';
      case 'cost':
        return 'cost-col';
      default:
        return '';
    }
  }
}
