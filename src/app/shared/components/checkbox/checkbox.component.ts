import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import type { ClassValue } from 'clsx';

import { mergeClasses, transform } from '@/shared/utils/merge-classes';
import { ZardIdDirective } from '../../core';

import { ZardIconComponent } from '../icon/icon.component';
import {
  checkboxLabelVariants,
  checkboxVariants,
  type ZardCheckboxVariants,
} from './checkbox.variants';

// Force Tailwind to detect these classes:
// appearance-none [appearance:none] border border-primary border-destructive checked:bg-primary checked:bg-destructive h-4 w-4 h-6 w-6 rounded rounded-full rounded-none
// cursor-[unset] peer transition shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-current empty:hidden text-base text-lg
// stroke-none

type OnTouchedType = () => void;
type OnChangeType = (value: boolean) => void;

@Component({
  selector: 'z-checkbox, [z-checkbox]',
  imports: [ZardIconComponent, ZardIdDirective],
  templateUrl: './checkbox.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZardCheckboxComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'zCheckbox',
})
export class ZardCheckboxComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  readonly checkChange = output<boolean>();
  readonly class = input<ClassValue>('');
  readonly disabled = input(false, { transform });
  readonly zType = input<ZardCheckboxVariants['zType']>('default');
  readonly zSize = input<ZardCheckboxVariants['zSize']>('default');
  readonly zShape = input<ZardCheckboxVariants['zShape']>('default');
  readonly checked = input(false, { transform });

  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  private onChange: OnChangeType = () => {};
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  private onTouched: OnTouchedType = () => {};

  constructor() {
    effect(() => {
      this._checked = this.checked();
      this.cdr.markForCheck();
    });
  }

  protected readonly classes = computed(() =>
    mergeClasses(
      checkboxVariants({ zType: this.zType(), zSize: this.zSize(), zShape: this.zShape() }),
      this.class(),
    ),
  );

  protected readonly labelClasses = computed(() =>
    mergeClasses(checkboxLabelVariants({ zSize: this.zSize() })),
  );

  private _checked = false;
  get currentChecked(): boolean {
    return this._checked;
  }

  writeValue(val: boolean): void {
    this._checked = val;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: OnChangeType): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: OnTouchedType): void {
    this.onTouched = fn;
  }

  onCheckboxBlur(): void {
    this.onTouched();
  }

  onCheckboxChange(event: Event): void {
    if (this.disabled()) {
      return;
    }

    const target = event.target as HTMLInputElement;
    this._checked = target.checked;
    this.onChange(this._checked);
    this.checkChange.emit(this._checked);
  }
}
