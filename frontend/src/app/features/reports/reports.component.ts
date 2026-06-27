import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription, interval, switchMap, takeWhile } from 'rxjs';

import { ReportService } from '../../core/services/report.service';
import { CategoryService } from '../../core/services/category.service';
import { ReportJob } from '../../core/models/report-job.model';
import { Category } from '../../core/models/category.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private reportService = inject(ReportService);
  private categoryService = inject(CategoryService);
  private snackBar = inject(MatSnackBar);

  categories = signal<Category[]>([]);
  generating = signal(false);
  downloading = signal(false);
  job = signal<ReportJob | null>(null);

  form = this.fb.group({
    format: ['csv' as 'csv' | 'xlsx', [Validators.required]],
    categoryId: [null as number | null]
  });

  private pollSub: Subscription | null = null;

  ngOnInit(): void {
    this.categoryService.list({ page: 1, limit: 100 }).subscribe({
      next: (res) => this.categories.set(res.data),
      error: () => this.categories.set([])
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  generate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { format, categoryId } = this.form.getRawValue();
    this.generating.set(true);
    this.job.set(null);
    this.pollSub?.unsubscribe();

    this.reportService
      .generate({ format: format!, categoryId: categoryId ?? undefined })
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.startPolling(res.data.jobId);
          }
        },
        error: (err) => {
          this.generating.set(false);
          this.snackBar.open(err?.error?.message || 'Failed to start report generation.', 'Close', {
            duration: 4000
          });
        }
      });
  }

  download(): void {
    const job = this.job();
    if (!job) {
      return;
    }

    this.downloading.set(true);
    this.reportService.download(job.jobId).subscribe({
      next: (blob) => {
        this.downloading.set(false);
        this.triggerDownload(blob, job.fileName || `report.${job.format}`);
      },
      error: (err) => {
        this.downloading.set(false);
        this.snackBar.open(err?.error?.message || 'Failed to download report.', 'Close', { duration: 4000 });
      }
    });
  }

  private startPolling(jobId: string): void {
    this.pollSub = interval(2000)
      .pipe(
        switchMap(() => this.reportService.getStatus(jobId)),
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
              this.generating.set(false);
            }
          }
        },
        error: (err) => {
          this.generating.set(false);
          this.snackBar.open(err?.error?.message || 'Failed to fetch job status.', 'Close', { duration: 4000 });
        }
      });
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
