import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { BulkUploadJob, BulkUploadJobStart } from '../models/bulk-upload-job.model';

@Injectable({ providedIn: 'root' })
export class BulkUploadService {
  private readonly apiUrl = `${environment.apiUrl}/products/bulk-upload`;

  constructor(private http: HttpClient) {}

  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/template`, { responseType: 'blob' });
  }

  upload(file: File): Observable<ApiResponse<BulkUploadJobStart>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<BulkUploadJobStart>>(this.apiUrl, formData);
  }

  getStatus(jobId: string): Observable<ApiResponse<BulkUploadJob>> {
    return this.http.get<ApiResponse<BulkUploadJob>>(`${this.apiUrl}/${jobId}`);
  }
}
