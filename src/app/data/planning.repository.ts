import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Planning } from '../core/models/domain.model';

@Injectable({
  providedIn: 'root',
})
export class PlanningRepository {
  private http = inject(HttpClient);
  private apiUrl = `${environment.api.url}/planning`;

  private _plannings = signal<Planning[]>([]);

  get plannings() {
    return this._plannings.asReadonly();
  }

  getByProject(projectId: string): Observable<Planning[]> {
    return this.http
      .get<Planning[]>(`${this.apiUrl}/${projectId}`)
      .pipe(tap((data) => this._plannings.set(data)));
  }

  save(planning: Planning): Observable<Planning> {
    return this.http.post<Planning>(this.apiUrl, planning).pipe(
      tap((saved) => {
        this._plannings.update((current) => {
          const index = current.findIndex(
            (p) =>
              p.projectId === saved.projectId &&
              p.scope === saved.scope &&
              p.profileId === saved.profileId,
          );
          if (index !== -1) {
            const updated = [...current];
            updated[index] = saved;
            return updated;
          }
          return [...current, saved];
        });
      }),
    );
  }
}
