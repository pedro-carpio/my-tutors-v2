import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-language-seeder',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  template: `
    <mat-card class="seeder-card">
      <mat-card-header>
        <mat-card-title>🌐 Language Database Seeder</mat-card-title>
        <mat-card-subtitle>Populate the database with default teaching languages</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="actions">
          <button 
            mat-raised-button 
            color="primary" 
            (click)="insertLanguages()" 
            [disabled]="isLoading">
            <span *ngIf="!isLoading">🌱 Insert Default Languages</span>
            <span *ngIf="isLoading">
              <mat-spinner diameter="20" style="display: inline-block; margin-right: 8px;"></mat-spinner>
              Inserting...
            </span>
          </button>
          
          <button 
            mat-raised-button 
            color="warn" 
            (click)="clearLanguages()" 
            [disabled]="isLoading">
            🗑️ Clear All Languages
          </button>
        </div>
        
        <div class="status" *ngIf="statusMessage">
          <p [ngClass]="statusClass">{{ statusMessage }}</p>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .seeder-card {
      max-width: 600px;
      margin: 20px auto;
    }
    
    .actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    .status {
      margin-top: 16px;
      padding: 12px;
      border-radius: 4px;
    }
    
    .status.success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .status.error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    .status.info {
      background-color: #d1ecf1;
      color: #0c5460;
      border: 1px solid #bee5eb;
    }
  `]
})
export class LanguageSeederComponent {
  private languageService = inject(LanguageService);
  
  isLoading = false;
  statusMessage = '';
  statusClass = '';

  async insertLanguages() {
    this.isLoading = true;
    this.statusMessage = 'Inserting default languages...';
    this.statusClass = 'info';

    try {
      await this.languageService.insertDefaultLanguages();
      this.statusMessage = '✅ Default languages inserted successfully! Check the console for details.';
      this.statusClass = 'success';
    } catch (error) {
      console.error('Error inserting languages:', error);
      this.statusMessage = '❌ Error inserting languages. Check the console for details.';
      this.statusClass = 'error';
    } finally {
      this.isLoading = false;
    }
  }

  async clearLanguages() {
    if (!confirm('⚠️ Are you sure you want to delete ALL languages? This action cannot be undone.')) {
      return;
    }

    this.isLoading = true;
    this.statusMessage = 'Clearing all languages...';
    this.statusClass = 'info';

    try {
      await this.languageService.clearAllLanguages();
      this.statusMessage = '🗑️ All languages cleared successfully!';
      this.statusClass = 'success';
    } catch (error) {
      console.error('Error clearing languages:', error);
      this.statusMessage = '❌ Error clearing languages. Check the console for details.';
      this.statusClass = 'error';
    } finally {
      this.isLoading = false;
    }
  }
}
