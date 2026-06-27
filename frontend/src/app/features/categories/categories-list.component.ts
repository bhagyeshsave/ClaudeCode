import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { CategoryService } from '../../core/services/category.service';
import { Category } from '../../core/models/category.model';
import { CategoryDialogComponent, CategoryDialogData } from './category-dialog/category-dialog.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './categories-list.component.html',
  styleUrl: './categories-list.component.scss'
})
export class CategoriesListComponent implements OnInit {
  displayedColumns = ['name', 'uniqueId', 'createdAt', 'actions'];
  categories = signal<Category[]>([]);
  loading = signal(false);
  total = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);

  searchControl = new FormControl('');

  constructor(
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.fetchCategories();

    this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.pageIndex.set(0);
      this.fetchCategories();
    });
  }

  fetchCategories(): void {
    this.loading.set(true);
    this.categoryService
      .list({
        page: this.pageIndex() + 1,
        limit: this.pageSize(),
        search: this.searchControl.value || undefined
      })
      .subscribe({
        next: (res) => {
          this.categories.set(res.data);
          this.total.set(res.pagination.total);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.snackBar.open(err?.error?.message || 'Failed to load categories.', 'Close', { duration: 4000 });
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.fetchCategories();
  }

  openCreateDialog(): void {
    const data: CategoryDialogData = { category: null };
    const ref = this.dialog.open(CategoryDialogComponent, { data, width: '420px' });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Category created successfully.', 'Close', { duration: 3000 });
        this.fetchCategories();
      }
    });
  }

  openEditDialog(category: Category): void {
    const data: CategoryDialogData = { category };
    const ref = this.dialog.open(CategoryDialogComponent, { data, width: '420px' });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Category updated successfully.', 'Close', { duration: 3000 });
        this.fetchCategories();
      }
    });
  }

  confirmDelete(category: Category): void {
    const data: ConfirmDialogData = {
      title: 'Delete Category',
      message: `Are you sure you want to delete "${category.name}"?`
    };
    const ref = this.dialog.open(ConfirmDialogComponent, { data, width: '380px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteCategory(category);
      }
    });
  }

  private deleteCategory(category: Category): void {
    this.categoryService.delete(category.id).subscribe({
      next: () => {
        this.snackBar.open('Category deleted successfully.', 'Close', { duration: 3000 });
        this.fetchCategories();
      },
      error: (err) => {
        if (err?.status === 409) {
          this.snackBar.open(
            err?.error?.message || 'Category has associated products and cannot be deleted.',
            'Close',
            { duration: 5000 }
          );
        } else {
          this.snackBar.open(err?.error?.message || 'Failed to delete category.', 'Close', { duration: 4000 });
        }
      }
    });
  }
}
