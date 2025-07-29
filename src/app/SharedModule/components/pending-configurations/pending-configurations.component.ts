import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PendingConfigurationsService, PendingConfiguration } from '../../../services/pending-configurations.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-pending-configurations',
  templateUrl: './pending-configurations.component.html',
  styleUrl: './pending-configurations.component.scss',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressBarModule
  ]
})
export class PendingConfigurationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private pendingConfigService = inject(PendingConfigurationsService);
  private i18nService = inject(I18nService);
  private router = inject(Router);

  configurations: PendingConfiguration[] = [];
  completedCount = 0;
  totalCount = 0;
  progressPercentage = 0;

  ngOnInit(): void {
    this.loadConfigurations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadConfigurations(): void {
    this.pendingConfigService.getPendingConfigurations().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (configs: PendingConfiguration[]) => {
        this.configurations = configs;
        this.totalCount = configs.length;
        this.completedCount = configs.filter(c => c.completed).length;
        this.progressPercentage = this.totalCount > 0 ? (this.completedCount / this.totalCount) * 100 : 0;
      },
      error: (error) => {
        console.error('Error loading configurations:', error);
      }
    });
  }

  onConfigurationClick(config: PendingConfiguration): void {
    if (config.action.startsWith('/')) {
      this.router.navigate([config.action]);
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'warn';
      case 'medium': return 'accent';
      case 'low': return 'primary';
      default: return 'primary';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'high': return 'priority_high';
      case 'medium': return 'remove';
      case 'low': return 'expand_more';
      default: return 'remove';
    }
  }

  translate(key: string): string {
    return this.i18nService.translate(key);
  }

  get pendingConfigurations(): PendingConfiguration[] {
    return this.configurations.filter(c => !c.completed);
  }

  get completedConfigurations(): PendingConfiguration[] {
    return this.configurations.filter(c => c.completed);
  }
}
