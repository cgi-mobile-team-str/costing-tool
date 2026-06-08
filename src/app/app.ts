import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import {
  MSAL_GUARD_CONFIG,
  MsalBroadcastService,
  MsalGuardConfiguration,
  MsalService,
} from '@azure/msal-angular';
import {
  AccountInfo,
  EventMessage,
  EventType,
  InteractionStatus,
} from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { LoadingService } from './core/services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  encapsulation: ViewEncapsulation.None,
})
export class App implements OnInit, OnDestroy {
  isIframe = false;
  loginDisplay = false;
  private readonly _destroying$ = new Subject<void>();
  loadingService = inject(LoadingService);
  isLoading = this.loadingService.isLoading;
  loadingMessage = this.loadingService.loadingMessage;

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
  ) {}

  ngOnInit(): void {
    this.isIframe = window !== window.parent && !window.opener;

    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS),
        takeUntil(this._destroying$),
      )
      .subscribe((result: EventMessage) => {
        const account = result.payload as AccountInfo;
        this.authService.instance.setActiveAccount(account);
      });

    this.msalBroadcastService.inProgress$
      .pipe(takeUntil(this._destroying$))
      .subscribe((status: InteractionStatus) => {
        if (status === InteractionStatus.None) {
          this.loadingService.hide();
          this.setLoginDisplay();
        } else {
          // You can also look at specific statuses to customize the message
          let message = 'Vérification de l\'authentification...';
          if (status === InteractionStatus.AcquireToken) message = 'Authentification en cours...';
          else if (status === InteractionStatus.Startup) message = 'Initialisation...';
          else if (status === InteractionStatus.HandleRedirect) message = 'Connexion en cours...';
          else if (status === InteractionStatus.Logout) message = 'Déconnexion en cours...';
          // Make sure not to balance active requests incorrectly for MSAL.
          // For simplicity, directly toggle the loading flag if needed.
          // Or just call show/hide appropriately.
          // Wait, show() increments counter, hide decrements.
          // Better: set the signal directly if we want MSAL to hold it, but we can't easily.
          // Msal events are discrete.
        }
      });

    this.authService.handleRedirectObservable().subscribe();
  }

  setLoginDisplay() {
    this.loginDisplay = this.authService.instance.getAllAccounts().length > 0;
  }

  login() {
    this.authService.loginRedirect();
  }

  logout() {
    this.authService.logoutRedirect();
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}
