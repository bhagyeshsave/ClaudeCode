export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface BulkUploadJobError {
  row: number;
  message: string;
}

export interface BulkUploadJob {
  jobId: string;
  status: JobStatus;
  fileName: string;
  totalRows: number;
  processedRows: number;
  successCount: number;
  failedCount: number;
  errors: BulkUploadJobError[];
  createdAt: string;
  completedAt: string | null;
}

export interface BulkUploadJobStart {
  jobId: string;
  status: JobStatus;
}
