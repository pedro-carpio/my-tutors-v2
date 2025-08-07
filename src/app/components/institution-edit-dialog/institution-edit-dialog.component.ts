import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Auth } from '@angular/fire/auth';
import { InstitutionService } from '../../services/institution.service';
import { LanguageService } from '../../services/language.service';
import { I18nService } from '../../services/i18n.service';
import { Institution, Language } from '../../types/firestore.types';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-institution-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    TranslatePipe
  ],
  templateUrl: './institution-edit-dialog.component.html',
  styleUrls: ['./institution-edit-dialog.component.scss']
})
export class InstitutionEditDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<InstitutionEditDialogComponent>);
  private institutionService = inject(InstitutionService);
  private languageService = inject(LanguageService);
  private i18n = inject(I18nService);
  private auth = inject(Auth);

  institutionForm!: FormGroup;
  availableLanguages: Language[] = [];
  subscriptionPlans = ['basic', 'premium', 'enterprise'];

  ngOnInit() {
    this.loadAvailableLanguages();
    this.initializeForm();
  }

  private loadAvailableLanguages() {
    this.languageService.getAllLanguages().subscribe((languages: Language[]) => {
      this.availableLanguages = languages;
    });
  }

  private initializeForm() {
    this.institutionForm = this.fb.group({
      name: ['', Validators.required],
      contactPerson: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      phone: [''],
      country: ['', Validators.required],
      website: [''],
      address: [''],
      description: [''],
      logoUrl: [''],
      languagesOffered: this.fb.array([])
    });
  }

  get languagesOfferedArray(): FormArray {
    return this.institutionForm.get('languagesOffered') as FormArray;
  }

  addLanguage() {
    const languageControl = this.fb.control('', Validators.required);
    this.languagesOfferedArray.push(languageControl);
  }

  removeLanguage(index: number) {
    this.languagesOfferedArray.removeAt(index);
  }

  // Helper method to get localized language name
  getLocalizedLanguageName(language: Language): string {
    return this.languageService.getLocalizedLanguageName(language);
  }

  async onSave(): Promise<void> {
    if (this.institutionForm.valid) {
      try {
        // Get current user ID
        const currentUser = this.auth.currentUser;
        if (!currentUser) {
          throw new Error('Usuario no autenticado');
        }

        const formData = this.institutionForm.value;
        
        // Map form data to Institution interface structure
        const institutionData: Partial<Institution> = {
          user_id: currentUser.uid,
          name: formData.name,
          country: formData.country || '',
          phone: formData.phone || '',
          contact_email: formData.contactEmail,
          address: formData.address,
          description: formData.description || '',
          logo_url: formData.logoUrl,
          website_url: formData.website,
          contact_person: formData.contactPerson,
          languages_offered: formData.languagesOffered?.filter((lang: string) => lang.trim() !== '') || [],
        };

        await this.institutionService.updateInstitution(currentUser.uid, institutionData);
        this.dialogRef.close(true);
      } catch (error: unknown) {
        console.error('Error updating institution profile:', error);
      }
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
