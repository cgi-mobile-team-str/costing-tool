import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BacklogItem, Profile } from '../../core/models/domain.model';

@Component({
  selector: 'app-backlog-row',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <tr>
      <td>
        <input type="checkbox" [checked]="isSelected" (change)="selectionToggle.emit(item.id)" />
      </td>
      <!-- Title -->
      <td style="width: 300px;" (dblclick)="startEdit('title')">
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
        <strong style="padding-left: 1rem; font-size: 0.8125rem;">{{ item.title }}</strong>
        }
      </td>
      <!-- Description -->
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
      <!-- Hypotheses -->
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
      <!-- Comments -->
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
      <!-- Moscow -->
      <td (dblclick)="startEdit('moscow')">
        @if (isEditing('moscow')) {
        <select
          class="inline-edit-select"
          [(ngModel)]="item.moscow"
          (blur)="cancelEdit()"
          (change)="saveEdit()"
        >
          <option value="Must">Must</option>
          <option value="Should">Should</option>
          <option value="Could">Could</option>
          <option value="Won't">Won't</option>
        </select>
        } @else {
        <span class="badge moscow">{{ item.moscow || '-' }}</span>
        }
      </td>
      <!-- Scope -->
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
      <!-- Profile -->
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
      <!-- Charge Type -->
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
      <!-- Effort -->
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
      <td>{{ itemCost | currency : 'EUR' }}</td>
      <td class="actions">
        <a [routerLink]="['/backlog', item.id]" class="btn-icon" title="Edit">
          <img src="/assets/pen-to-square-regular-full.svg" alt="Edit" width="20" height="20" />
        </a>
        <button (click)="duplicateItem.emit(item)" class="btn-icon" title="Duplicate">
          <img src="/assets/copy-regular-full.svg" alt="Copy" width="20" height="20" />
        </button>
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
      .badge {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.625rem;
        border-radius: calc(var(--radius) - 2px);
        font-size: 0.75rem;
        font-weight: 600;
        white-space: nowrap;
      }
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
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.1rem;
        margin-right: 0.5rem;
      }
      .actions {
        white-space: nowrap;
      }
    `,
  ],
})
export class BacklogRowComponent {
  @Input() item!: BacklogItem;
  @Input() profiles: Profile[] = [];
  @Input() isSelected = false;
  @Input() editingCell: { itemId: string; field: string } | null = null;
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
}
