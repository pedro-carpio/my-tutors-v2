import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from '../../../services/loading.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-global-loading',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div *ngIf="loadingService.isLoading()" class="global-loading-overlay">
      <div class="loading-backdrop"></div>
      <div class="loading-content">
        <mat-spinner diameter="60" strokeWidth="4"></mat-spinner>
        <p class="loading-text">{{ i18nService.translate('common.loading') }}</p>
      </div>
    </div>
  `,
  styles: [`
    .global-loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loading-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
    }

    .loading-content {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      min-width: 200px;
    }

    .loading-text {
      margin-top: 20px;
      font-size: 16px;
      color: #666;
      text-align: center;
      font-weight: 500;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .loading-content {
        background: #2d2d2d;
        color: #fff;
      }
      
      .loading-text {
        color: #ccc;
      }
    }

    /* Animation */
    .global-loading-overlay {
      animation: fadeIn 0.2s ease-in-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    /* Mobile responsive */
    @media (max-width: 480px) {
      .loading-content {
        padding: 30px;
        min-width: 160px;
      }
      
      .loading-text {
        font-size: 14px;
      }
    }
  `]
})
export class GlobalLoadingComponent {
  public loadingService = inject(LoadingService);
  public i18nService = inject(I18nService);
}
