import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

export function loadingInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const loadingService = inject(LoadingService);
  
  // Optionally, you can skip loading for specific requests like background polling here
  // if (req.url.includes('/status')) return next(req);

  loadingService.show();

  return next(req).pipe(
    finalize(() => loadingService.hide())
  );
}
