import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BacklogRepository } from '../../data/backlog.repository';
import { ClustersRepository } from '../../data/clusters.repository';
import { ProductsRepository } from '../../data/products.repository';
import { BacklogItem, Cluster, Product } from '../models/domain.model';

@Injectable({
  providedIn: 'root',
})
export class BacklogService {
  private http = inject(HttpClient);
  private productsRepo = inject(ProductsRepository);
  private clustersRepo = inject(ClustersRepository);
  private backlogRepo = inject(BacklogRepository); // Items

  private apiUrl = `${environment.api.url}/backlog`;

  loadProjectData(projectId: string) {
    return this.http
      .get<{
        products: Product[];
        clusters: Cluster[];
        items: BacklogItem[];
      }>(`${this.apiUrl}/project/${projectId}`)
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
}
