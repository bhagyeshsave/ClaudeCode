import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { Product, ProductQueryParams } from '../models/product.model';

export interface ProductPayload {
  name: string;
  price: number;
  categoryId: number;
  image?: File | null;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  list(params: ProductQueryParams = {}): Observable<PaginatedResponse<Product>> {
    let httpParams = new HttpParams();
    if (params.page != null) httpParams = httpParams.set('page', params.page);
    if (params.limit != null) httpParams = httpParams.set('limit', params.limit);
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.categoryId != null) httpParams = httpParams.set('categoryId', params.categoryId);
    return this.http.get<PaginatedResponse<Product>>(this.apiUrl, { params: httpParams });
  }

  get(id: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${id}`);
  }

  create(payload: ProductPayload): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(this.apiUrl, this.toFormData(payload));
  }

  update(id: number, payload: ProductPayload): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.apiUrl}/${id}`, this.toFormData(payload));
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  private toFormData(payload: ProductPayload): FormData {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('price', String(payload.price));
    formData.append('categoryId', String(payload.categoryId));
    if (payload.image) {
      formData.append('image', payload.image);
    }
    return formData;
  }
}
