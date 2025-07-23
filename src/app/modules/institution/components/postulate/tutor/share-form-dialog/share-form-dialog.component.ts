import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-share-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Continuar Formulario</h2>
    
    <mat-dialog-content>
      <p>Tu postulación ha sido guardada. Puedes continuar llenando el formulario en cualquier momento usando el siguiente enlace:</p>
      
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Enlace para continuar</mat-label>
        <input matInput [value]="shareUrl" readonly>
        <mat-hint class="text-warn">
          Este vinculo posee tus datos personales
        </mat-hint>
        <button matSuffix mat-icon-button (click)="copyToClipboard()" [attr.aria-label]="'Copiar enlace'">
          <mat-icon>content_copy</mat-icon>
        </button>
      </mat-form-field>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" (click)="copyAndClose()">
        Copiar Enlace
      </button>
      <button mat-button (click)="close()">
        Cerrar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
  `]
})
export class ShareFormDialogComponent {
  private dialogRef = inject(MatDialogRef<ShareFormDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private clipboard = inject(Clipboard);

  shareUrl: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { postulantId: string }) {
    // Construir la URL completa
    const baseUrl = window.location.origin;
    this.shareUrl = `${baseUrl}/postular?uid=${this.data.postulantId}`;
  }

  copyToClipboard(): void {
    const successful = this.clipboard.copy(this.shareUrl);
    if (successful) {
      this.snackBar.open('Enlace copiado al portapapeles', 'Cerrar', {
        duration: 3000
      });
    } else {
      this.snackBar.open('Error al copiar el enlace', 'Cerrar', {
        duration: 3000
      });
    }
  }

  copyAndClose(): void {
    this.copyToClipboard();
    this.dialogRef.close();
    }
    
    close(): void {
        this.dialogRef.close();
    }
}
