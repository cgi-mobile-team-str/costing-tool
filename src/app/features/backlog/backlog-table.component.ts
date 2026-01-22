import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, ViewEncapsulation } from '@angular/core';
import { BacklogItem, Profile } from '../../core/models/domain.model';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardCheckboxComponent } from '../../shared/components/checkbox/checkbox.component';
import { ZardDialogService } from '../../shared/components/dialog/dialog.service';
import { ZardIconComponent } from '../../shared/components/icon/icon.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { BacklogRowComponent } from './backlog-row.component';
import { RenameDialogComponent, RenameDialogData } from './rename-dialog/rename-dialog.component';

export interface ClusterGroup {
  clusterId: string;
  cluster: string;
  items: BacklogItem[];
}

@Component({
  selector: 'app-backlog-table',
  standalone: true,
  imports: [
    CommonModule,
    BacklogRowComponent,
    CurrencyPipe,
    TranslatePipe,
    ZardCheckboxComponent,
    ZardButtonComponent,
    ZardIconComponent,
  ],
  templateUrl: './backlog-table.component.html',
  styleUrls: ['./backlog-table.component.css'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class BacklogTableComponent {
  private dialogService = inject(ZardDialogService);
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
  @Output() deleteItem = new EventEmitter<BacklogItem>();
  @Output() addItemToCluster = new EventEmitter<string>();
  @Output() moveItemUp = new EventEmitter<BacklogItem>();
  @Output() moveItemDown = new EventEmitter<BacklogItem>();
  @Output() moveClusterUp = new EventEmitter<string>();
  @Output() moveClusterDown = new EventEmitter<string>();
  @Output() renameCluster = new EventEmitter<{ clusterId: string; newName: string }>();

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

  getClusterTotal(items: BacklogItem[]): number {
    return items.reduce((sum, item) => sum + this.getItemCost(item), 0);
  }

  getClusterEffort(items: BacklogItem[]): number {
    return items.reduce((sum, item) => sum + (item.effortDays || 0), 0);
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
