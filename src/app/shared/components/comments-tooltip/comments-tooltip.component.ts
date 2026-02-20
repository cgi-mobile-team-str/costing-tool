import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-comments-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="comments-tooltip-container bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] p-5 max-w-md w-[400px] text-sm"
    >
      @if (comments && comments.length > 0) {
        <div class="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          @for (comment of comments; track comment.id) {
            <div class="flex flex-col gap-1">
              <div class="flex justify-between items-center text-[11px]">
                <span class="font-bold text-slate-700">{{ comment.userName || 'Anonyme' }}</span>
                <span class="text-slate-400">{{
                  comment.createdAt | date: 'dd/MM/yyyy HH:mm'
                }}</span>
              </div>
              <p class="text-slate-600 text-xs whitespace-pre-wrap leading-relaxed">
                {{ comment.content }}
              </p>
            </div>
          }
        </div>
      } @else if (loading) {
        <div class="flex flex-col items-center justify-center py-6 text-slate-400">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mb-2"></div>
          <span class="text-xs italic">Chargement...</span>
        </div>
      } @else {
        <div class="text-slate-400 italic py-4 text-center text-xs">Aucun commentaire</div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .comments-tooltip-container {
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
      /* Custom scrollbar for tooltip */
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #cbd5e1;
        border-radius: 4px;
      }
      .custom-scrollbar:hover::-webkit-scrollbar-thumb {
        background-color: #94a3b8;
      }
    `,
  ],
})
export class CommentsTooltipComponent {
  @Input() comments: any[] = [];
  @Input() loading = false;
}
