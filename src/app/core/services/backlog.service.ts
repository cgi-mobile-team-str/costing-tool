import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BacklogRepository } from '../../data/backlog.repository';
import { ClustersRepository } from '../../data/clusters.repository';
import { ProductsRepository } from '../../data/products.repository';
import {
  BacklogComment,
  BacklogItem,
  BacklogVersion,
  Cluster,
  Product,
} from '../models/domain.model';

@Injectable({
  providedIn: 'root',
})
export class BacklogService {
  private http = inject(HttpClient);
  private productsRepo = inject(ProductsRepository);
  private clustersRepo = inject(ClustersRepository);
  private backlogRepo = inject(BacklogRepository); // Items

  private apiUrl = `${environment.api.url}/backlog`;

  private versionsUrl = `${environment.api.url}/backlog-versions`;

  loadProjectData(projectId: string, versionId?: string) {
    return this.http
      .get<{
        products: Product[];
        clusters: Cluster[];
        items: BacklogItem[];
      }>(`${this.apiUrl}/project/${projectId}`, versionId ? { params: { versionId } } : {})
      .pipe(
        tap((data) => {
          this.productsRepo.setItems(data.products);
          this.clustersRepo.setItems(data.clusters);
          this.backlogRepo.setItems(data.items);
        }),
      );
  }

  getItemHistory(itemId: string) {
    return this.http.get<any[]>(`${this.apiUrl}/items/${itemId}/history`);
  }

  getVersions(projectId: string) {
    return this.http.get<BacklogVersion[]>(`${this.versionsUrl}/project/${projectId}`);
  }

  createVersion(projectId: string, name: string, description?: string) {
    return this.http.post<BacklogVersion>(`${this.versionsUrl}/project/${projectId}/snapshot`, {
      name,
      description,
    });
  }

  getItemComments(itemId: string) {
    return this.http.get<BacklogComment[]>(`${this.apiUrl}/items/${itemId}/comments`);
  }

  addItemComment(itemId: string, content: string) {
    return this.http.post<BacklogComment>(`${this.apiUrl}/items/${itemId}/comments`, {
      content,
    });
  }

  deleteItemComment(itemId: string, commentId: string) {
    return this.http.delete<BacklogComment>(`${this.apiUrl}/items/${itemId}/comments/${commentId}`);
  }
}
