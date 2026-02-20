import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BacklogComment } from '../../core/models/domain.model';
import { BacklogService } from '../../core/services/backlog.service';
import { I18nService } from '../../core/services/i18n.service';
import { BacklogRepository } from '../../data/backlog.repository';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardDialogRef } from '../../shared/components/dialog/dialog-ref';
import { Z_MODAL_DATA } from '../../shared/components/dialog/dialog.service';
import { ZardIconComponent } from '../../shared/components/icon/icon.component';
import { ZardInputDirective } from '../../shared/components/input';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-backlog-comments-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    ZardButtonComponent,
    ZardIconComponent,
    ZardInputDirective,
  ],
  template: `
    <div
      class="flex flex-col h-[600px] max-h-[85vh] w-full bg-slate-50 overflow-hidden rounded-xl flex-1 shadow-2xl ring-1 ring-slate-900/5"
    >
      <!-- Header -->
      <div class="px-6 py-5 flex justify-between items-start bg-white shadow-sm z-10">
        <div class="flex items-start gap-4">
          <div
            class="w-10 h-10 mt-0.5 bg-blue-50/80 rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-blue-100/50"
          >
            <z-icon zType="message-square" class="w-5 h-5" />
          </div>
          <div class="flex flex-col gap-1">
            <h2 class="text-xl font-bold text-slate-800 tracking-tight leading-none">
              {{ 'backlog.comments_title' | translate }}
            </h2>
            <p
              class="text-slate-500 text-[13px] font-medium leading-snug max-w-[380px] line-clamp-2"
            >
              {{ data.item.title }}
            </p>
          </div>
        </div>
        <button
          (click)="close()"
          class="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <z-icon zType="x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Comments List -->
      <div class="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-slate-50/50">
        @if (comments().length > 0) {
          <div class="space-y-4">
            @for (comment of comments(); track comment.id) {
              <div
                class="flex flex-col bg-white rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] border border-slate-200/60 p-5 transition-shadow hover:shadow-md"
              >
                <div class="flex justify-between items-center mb-3">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs"
                    >
                      {{ (comment.userName || 'A').charAt(0).toUpperCase() }}
                    </div>
                    <span class="font-bold text-slate-800 text-sm">{{
                      comment.userName || 'Anonyme'
                    }}</span>
                  </div>
                  <span class="text-[11px] text-slate-400 font-medium italic">
                    {{ comment.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                  </span>
                </div>
                <p class="text-slate-600 text-sm whitespace-pre-wrap pl-11">
                  {{ comment.content }}
                </p>
              </div>
            }
          </div>
        } @else if (loading()) {
          <div class="flex flex-col items-center justify-center h-full text-slate-300 py-10">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p class="text-slate-400">Chargement des commentaires...</p>
          </div>
        } @else {
          <div
            class="flex flex-col items-center justify-center h-full text-slate-300 py-10 grayscale opacity-60"
          >
            <z-icon zType="message-square" class="w-16 h-16 mb-4 opacity-20" />
            <p class="text-xl font-bold text-slate-400 uppercase tracking-tighter">
              {{ 'backlog.no_comments' | translate }}
            </p>
          </div>
        }
      </div>

      <!-- Footer / Input -->
      <div class="p-5 border-t border-slate-100 bg-white">
        <div class="flex flex-col gap-3 w-full relative">
          <textarea
            z-input
            [(ngModel)]="newComment"
            [placeholder]="'backlog.comment_placeholder' | translate"
            rows="1"
            class="resize-none w-full text-sm bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors rounded-xl px-4 py-3 min-h-[50px] leading-[22px] overflow-hidden"
            (keydown.meta.enter)="addComment()"
            (keydown.ctrl.enter)="addComment()"
          ></textarea>

          <div class="flex flex-col items-end w-full mt-1">
            <div class="flex flex-col items-center gap-1.5">
              <button
                z-button
                (click)="addComment()"
                [disabled]="!newComment.trim() || submitting()"
                class="rounded-xl shadow-sm font-medium px-6 py-2"
              >
                @if (submitting()) {
                  <span class="mr-2 animate-spin">⏳</span>
                }
                {{ 'backlog.add_comment' | translate }}
              </button>
              <span class="text-[10px] text-slate-400 font-medium text-center">
                Appuyez sur
                <kbd
                  class="px-1 py-0.5 mx-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[8.5px]"
                  >⌘ ↵</kbd
                >
                pour envoyer
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        width: 100%;
        overflow: hidden;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e2e8h0;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #cbd5e1;
      }
    `,
  ],
})
export class BacklogCommentsModalComponent implements OnInit {
  private dialogRef = inject(ZardDialogRef);
  data = inject(Z_MODAL_DATA);
  private backlogService = inject(BacklogService);
  private backlogRepo = inject(BacklogRepository);
  i18n = inject(I18nService);

  comments = signal<BacklogComment[]>([]);
  loading = signal(true);
  submitting = signal(false);
  newComment = '';

  ngOnInit() {
    this.loadComments();
  }

  loadComments() {
    this.loading.set(true);
    this.backlogService.getItemComments(this.data.item.id).subscribe({
      next: (comments) => {
        this.comments.set(comments);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  addComment() {
    if (!this.newComment.trim() || this.submitting()) return;

    this.submitting.set(true);
    this.backlogService.addItemComment(this.data.item.id, this.newComment.trim()).subscribe({
      next: (comment) => {
        this.comments.update((prev) => [comment, ...prev]);
        if (this.data.item.commentCount === undefined) {
          this.data.item.commentCount = 1;
        } else {
          this.data.item.commentCount++;
        }

        this.backlogRepo.updateLocal(this.data.item);

        this.newComment = '';
        this.submitting.set(false);
      },
      error: () => {
        this.submitting.set(false);
      },
    });
  }

  close() {
    this.dialogRef.close();
  }
}
