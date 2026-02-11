import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ZardDialogRef } from '../dialog/dialog-ref';
import { Z_MODAL_DATA } from '../dialog/dialog.service';

interface HistoryEntry {
  // ... (trimmed for brevity but keeping the rest of the file)
  id: string;
  itemId: string;
  userId: string;
  action: string;
  oldData: any;
  newData: any;
  userName: string;
  createdAt: string;
}

interface DiffItem {
  field: string;
  before: any;
  after: any;
}

@Component({
  selector: 'app-history-dialog',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="flex flex-col h-full w-full bg-slate-50 overflow-hidden rounded-xl">
      <!-- Header -->
      <div class="px-8 py-6 border-b flex justify-between items-center bg-white shadow-sm z-10">
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div>
            <h2 class="text-2xl font-extrabold text-slate-800 tracking-tight">
              {{ 'backlog.history_title' | translate }}
            </h2>
            <p class="text-slate-500 text-sm font-medium">{{ 'history.subtitle' | translate }}</p>
          </div>
        </div>
        <button
          (click)="close()"
          class="p-2.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all duration-200 border border-transparent hover:border-slate-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-8 bg-slate-50/50 custom-scrollbar">
        @if (history && history.length > 0) {
          <div class="space-y-10">
            @for (entry of history; track entry.id) {
              <div class="relative pl-10">
                <!-- Timeline indicator -->
                <div class="absolute left-4 top-0 bottom-0 w-px bg-slate-200"></div>
                <div
                  class="absolute left-[13px] top-6 w-[7px] h-[7px] bg-indigo-500 rounded-full ring-4 ring-indigo-50 shadow-sm"
                ></div>

                <div
                  class="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <!-- Entry Header -->
                  <div
                    class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/40"
                  >
                    <div class="flex items-center gap-4">
                      <div
                        class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-indigo-100 shadow-lg"
                      >
                        {{ (entry.userName || 'A').charAt(0).toUpperCase() }}
                      </div>
                      <div class="flex flex-col">
                        <span class="font-bold text-slate-800 text-sm leading-tight">{{
                          entry.userName || 'Anonyme'
                        }}</span>
                        <div class="flex items-center gap-2 mt-0.5">
                          <span
                            class="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded border border-indigo-100/50"
                          >
                            {{ getActionLabel(entry.action) | translate }}
                          </span>
                          <span class="text-[11px] text-slate-400 font-medium italic">
                            {{ entry.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Changes -->
                  <div class="p-0 overflow-x-auto">
                    @if (getDiff(entry).length > 0) {
                      <table class="w-full text-sm border-collapse table-fixed">
                        <colgroup>
                          <col class="w-[30%]" />
                          <col class="w-[35%]" />
                          <col class="w-[35%]" />
                        </colgroup>
                        <thead
                          class="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest text-left"
                        >
                          <tr>
                            <th class="px-6 py-3 border-b border-slate-100">
                              {{ 'history.field' | translate }}
                            </th>
                            <th class="px-6 py-3 border-b border-slate-100">
                              {{ 'history.before' | translate }}
                            </th>
                            <th class="px-6 py-3 border-b border-slate-100">
                              {{ 'history.after' | translate }}
                            </th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                          @for (item of getDiff(entry); track item.field) {
                            <tr class="group hover:bg-slate-50/30 transition-colors">
                              <td
                                class="px-6 py-4 font-bold text-slate-700 align-top whitespace-nowrap bg-slate-50/10"
                              >
                                <div class="flex items-center gap-2">
                                  <div
                                    class="w-1.5 h-6 bg-indigo-100 rounded-full group-hover:bg-indigo-300 transition-colors"
                                  ></div>
                                  {{ getFieldLabel(item.field) | translate }}
                                </div>
                              </td>
                              <td
                                class="px-6 py-4 text-slate-400 align-top line-through decoration-red-200/60 decoration-1 italic"
                              >
                                {{ formatValue(item.field, item.before) }}
                              </td>
                              <td
                                class="px-6 py-4 text-slate-800 font-semibold align-top bg-emerald-50/10"
                              >
                                <span
                                  class="bg-emerald-50 text-emerald-800 px-2 py-1 rounded-md border border-emerald-100/50"
                                >
                                  {{ formatValue(item.field, item.after) }}
                                </span>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    } @else {
                      <div class="p-8 text-center text-slate-400 font-medium italic text-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="mx-auto mb-2 opacity-30"
                        >
                          <path
                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                          ></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        {{ 'history.no_changes' | translate }}
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div
            class="flex flex-col items-center justify-center h-full text-slate-300 py-20 grayscale opacity-60"
          >
            <div
              class="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-8 shadow-inner border border-slate-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <p class="text-2xl font-black text-slate-400 uppercase tracking-tighter">
              {{ 'history.no_data' | translate }}
            </p>
            <p class="text-slate-400 mt-2 font-medium">
              {{ 'history.no_history_yet_hint' | translate }}
            </p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
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
        background: #e2e8f0;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #cbd5e1;
      }
    `,
  ],
})
export class HistoryDialogComponent implements OnInit {
  private dialogRef = inject(ZardDialogRef);
  private data = inject(Z_MODAL_DATA);
  private i18n = inject(I18nService);

  history: HistoryEntry[] = [];
  profiles: any[] = this.data.profiles || [];
  products: any[] = this.data.products || [];
  clusters: any[] = this.data.clusters || [];

  ngOnInit() {
    this.processHistory();
  }

  private processHistory() {
    const rawHistory = this.data.history || [];
    const item = this.data.item;
    let history = [...rawHistory];

    // Ensure we have a birth entry
    const hasCreate = history.some((h) => h.action === 'create');

    if (!hasCreate) {
      if (history.length > 0) {
        // Synthesize from oldest modification's oldData
        const oldestEntry = history[history.length - 1];
        history.push({
          id: 'virtual-birth-' + (item?.id || 'unknown'),
          itemId: item?.id || oldestEntry.itemId,
          userId: item?.userId || oldestEntry.userId,
          action: 'create',
          oldData: null,
          newData: oldestEntry.oldData || {}, // Should contain initial state
          userName: item?.creatorName || this.translate('history.initial_author'),
          createdAt: item?.createdAt || oldestEntry.createdAt,
        });
      } else if (item) {
        // Pure birth, no modifications
        history.push({
          id: 'virtual-birth-fallback',
          itemId: item.id || 'unknown',
          userId: item.userId || 'system',
          action: 'create',
          oldData: null,
          newData: item,
          userName: item.creatorName || this.translate('history.initial_author'),
          createdAt: item.createdAt || new Date().toISOString(),
        });
      }
    }

    // Always sort newest first (createdAt DESC)
    history = history.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    this.history = history;
  }

  close() {
    this.dialogRef.close();
  }

  getActionLabel(action: string): string {
    return `history.action_${action.toLowerCase()}`;
  }

  getFieldLabel(field: string): string {
    const mapping: Record<string, string> = {
      title: 'backlog.title',
      description: 'backlog.description',
      hypotheses: 'backlog.hypotheses',
      comments: 'backlog.comments',
      scope: 'backlog.scope',
      moscow: 'backlog.moscow',
      effortDays: 'backlog.effort',
      profileId: 'backlog.profile',
      chargeType: 'backlog.chargeType',
      type: 'backlog.itemType',
      productId: 'backlog.product',
      clusterId: 'backlog.cluster',
    };
    return mapping[field] || field;
  }

  getDiff(entry: HistoryEntry): DiffItem[] {
    const diff: DiffItem[] = [];
    const oldData = entry.oldData || {};
    const newData = entry.newData || {};

    // Combine all keys from both objects
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    const ignored = [
      'id',
      'itemId',
      'userId',
      'projectId',
      'createdAt',
      'updatedAt',
      'order',
      'creatorName',
    ];

    for (const key of allKeys) {
      if (ignored.includes(key)) continue;

      const before = oldData[key];
      const after = newData[key];

      // Compare values loosely
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        diff.push({ field: key, before, after });
      }
    }

    return diff;
  }

  formatValue(field: string, value: any): string {
    if (value === null || value === undefined || value === '') return '-';

    if (field === 'moscow') return this.translate(`backlog.moscow_${String(value).toLowerCase()}`);
    if (field === 'scope') return this.translate(`backlog.scope_${String(value).toLowerCase()}`);
    if (field === 'type') return this.translate(`backlog.type_${String(value).toLowerCase()}`);
    if (field === 'effortDays') return Number(value).toFixed(2);

    // Resolve IDs to names using the passed data
    if (field === 'profileId') {
      const profile = this.profiles.find((p) => p.id === value);
      return profile ? profile.name : value;
    }
    if (field === 'productId') {
      const product = this.products.find((p) => p.id === value);
      return product ? product.name : value;
    }
    if (field === 'clusterId') {
      const cluster = this.clusters.find((c) => c.id === value);
      return cluster ? cluster.name : value;
    }

    return String(value);
  }

  translate(key: string): string {
    return this.i18n.translate(key);
  }
}
