import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private activeRequests = 0;
  
  // Expose signal for UI
  readonly isLoading = signal(false);
  
  // Custom message for MSAL vs HTTP wake up (optional)
  readonly loadingMessage = signal<string | null>(null);

  show(message?: string) {
    this.activeRequests++;
    this.isLoading.set(true);
    if (message) {
      this.loadingMessage.set(message);
    }
  }

  hide() {
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }
    
    if (this.activeRequests === 0) {
      this.isLoading.set(false);
      this.loadingMessage.set(null);
    }
  }
}
