import { Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Directive, ElementRef, HostListener, Input, OnDestroy, inject } from '@angular/core';
import { BacklogService } from '../../../core/services/backlog.service';
import { HistoryTooltipComponent } from './history-tooltip.component';

@Directive({
  selector: '[appHistoryTooltip]',
  standalone: true,
})
export class HistoryTooltipDirective implements OnDestroy {
  @Input('appHistoryTooltip') itemId!: string;
  @Input() creatorName = '';
  @Input() createdAt = '';
  @Input() appHistoryTooltipDisabled = false;

  private overlay = inject(Overlay);
  private overlayPositionBuilder = inject(OverlayPositionBuilder);
  private elementRef = inject(ElementRef);
  private backlogService = inject(BacklogService);

  private overlayRef: OverlayRef | null = null;

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.appHistoryTooltipDisabled) return;
    if (!this.overlayRef) {
      this.show(event);
      return;
    }

    const positionStrategy = this.overlayPositionBuilder
      .flexibleConnectedTo({
        x: event.clientX,
        y: event.clientY,
        width: 0,
        height: 0,
      })
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 15,
          offsetX: 15,
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          offsetY: -15,
          offsetX: 15,
        },
      ]);

    this.overlayRef.updatePositionStrategy(positionStrategy);
  }

  @HostListener('mouseenter', ['$event'])
  show(event: MouseEvent) {
    if (this.appHistoryTooltipDisabled || this.overlayRef) return;

    const positionStrategy = this.overlayPositionBuilder
      .flexibleConnectedTo({
        x: event.clientX,
        y: event.clientY,
        width: 0,
        height: 0,
      })
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 15,
          offsetX: 15,
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          offsetY: -15,
          offsetX: 15,
        },
      ]);

    this.overlayRef = this.overlay.create({ positionStrategy });

    const tooltipPortal = new ComponentPortal(HistoryTooltipComponent);
    const tooltipRef = this.overlayRef.attach(tooltipPortal);

    tooltipRef.instance.creatorName = this.creatorName;
    tooltipRef.instance.createdAt = this.createdAt;
    tooltipRef.instance.loading = true;

    this.backlogService.getItemHistory(this.itemId).subscribe({
      next: (history) => {
        tooltipRef.instance.history = history;
        tooltipRef.instance.loading = false;

        // Hide if absolutely no info to show
        if (!this.creatorName && !this.createdAt && (!history || history.length === 0)) {
          this.hide();
        } else {
          tooltipRef.changeDetectorRef.detectChanges();
        }
      },
      error: () => {
        tooltipRef.instance.loading = false;
        if (!this.creatorName && !this.createdAt) {
          this.hide();
        } else {
          tooltipRef.changeDetectorRef.detectChanges();
        }
      },
    });
  }

  @HostListener('mouseleave')
  hide() {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef = null;
    }
  }

  ngOnDestroy() {
    this.hide();
  }
}
