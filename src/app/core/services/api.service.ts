import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);

  getTestData(): Observable<string> {
    return this.http.get(environment.api.url + '/db-test', { responseType: 'text' });
  }
}
