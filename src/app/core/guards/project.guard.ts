import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LocalStorageService } from '../services/local-storage.service';

export const projectGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const storage = inject(LocalStorageService);
  const projectId = storage.getItem<string>('projectId');

  if (!projectId) {
    return router.parseUrl('/select-project');
  }

  return true;
};
