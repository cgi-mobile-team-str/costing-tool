import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { ZardIconComponent } from '../icon/icon.component';
import { ZardIcon } from '../icon/icons';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, ZardIconComponent],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class.show]="true" [class]="toast.type">
          <div class="toast-content">
            <z-icon [zType]="getIcon(toast.type)" />
            <span class="message">{{ toast.message }}</span>
          </div>
          <button (click)="toastService.remove(toast.id)" class="close-btn">
            <z-icon zType="x" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        pointer-events: none;
      }
      .toast {
        pointer-events: auto;
        min-width: 300px;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        border-left: 4px solid #e2e8f0;
        animation: slideIn 0.3s ease-out forwards;
      }
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .toast.success {
        border-left-color: #10b981;
      }
      .toast.error {
        border-left-color: #ef4444;
      }
      .toast.warning {
        border-left-color: #f59e0b;
      }
      .toast.info {
        border-left-color: #3b82f6;
      }
      .toast-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .message {
        font-size: 0.875rem;
        color: #1e293b;
        font-weight: 500;
      }
      .close-btn {
        background: none;
        border: none;
        padding: 0.25rem;
        cursor: pointer;
        color: #94a3b8;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.25rem;
      }
      .close-btn:hover {
        background: #f1f5f9;
        color: #64748b;
      }
    `,
  ],
})
export class ToastComponent {
  toastService = inject(ToastService);

  getIcon(type: string): ZardIcon {
    switch (type) {
      case 'success':
        return 'circle-check';
      case 'error':
        return 'circle-alert';
      case 'warning':
        return 'triangle-alert';
      default:
        return 'info';
    }
  }
}
