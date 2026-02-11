import {
  Overlay,
  OverlayModule,
  OverlayPositionBuilder,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  ElementRef,
  inject,
  input,
  model,
  type OnDestroy,
  type OnInit,
  PLATFORM_ID,
  signal,
  type TemplateRef,
  viewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';

import type { ClassValue } from 'clsx';
import { ChevronDown } from 'lucide-angular';

import { ZardIconComponent } from '../icon/icon.component';

import { ZardSelectItemComponent } from './select-item.component';
import { selectContentVariants, selectTriggerVariants } from './select.variants';

import { mergeClasses, transform } from '@/shared/utils/merge-classes';

@Component({
  selector: 'z-select',
  imports: [OverlayModule, ZardIconComponent],
  template: `
    <!-- Select Trigger -->
    <button
      type="button"
      [class]="triggerClasses()"
      (click)="toggle()"
      (keydown.enter.prevent)="toggle()"
      (keydown.space.prevent)="toggle()"
      [disabled]="zDisabled()"
      aria-haspopup="listbox"
      [attr.aria-expanded]="isOpen()"
    >
      <span class="truncate">
        @if (value()) {
          <ng-content select="z-select-trigger" />
          @if (!hasTriggerContent) {
            {{ displayValue() }}
          }
        } @else {
          <span class="text-muted-foreground">{{ zPlaceholder() }}</span>
        }
      </span>
      <z-icon [zType]="chevronIcon" class="h-4 w-4 opacity-50" />
    </button>

    <!-- Template for overlay content -->
    <ng-template #selectTemplate>
      <div
        [class]="contentClasses()"
        role="listbox"
        [attr.data-state]="isOpen() ? 'open' : 'closed'"
        (keydown)="onKeyDown($event)"
        tabindex="-1"
      >
        <div class="p-1">
          <ng-content />
        </div>
      </div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'relative inline-block w-full',
  },
})
export class ZardSelectComponent implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private overlay = inject(Overlay);
  private overlayPositionBuilder = inject(OverlayPositionBuilder);
  private viewContainerRef = inject(ViewContainerRef);
  private platformId = inject(PLATFORM_ID);

  readonly selectTemplate = viewChild.required<TemplateRef<unknown>>('selectTemplate');

  // Content children to find the selected item's label
  readonly items = contentChildren(ZardSelectItemComponent);

  readonly value = model<any>();
  readonly zPlaceholder = input<string>('');
  readonly zDisabled = input(false, { transform });
  readonly class = input<ClassValue>('');

  protected readonly chevronIcon = ChevronDown;

  private overlayRef?: OverlayRef;
  private portal?: TemplatePortal;

  readonly isOpen = signal(false);

  protected readonly triggerClasses = computed(() =>
    mergeClasses(selectTriggerVariants(), this.class()),
  );

  protected readonly contentClasses = computed(() => selectContentVariants());

  // Check if user provided custom trigger content - simplification for now: we use the selected item's textContent
  // In a real implementation we might want to project the selected item's template
  get hasTriggerContent() {
    return false;
  }

  readonly displayValue = computed(() => {
    const val = this.value();
    if (!val) return '';

    // Find the item with matching value and extract its content text
    // This is a limitation: we rely on the item component having been created/content projected.
    // If items are inside the template (which is not rendered yet if closed?), contentChildren might be empty or inactive?
    // Actually contentChildren query works on projected content.
    // But since the items are projected into the overlay (when open), are they available here?
    // Yes, they are projected into <z-select>, so they exist in the component's content.
    // We just move them visually into the overlay.

    const selectedItem = this.items().find((item) => item.zValue() === val);
    // We can't easily get the text content of the projected ng-content of a child component from here in a signal-computed way without reading DOM
    // For now, let's assume the user handles 'display' via the trigger or we just show the value if string?
    // User requested: "Selected value: <z-badge>{{ selectedValue }}</z-badge>" in the usage example
    // BUT the trigger inside z-select itself shows what?

    // In the user example:
    /*
      <z-select ... [(zValue)]="selectedValue">
        <z-select-item zValue="apple">Apple</z-select-item>
      </z-select>
    */
    // The trigger usually displays "Apple".

    if (selectedItem) {
      // We try to get the text content from the element ref if possible,
      // but safely interacting with DOM in computed is tricky.
      // Let's rely on the fact that for simple use cases we might need a label input on items or similar.
      // Or we just display the value if we can't find better.
      // Re-reading usage: User didn't provide label input.

      // Hack: iterate items and find match.
      // Detailed implementation would require ZardSelectItem to report its label.
      // For this task, I'll try to find the element and get text.
      // note: this might not be reactive if the text changes.
      const el = (selectedItem as any).elementRef?.nativeElement;
      if (el) return el.textContent?.trim();
    }

    return val;
  });

  ngOnInit() {
    // No-op
  }

  ngOnDestroy() {
    this.close();
  }

  toggle() {
    if (this.zDisabled()) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.isOpen()) return;

    if (!this.overlayRef) {
      this.createOverlay();
    }

    if (!this.overlayRef) return;

    this.portal = new TemplatePortal(this.selectTemplate(), this.viewContainerRef);
    this.overlayRef.attach(this.portal);
    this.isOpen.set(true);

    // Logic to focus selected item or first item could go here
    this.updateWidth();
  }

  close() {
    if (this.overlayRef?.hasAttached()) {
      this.overlayRef.detach();
    }
    this.isOpen.set(false);
  }

  select(val: any) {
    this.value.set(val);
    this.close();
  }

  onKeyDown(event: KeyboardEvent) {
    // Handle keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
    if (event.key === 'Escape') {
      this.close();
    }
  }

  private createOverlay() {
    if (isPlatformBrowser(this.platformId)) {
      const positionStrategy = this.overlayPositionBuilder
        .flexibleConnectedTo(this.elementRef)
        .withPositions([
          {
            originX: 'start',
            originY: 'bottom',
            overlayX: 'start',
            overlayY: 'top',
            offsetY: 4,
          },
          {
            originX: 'start',
            originY: 'top',
            overlayX: 'start',
            overlayY: 'bottom',
            offsetY: -4,
          },
        ])
        .withPush(false); // Keep content width same as trigger?

      this.overlayRef = this.overlay.create({
        positionStrategy,
        hasBackdrop: true,
        backdropClass: 'cdk-overlay-transparent-backdrop',
        scrollStrategy: this.overlay.scrollStrategies.reposition(),
        minWidth: this.elementRef.nativeElement.offsetWidth, // Match width
      });

      this.overlayRef.backdropClick().subscribe(() => this.close());
    }
  }

  private updateWidth() {
    if (this.overlayRef) {
      this.overlayRef.updateSize({ minWidth: this.elementRef.nativeElement.offsetWidth });
    }
  }
}
