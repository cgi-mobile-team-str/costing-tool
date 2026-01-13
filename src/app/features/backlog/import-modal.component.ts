import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onAction('cancel')">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h3>Import JSON</h3>
        <p>
          Vous allez importer <strong>{{ itemCount }}</strong> items pour le projet :
        </p>
        <div class="project-input-group">
          <input
            type="text"
            [(ngModel)]="projectName"
            placeholder="Nom du projet"
            class="project-input"
          />
        </div>
        <p class="summary-text">Que souhaitez-vous faire ?</p>
        <div class="modal-actions">
          <button (click)="onAction('add')" class="btn btn-primary">
            Ajouter au backlog existant
          </button>
          <button (click)="onAction('replace')" class="btn btn-warning">
            Remplacer tout le backlog
          </button>
          <button (click)="onAction('cancel')" class="btn btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
      }
      .modal-content {
        background: var(--card);
        padding: 2rem;
        border-radius: var(--radius);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        max-width: 500px;
        width: 90%;
        border: 1px solid var(--border);
        color: var(--foreground);
      }
      h3 {
        margin-top: 0;
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 1rem;
      }
      p {
        color: var(--muted-foreground);
        margin-bottom: 1rem;
        line-height: 1.5;
      }
      .summary-text {
        margin-top: 1.5rem;
      }
      .project-input-group {
        margin-bottom: 1rem;
      }
      .project-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--background);
        color: var(--foreground);
        font-size: 1rem;
        outline: none;
        transition: border-color 0.15s ease;
      }
      .project-input:focus {
        border-color: var(--brand-red);
      }
      .modal-actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      /* Button styles inherited */
      .btn-warning {
        background: #f59e0b;
        color: white;
      }
      .btn-warning:hover {
        background: #d97706;
      }
    `,
  ],
})
export class ImportModalComponent {
  @Input() itemCount = 0;
  @Input() projectName = '';
  @Output() action = new EventEmitter<{
    type: 'add' | 'replace' | 'cancel';
    projectName: string;
  }>();

  onAction(type: 'add' | 'replace' | 'cancel') {
    this.action.emit({ type, projectName: this.projectName });
  }
}
