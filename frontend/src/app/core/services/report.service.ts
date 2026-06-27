import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { GenerateReportRequest, ReportJob, ReportJobStart } from '../models/report-job.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  generate(request: GenerateReportRequest): Observable<ApiResponse<ReportJobStart>> {
    return this.http.post<ApiResponse<ReportJobStart>>(`${this.apiUrl}/generate`, request);
  }

  getStatus(jobId: string): Observable<ApiResponse<ReportJob>> {
    return this.http.get<ApiResponse<ReportJob>>(`${this.apiUrl}/${jobId}`);
  }

  download(jobId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${jobId}/download`, { responseType: 'blob' });
  }
}
