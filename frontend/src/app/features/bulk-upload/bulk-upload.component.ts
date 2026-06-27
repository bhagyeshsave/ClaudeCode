import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription, interval, switchMap, takeWhile } from 'rxjs';

import { BulkUploadService } from '../../core/services/bulk-upload.service';
import { BulkUploadJob } from '../../core/models/bulk-upload-job.model';

@Component({
  selector: 'app-bulk-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatTableModule],
  templateUrl: './bulk-upload.component.html',
  styleUrl: './bulk-upload.component.scss'
})
export class BulkUploadComponent implements OnDestroy {
  selectedFile: File | null = null;
  uploading = signal(false);
  job = signal<BulkUploadJob | null>(null);
  errorColumns = ['row', 'message'];

  private pollSub: Subscription | null = null;

  constructor(
    private bulkUploadService: BulkUploadService,
    private snackBar: MatSnackBar
  ) {}

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  downloadTemplate(): void {
    this.bulkUploadService.downloadTemplate().subscribe({
      next: (blob) => this.triggerDownload(blob, 'product-bulk-upload-template.csv'),
      error: () => this.snackBar.open('Failed to download template.', 'Close', { duration: 4000 })
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  upload(): void {
    if (!this.selectedFile) {
      this.snackBar.open('Please choose a CSV file first.', 'Close', { duration: 3000 });
      return;
    }

    this.uploading.set(true);
    this.job.set(null);
    this.pollSub?.unsubscribe();

    this.bulkUploadService.upload(this.selectedFile).subscribe({
      next: (res) => {
        if (res.data) {
          this.startPolling(res.data.jobId);
        }
      },
      error: (err) => {
        this.uploading.set(false);
        this.snackBar.open(err?.error?.message || 'Failed to start upload.', 'Close', { duration: 4000 });
      }
    });
  }

  private startPolling(jobId: string): void {
    this.pollSub = interval(2000)
      .pipe(
        switchMap(() => this.bulkUploadService.getStatus(jobId)),
        takeWhile((res) => {
          const status = res.data?.status;
          return status !== 'completed' && status !== 'failed';
        }, true)
      )
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.job.set(res.data);
            if (res.data.status === 'completed' || res.data.status === 'failed') {
              this.uploading.set(false);
            }
          }
        },
        error: (err) => {
          this.uploading.set(false);
          this.snackBar.open(err?.error?.message || 'Failed to fetch job status.', 'Close', { duration: 4000 });
        }
      });
  }

  progressPercentage(): number {
    const job = this.job();
    if (!job || !job.totalRows) {
      return 0;
    }
    return Math.min(100, Math.round((job.processedRows / job.totalRows) * 100));
  }

  private triggerDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
