import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';

export interface CategoryDialogData {
  category: Category | null;
}

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './category-dialog.component.html',
  styles: [
    `
      .full-width {
        width: 100%;
        min-width: 320px;
      }
      .error-message {
        color: #c62828;
        font-size: 0.9rem;
        margin: 4px 0;
      }
      mat-spinner {
        display: inline-block;
      }
    `
  ]
})
export class CategoryDialogComponent {
  saving = signal(false);
  errorMessage = signal<string | null>(null);
  isEdit: boolean;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]]
  });

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    public dialogRef: MatDialogRef<CategoryDialogComponent, Category | null>,
    @Inject(MAT_DIALOG_DATA) public data: CategoryDialogData
  ) {
    this.isEdit = !!data.category;
    if (data.category) {
      this.form.patchValue({ name: data.category.name });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const name = this.form.getRawValue().name!;
    this.saving.set(true);
    this.errorMessage.set(null);

    const request = this.isEdit
      ? this.categoryService.update(this.data.category!.id, name)
      : this.categoryService.create(name);

    request.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.dialogRef.close(res.data ?? null);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to save category.');
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
