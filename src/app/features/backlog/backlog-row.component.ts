import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BacklogItem, Profile } from '../../core/models/domain.model';
import { ZardCheckboxComponent } from '../../shared/components/checkbox/checkbox.component';

@Component({
  selector: 'app-backlog-row',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardCheckboxComponent],
  template: `
    <tr>
      <td style="width: 32px; padding-right: 0;">
        <z-checkbox [checked]="isSelected" (checkChange)="selectionToggle.emit(item.id)" />
      </td>
      <!-- Title -->
      <td style="width: 300px; padding-left: 0.5rem;" (dblclick)="startEdit('title')">
        @if (isEditing('title')) {
        <input
          type="text"
          class="inline-edit"
          [(ngModel)]="item.title"
          (blur)="saveEdit()"
          (keydown.enter)="saveEdit()"
          (keydown.escape)="cancelEdit()"
        />
        } @else {
        <strong style="font-size: 0.8125rem;">{{ item.title }}</strong>
        }
      </td>
      <!-- Description -->
      @if (visibleColumns.includes('description')) {
      <td class="text-small" (dblclick)="startEdit('description')">
        @if (isEditing('description')) {
        <textarea
          class="inline-edit"
          [(ngModel)]="item.description"
          (blur)="saveEdit()"
          (keydown.escape)="cancelEdit()"
          rows="2"
        ></textarea>
        } @else {
        {{ item.description || '-' }}
        }
      </td>
      }
      <!-- Hypotheses -->
      @if (visibleColumns.includes('hypotheses')) {
      <td class="text-small" (dblclick)="startEdit('hypotheses')">
        @if (isEditing('hypotheses')) {
        <textarea
          class="inline-edit"
          [(ngModel)]="item.hypotheses"
          (blur)="saveEdit()"
          (keydown.escape)="cancelEdit()"
          rows="2"
        ></textarea>
        } @else {
        {{ item.hypotheses || '-' }}
        }
      </td>
      }
      <!-- Comments -->
      @if (visibleColumns.includes('comments')) {
      <td class="text-small" (dblclick)="startEdit('comments')">
        @if (isEditing('comments')) {
        <textarea
          class="inline-edit"
          [(ngModel)]="item.comments"
          (blur)="saveEdit()"
          (keydown.escape)="cancelEdit()"
          rows="2"
        ></textarea>
        } @else {
        {{ item.comments || '-' }}
        }
      </td>
      }
      <!-- Moscow -->
      @if (visibleColumns.includes('moscow')) {
      <td (dblclick)="startEdit('moscow')">
        @if (isEditing('moscow')) {
        <select
          class="inline-edit-select"
          [(ngModel)]="item.moscow"
          (blur)="cancelEdit()"
          (change)="saveEdit()"
        >
          <option value="MUST">Must</option>
          <option value="SHOULD">Should</option>
          <option value="COULD">Could</option>
          <option value="WONT">Won't</option>
        </select>
        } @else {
        <span class="badge moscow">{{ item.moscow || '-' }}</span>
        }
      </td>
      }
      <!-- Scope -->
      @if (visibleColumns.includes('scope')) {
      <td (dblclick)="startEdit('scope')">
        @if (isEditing('scope')) {
        <select
          class="inline-edit-select"
          [(ngModel)]="item.scope"
          (blur)="cancelEdit()"
          (change)="saveEdit()"
        >
          <option value="MVP">MVP</option>
          <option value="V1">V1</option>
          <option value="V2">V2</option>
        </select>
        } @else {
        <span class="badge" [class]="item.scope">{{ item.scope }}</span>
        }
      </td>
      }
      <!-- Profile -->
      @if (visibleColumns.includes('profile')) {
      <td (dblclick)="startEdit('profileId')">
        @if (isEditing('profileId')) {
        <select
          class="inline-edit-select"
          [(ngModel)]="item.profileId"
          (blur)="cancelEdit()"
          (change)="saveEdit()"
        >
          @for (p of profiles; track p.id) {
          <option [value]="p.id">{{ p.name }}</option>
          }
        </select>
        } @else {
        {{ getProfileName(item.profileId) }}
        }
      </td>
      }
      <!-- Charge Type -->
      @if (visibleColumns.includes('chargeType')) {
      <td (dblclick)="startEdit('chargeType')">
        @if (isEditing('chargeType')) {
        <select
          class="inline-edit-select"
          [(ngModel)]="item.chargeType"
          (blur)="cancelEdit()"
          (change)="saveEdit()"
        >
          <option value="days">RTU</option>
          <option value="ratio">Ratio</option>
        </select>
        } @else {
        {{ item.chargeType === 'ratio' ? 'Ratio' : 'RTU' }}
        }
      </td>
      }
      <!-- Effort -->
      @if (visibleColumns.includes('effort')) {
      <td (dblclick)="startEdit('effortDays')">
        @if (isEditing('effortDays')) {
        <input
          type="number"
          class="inline-edit"
          [(ngModel)]="item.effortDays"
          (blur)="saveEdit()"
          (keydown.enter)="saveEdit()"
          (keydown.escape)="cancelEdit()"
          step="0.5"
          min="0"
        />
        } @else {
        {{ item.effortDays }}{{ item.chargeType === 'ratio' ? '%' : 'j' }}
        }
      </td>
      } @if (visibleColumns.includes('cost')) {
      <td>{{ itemCost | currency : 'EUR' }}</td>
      }
      <td class="actions">
        <div class="actions-container">
          <button (click)="startEdit('title')" class="btn-icon" title="Edit">
            <img src="/assets/pen-to-square-regular-full.svg" alt="Edit" width="20" height="20" />
          </button>
          <button (click)="duplicateItem.emit(item)" class="btn-icon" title="Duplicate">
            <img src="/assets/copy-regular-full.svg" alt="Copy" width="20" height="20" />
          </button>
        </div>
      </td>
    </tr>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      tr {
        transition: background-color 0.15s ease;
      }
      tr:hover {
        background: rgba(227, 25, 55, 0.08);
      }
      td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid var(--border);
        vertical-align: middle;
      }
      .text-small {
        font-size: 0.8125rem;
        max-width: 600px;
        min-width: 250px;
        white-space: pre-line;
        word-wrap: break-word;
        color: var(--muted-foreground);
      }
      /* Inherited global badge */
      .badge.MVP {
        background: #dcfce7;
        color: #166534;
      }
      .badge.V1 {
        background: #fef3c7;
        color: #92400e;
      }
      .badge.V2 {
        background: #dbeafe;
        color: #1e40af;
      }
      .badge.moscow {
        background: var(--muted);
        color: var(--muted-foreground);
      }
      .inline-edit,
      .inline-edit-select {
        width: 100%;
        padding: 0.375rem 0.5rem;
        border: 2px solid #3b82f6;
        border-radius: 4px;
        font-size: 0.875rem;
        background: white;
        color: var(--foreground);
        outline: none;
      }
      .inline-edit:focus,
      .inline-edit-select:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      td[dblclick] {
        cursor: pointer;
      }
      td[dblclick]:hover {
        background: rgba(59, 130, 246, 0.05);
      }
      .btn-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s;
      }
      .btn-icon:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
      .actions {
        padding: 0 1rem;
        white-space: nowrap;
        min-width: 80px;
        vertical-align: middle;
      }
      .actions-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        height: 100%;
        min-height: 40px; /* Ensures a minimum height for the hit area */
      }
    `,
  ],
})
export class BacklogRowComponent {
  @Input() item!: BacklogItem;
  @Input() profiles: Profile[] = [];
  @Input() isSelected = false;
  @Input() editingCell: { itemId: string; field: string } | null = null;
  @Input() visibleColumns: string[] = [];
  @Input() itemCost = 0;

  @Output() selectionToggle = new EventEmitter<string>();
  @Output() editStart = new EventEmitter<{ itemId: string; field: string }>();
  @Output() editSave = new EventEmitter<BacklogItem>();
  @Output() editCancel = new EventEmitter<void>();
  @Output() duplicateItem = new EventEmitter<BacklogItem>();

  isEditing(field: string): boolean {
    return (
      this.editingCell !== null &&
      this.editingCell.itemId === this.item.id &&
      this.editingCell.field === field
    );
  }

  startEdit(field: string) {
    this.editStart.emit({ itemId: this.item.id, field });
  }

  saveEdit() {
    this.editSave.emit(this.item);
  }

  cancelEdit() {
    this.editCancel.emit();
  }

  getProfileName(id: string): string {
    return this.profiles.find((p) => p.id === id)?.name || 'Unknown';
  }

  isColumnVisible(columnId: string): boolean {
    return this.visibleColumns.includes(columnId);
  }
}
