import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import type { ClassValue } from 'clsx';
import { Check } from 'lucide-angular';

import { ZardIconComponent } from '../icon/icon.component';

import { ZardSelectComponent } from './select.component';
import { selectItemVariants } from './select.variants';

import { mergeClasses, transform } from '@/shared/utils/merge-classes';

@Component({
  selector: 'z-select-item',
  imports: [ZardIconComponent],
  template: `
    <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      @if (isSelected()) {
        <z-icon [zType]="checkIcon" zSize="sm" />
      }
    </span>
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
    '[attr.data-disabled]': 'zDisabled() || null',
    '(click)': 'select()',
  },
})
export class ZardSelectItemComponent {
  readonly elementRef = inject(ElementRef);
  private selectComponent = inject(ZardSelectComponent);

  readonly zValue = input.required<any>();
  readonly zDisabled = input(false, { transform });
  readonly class = input<ClassValue>('');

  protected readonly checkIcon = Check;

  isSelected = computed(() => this.selectComponent.value() === this.zValue());

  get label(): string {
    return this.elementRef.nativeElement.textContent?.trim() || '';
  }

  protected readonly classes = computed(() => mergeClasses(selectItemVariants(), this.class()));

  select() {
    if (!this.zDisabled()) {
      this.selectComponent.select(this.zValue());
    }
  }
}
