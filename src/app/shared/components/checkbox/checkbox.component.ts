import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
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
  template: `
    <span
      class="flex items-center gap-2"
      [class]="disabled() ? 'cursor-not-allowed' : 'cursor-pointer'"
      [attr.aria-disabled]="disabled()"
      zardId="checkbox"
      #z="zardId"
    >
      <main class="relative flex">
        <input
          #input
          type="checkbox"
          [id]="z.id()"
          [class]="classes()"
          [checked]="currentChecked"
          [disabled]="disabled()"
          (change)="onCheckboxChange($event)"
          (blur)="onCheckboxBlur()"
          name="checkbox"
        />
        <z-icon
          zType="check"
          [class]="
            'text-primary-foreground pointer-events-none absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-opacity ' +
            (currentChecked ? 'opacity-100' : 'opacity-0')
          "
        />
      </main>
      <label [class]="labelClasses()" [for]="z.id()">
        <ng-content />
      </label>
    </span>
  `,
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

  protected readonly classes = computed(() =>
    mergeClasses(
      checkboxVariants({ zType: this.zType(), zSize: this.zSize(), zShape: this.zShape() }),
      this.class()
    )
  );

  protected readonly labelClasses = computed(() =>
    mergeClasses(checkboxLabelVariants({ zSize: this.zSize() }))
  );

  private _checked = false;
  get currentChecked(): boolean {
    return this.checked() || this._checked;
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
