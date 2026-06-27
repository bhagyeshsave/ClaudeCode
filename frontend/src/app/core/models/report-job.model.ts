import { JobStatus } from './bulk-upload-job.model';

export type ReportFormat = 'csv' | 'xlsx';

export interface ReportJob {
  jobId: string;
  status: JobStatus;
  format: ReportFormat;
  fileName: string;
  createdAt: string;
  completedAt: string | null;
}

export interface ReportJobStart {
  jobId: string;
  status: JobStatus;
}

export interface GenerateReportRequest {
  format: ReportFormat;
  categoryId?: number;
}
