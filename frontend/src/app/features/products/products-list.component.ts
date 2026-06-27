import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { Product } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { ProductDialogComponent, ProductDialogData } from './product-dialog/product-dialog.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.scss'
})
export class ProductsListComponent implements OnInit {
  displayedColumns = ['image', 'name', 'uniqueId', 'price', 'category', 'actions'];
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(false);
  total = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);
  sortBy = signal<'price' | 'createdAt'>('createdAt');
  sortOrder = signal<'asc' | 'desc'>('desc');

  searchControl = new FormControl('');
  categoryFilterControl = new FormControl<number | null>(null);

  readonly apiOrigin = environment.apiOrigin;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.fetchProducts();
    this.loadCategories();

    this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.pageIndex.set(0);
      this.fetchProducts();
    });

    this.categoryFilterControl.valueChanges.subscribe(() => {
      this.pageIndex.set(0);
      this.fetchProducts();
    });
  }

  loadCategories(): void {
    this.categoryService.list({ page: 1, limit: 100 }).subscribe({
      next: (res) => this.categories.set(res.data),
      error: () => this.categories.set([])
    });
  }

  fetchProducts(): void {
    this.loading.set(true);
    this.productService
      .list({
        page: this.pageIndex() + 1,
        limit: this.pageSize(),
        search: this.searchControl.value || undefined,
        categoryId: this.categoryFilterControl.value ?? undefined,
        sortBy: this.sortBy(),
        sortOrder: this.sortOrder()
      })
      .subscribe({
        next: (res) => {
          this.products.set(res.data);
          this.total.set(res.pagination.total);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.snackBar.open(err?.error?.message || 'Failed to load products.', 'Close', { duration: 4000 });
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.fetchProducts();
  }

  onSortChange(sort: Sort): void {
    if (!sort.direction) {
      this.sortBy.set('createdAt');
      this.sortOrder.set('desc');
    } else {
      this.sortBy.set('price');
      this.sortOrder.set(sort.direction as 'asc' | 'desc');
    }
    this.pageIndex.set(0);
    this.fetchProducts();
  }

  imageUrl(product: Product): string | null {
    if (!product.image) {
      return null;
    }
    if (/^https?:\/\//i.test(product.image)) {
      return product.image;
    }
    const path = product.image.startsWith('/') ? product.image : `/${product.image}`;
    return `${this.apiOrigin}${path}`;
  }

  openCreateDialog(): void {
    const data: ProductDialogData = { product: null };
    const ref = this.dialog.open(ProductDialogComponent, { data, width: '480px' });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Product created successfully.', 'Close', { duration: 3000 });
        this.fetchProducts();
      }
    });
  }

  openEditDialog(product: Product): void {
    const data: ProductDialogData = { product };
    const ref = this.dialog.open(ProductDialogComponent, { data, width: '480px' });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Product updated successfully.', 'Close', { duration: 3000 });
        this.fetchProducts();
      }
    });
  }

  confirmDelete(product: Product): void {
    const data: ConfirmDialogData = {
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product.name}"?`
    };
    const ref = this.dialog.open(ConfirmDialogComponent, { data, width: '380px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteProduct(product);
      }
    });
  }

  private deleteProduct(product: Product): void {
    this.productService.delete(product.id).subscribe({
      next: () => {
        this.snackBar.open('Product deleted successfully.', 'Close', { duration: 3000 });
        this.fetchProducts();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Failed to delete product.', 'Close', { duration: 4000 });
      }
    });
  }
}
