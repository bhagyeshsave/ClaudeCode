import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary" class="nav-toolbar">
      <span class="brand">E-Commerce Admin</span>
      <nav class="nav-links">
        <a mat-button routerLink="/products" routerLinkActive="active-link">Products</a>
        <a mat-button routerLink="/categories" routerLinkActive="active-link">Categories</a>
        <a mat-button routerLink="/products/bulk-upload" routerLinkActive="active-link">Bulk Upload</a>
        <a mat-button routerLink="/reports" routerLinkActive="active-link">Reports</a>
      </nav>
      <span class="spacer"></span>
      @if (authService.currentUser(); as user) {
        <span class="user-email">{{ user.email }}</span>
        <button mat-button (click)="logout()">
          <mat-icon>logout</mat-icon>
          Logout
        </button>
      }
    </mat-toolbar>
  `,
  styles: [
    `
      .nav-toolbar {
        position: sticky;
        top: 0;
        z-index: 100;
        display: flex;
        gap: 8px;
      }
      .brand {
        font-weight: 600;
        margin-right: 24px;
        white-space: nowrap;
      }
      .nav-links {
        display: flex;
        gap: 4px;
      }
      .spacer {
        flex: 1 1 auto;
      }
      .user-email {
        margin-right: 12px;
        opacity: 0.9;
        font-size: 0.9rem;
      }
      .active-link {
        font-weight: 700;
        text-decoration: underline;
      }
    `
  ]
})
export class NavComponent {
  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
