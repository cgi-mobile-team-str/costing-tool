import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-history-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="history-tooltip-container bg-white border border-slate-200 rounded-lg shadow-xl p-4 max-w-xs text-xs"
    >
      @if (creatorName || createdAt) {
        <div class="mb-4">
          <div class="flex justify-start gap-6 items-baseline mb-1">
            <h4 class="font-bold text-slate-800 uppercase tracking-tight text-[10px]">Création</h4>
            <span class="text-slate-400 text-[10px]">{{
              createdAt | date: 'dd/MM/yyyy HH:mm'
            }}</span>
          </div>
          <div class="text-slate-600 font-medium pl-2 border-l-2 border-slate-100">
            {{ creatorName }}
          </div>
        </div>
      }

      @if (history && history.length > 0) {
        <div class="space-y-3">
          <div class="space-y-3 max-h-48 overflow-y-auto pr-1">
            @for (entry of history; track entry.id) {
              @if (entry.action === 'update') {
                <div class="flex flex-col py-0.5">
                  <div class="flex justify-start gap-6 items-baseline mb-1">
                    <span class="text-[9px] font-bold text-slate-500 uppercase">Modification</span>
                    <span class="text-slate-400 text-[9px]">{{
                      entry.createdAt | date: 'dd/MM HH:mm'
                    }}</span>
                  </div>
                  <div class="font-medium text-slate-700 pl-2 border-l-2 border-slate-100">
                    {{ entry.userName || 'Anonyme' }}
                  </div>
                </div>
              }
            }
          </div>
        </div>
      } @else if (loading) {
        <div class="text-slate-400 italic py-2 text-center">Chargement de l'historique...</div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .history-tooltip-container {
        animation: fadeIn 150ms ease-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class HistoryTooltipComponent {
  @Input() creatorName = '';
  @Input() createdAt = '';
  @Input() history: any[] = [];
  @Input() loading = false;
}
