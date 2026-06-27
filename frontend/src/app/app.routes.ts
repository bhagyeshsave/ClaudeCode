import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/products/products-list.component').then((m) => m.ProductsListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'products/bulk-upload',
    loadComponent: () =>
      import('./features/bulk-upload/bulk-upload.component').then((m) => m.BulkUploadComponent),
    canActivate: [authGuard]
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./features/categories/categories-list.component').then((m) => m.CategoriesListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reports',
    loadComponent: () => import('./features/reports/reports.component').then((m) => m.ReportsComponent),
    canActivate: [authGuard]
  },
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  { path: '**', redirectTo: 'products' }
];
