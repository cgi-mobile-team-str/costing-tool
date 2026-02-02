import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { BacklogItem, Profile } from '../../core/models/domain.model';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardDialogService } from '../../shared/components/dialog/dialog.service';
import { ZardIconComponent } from '../../shared/components/icon/icon.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { BacklogTableComponent, ClusterGroup } from './backlog-table.component';
import { RenameDialogComponent, RenameDialogData } from './rename-dialog/rename-dialog.component';

export interface ProductGroup {
  productId: string;
  product: string;
  clusters: ClusterGroup[];
}

@Component({
  selector: 'app-backlog-product-section',
  standalone: true,
  imports: [
    CommonModule,
    BacklogTableComponent,
    CurrencyPipe,
    ZardButtonComponent,
    TranslatePipe,
    ZardIconComponent,
  ],
  templateUrl: './backlog-product-section.component.html',
  styleUrls: ['./backlog-product-section.component.css'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class BacklogProductSectionComponent implements OnChanges {
  private dialog = inject(ZardDialogService);

  expandedClusters = signal<Set<string>>(new Set());

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productGroup'] && this.productGroup?.clusters) {
      const current = this.expandedClusters();
      const next = new Set(current);
      let changed = false;
      for (const c of this.productGroup.clusters) {
        if (!next.has(c.clusterId)) {
          next.add(c.clusterId);
          changed = true;
        }
      }
      if (changed) {
        this.expandedClusters.set(next);
      }
    }
  }

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

  getClusterTotal(items: BacklogItem[]): number {
    return items.reduce((sum, item) => sum + this.getItemCost(item), 0);
  }

  getClusterEffort(items: BacklogItem[]): number {
    return items.reduce((sum, item) => sum + this.getItemEffort(item), 0);
  }

  openRenameClusterDialog(clusterName: string, clusterId: string) {
    this.dialog.create({
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

  @Input() productGroup!: ProductGroup;
  @Input() profiles: Profile[] = [];
  @Input() isExpanded = true;
  @Input() selectedIds: string[] = [];
  @Input() editingCell: { itemId: string; field: string } | null = null;
  @Input() productTotal = 0;
  @Input() productEffort = 0;
  @Input() visibleColumns: string[] = [];
  @Input() getItemCost!: (item: BacklogItem) => number;
  @Input() getItemEffort!: (item: BacklogItem) => number;

  @Output() toggleExpand = new EventEmitter<string>();
  @Output() toggleAll = new EventEmitter<boolean>(); // This one for product-wide
  @Output() toggleAllCluster = new EventEmitter<{ checked: boolean; clusterGroup: ClusterGroup }>();
  @Output() selectionToggle = new EventEmitter<string>();
  @Output() editStart = new EventEmitter<{ itemId: string; field: string }>();
  @Output() editSave = new EventEmitter<BacklogItem>();
  @Output() editCancel = new EventEmitter<void>();
  @Output() duplicateItem = new EventEmitter<BacklogItem>();
  @Output() deleteItem = new EventEmitter<BacklogItem>();
  @Output() addItem = new EventEmitter<{ productId: string; clusterId: string }>();
  @Output() moveItemUp = new EventEmitter<BacklogItem>();
  @Output() moveItemDown = new EventEmitter<BacklogItem>();
  @Output() moveProductUp = new EventEmitter<string>();
  @Output() moveProductDown = new EventEmitter<string>();
  @Output() moveClusterUp = new EventEmitter<string>();
  @Output() moveClusterDown = new EventEmitter<string>();
  @Output() renameProduct = new EventEmitter<{ productId: string; newName: string }>();
  @Output() renameCluster = new EventEmitter<{ clusterId: string; newName: string }>();

  openRenameDialog() {
    this.dialog.create({
      zTitle: 'Renommer le produit',
      zContent: RenameDialogComponent,
      zData: { name: this.productGroup.product } as RenameDialogData,
      zOkText: 'Enregistrer',
      zOnOk: (instance: RenameDialogComponent) => {
        console.log('Dialog OK clicked', instance.form.value);
        if (instance.form.valid) {
          const newName = instance.form.value.name;
          console.log('New name:', newName, 'Current:', this.productGroup.product);
          if (newName && newName !== this.productGroup.product) {
            console.log('Emitting renameProduct', {
              productId: this.productGroup.productId,
              newName: newName,
            });
            this.renameProduct.emit({
              productId: this.productGroup.productId,
              newName: newName,
            });
          }
        } else {
          console.log('Form invalid');
        }
      },
      zWidth: '400px',
    });
  }
}
