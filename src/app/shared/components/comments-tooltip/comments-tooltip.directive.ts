import { Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Directive, ElementRef, HostListener, Input, OnDestroy, inject } from '@angular/core';
import { BacklogService } from '../../../core/services/backlog.service';
import { CommentsTooltipComponent } from './comments-tooltip.component';

@Directive({
  selector: '[appCommentsTooltip]',
  standalone: true,
})
export class CommentsTooltipDirective implements OnDestroy {
  @Input('appCommentsTooltip') itemId!: string;
  @Input() appCommentsTooltipDisabled = false;

  private overlay = inject(Overlay);
  private overlayPositionBuilder = inject(OverlayPositionBuilder);
  private elementRef = inject(ElementRef);
  private backlogService = inject(BacklogService);

  private overlayRef: OverlayRef | null = null;
  private isMouseInside = false;
  private closeTimeout: any;

  @HostListener('mouseenter', ['$event'])
  show(event: MouseEvent) {
    if (this.appCommentsTooltipDisabled || this.overlayRef) return;
    this.isMouseInside = true;
    clearTimeout(this.closeTimeout);

    const positionStrategy = this.overlayPositionBuilder
      .flexibleConnectedTo(this.elementRef)
      .withPositions([
        {
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
          offsetY: -8,
        },
        {
          originX: 'center',
          originY: 'bottom',
          overlayX: 'center',
          overlayY: 'top',
          offsetY: 8,
        },
        {
          originX: 'start',
          originY: 'center',
          overlayX: 'end',
          overlayY: 'center',
          offsetX: -8,
        },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
    });

    const tooltipPortal = new ComponentPortal(CommentsTooltipComponent);
    const tooltipRef = this.overlayRef.attach(tooltipPortal);

    tooltipRef.instance.loading = true;

    this.backlogService.getItemComments(this.itemId).subscribe({
      next: (comments) => {
        tooltipRef.instance.comments = comments;
        tooltipRef.instance.loading = false;
        if (!comments || comments.length === 0) {
          this.hide();
        } else {
          tooltipRef.changeDetectorRef.detectChanges();
        }
      },
      error: () => {
        tooltipRef.instance.loading = false;
        this.hide();
      },
    });

    // Add event listeners to overlay elements to prevent hiding when hovering the tooltip itself
    if (this.overlayRef && this.overlayRef.overlayElement) {
      this.overlayRef.overlayElement.addEventListener('mouseenter', () => {
        this.isMouseInside = true;
        clearTimeout(this.closeTimeout);
      });

      this.overlayRef.overlayElement.addEventListener('mouseleave', () => {
        this.isMouseInside = false;
        this.scheduleHide();
      });
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.isMouseInside = false;
    this.scheduleHide();
  }

  private scheduleHide() {
    this.closeTimeout = setTimeout(() => {
      if (!this.isMouseInside) {
        this.hide();
      }
    }, 150);
  }

  hide() {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef = null;
    }
  }

  ngOnDestroy() {
    this.hide();
    clearTimeout(this.closeTimeout);
  }
}
