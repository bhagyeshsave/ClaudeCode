import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { Product } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';
import { environment } from '../../../../environments/environment';

export interface ProductDialogData {
  product: Product | null;
}

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './product-dialog.component.html',
  styleUrl: './product-dialog.component.scss'
})
export class ProductDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  dialogRef = inject(MatDialogRef<ProductDialogComponent, Product | null>);
  data = inject<ProductDialogData>(MAT_DIALOG_DATA);

  saving = signal(false);
  errorMessage = signal<string | null>(null);
  categories = signal<Category[]>([]);
  isEdit = !!this.data.product;
  imagePreviewUrl = signal<string | null>(
    this.data.product?.image ? this.resolveImageUrl(this.data.product.image) : null
  );
  selectedFile: File | null = null;
  readonly apiOrigin = environment.apiOrigin;

  form = this.fb.group({
    name: [this.data.product?.name ?? '', [Validators.required]],
    price: [this.data.product?.price ?? (null as number | null), [Validators.required, Validators.min(0.01)]],
    categoryId: [
      this.data.product?.category?.id ?? (null as number | null),
      [Validators.required]
    ]
  });

  ngOnInit(): void {
    this.categoryService.list({ page: 1, limit: 100 }).subscribe({
      next: (res) => this.categories.set(res.data),
      error: () => this.categories.set([])
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;

    if (file) {
      const reader = new FileReader();
      reader.onload = () => this.imagePreviewUrl.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, price, categoryId } = this.form.getRawValue();
    this.saving.set(true);
    this.errorMessage.set(null);

    const payload = {
      name: name!,
      price: price!,
      categoryId: categoryId!,
      image: this.selectedFile
    };

    const request = this.isEdit
      ? this.productService.update(this.data.product!.id, payload)
      : this.productService.create(payload);

    request.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.dialogRef.close(res.data ?? null);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to save product.');
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  private resolveImageUrl(image: string): string {
    if (/^https?:\/\//i.test(image)) {
      return image;
    }
    const path = image.startsWith('/') ? image : `/${image}`;
    return `${this.apiOrigin}${path}`;
  }
}
