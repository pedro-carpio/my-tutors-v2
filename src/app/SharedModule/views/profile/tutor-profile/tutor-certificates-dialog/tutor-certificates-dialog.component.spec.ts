import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TutorCertificatesDialogComponent } from './tutor-certificates-dialog.component';
import { TutorService } from '../../../../../services/tutor.service';
import { LanguageService } from '../../../../../services/language.service';

describe('TutorCertificatesDialogComponent', () => {
  let component: TutorCertificatesDialogComponent;
  let fixture: ComponentFixture<TutorCertificatesDialogComponent>;

  const mockDialogRef = {
    close: jasmine.createSpy('close')
  };

  const mockTutorService = {
    updateTutor: jasmine.createSpy('updateTutor').and.returnValue(Promise.resolve())
  };

  const mockLanguageService = {
    getAllLanguages: jasmine.createSpy('getAllLanguages').and.returnValue([])
  };

  const mockDialogData = {
    tutor: {
      user_id: 'test-user',
      full_name: 'Test Tutor',
      certifications: [],
      language_certifications: []
    },
    teachingCertifications: [],
    languageCertifications: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TutorCertificatesDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: TutorService, useValue: mockTutorService },
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TutorCertificatesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty arrays by default', () => {
    expect(component.teachingCertificationsArray.length).toBeGreaterThan(0);
    expect(component.languageCertificationsArray.length).toBeGreaterThan(0);
  });

  it('should add teaching certification', () => {
    const initialLength = component.teachingCertificationsArray.length;
    component.addTeachingCertification();
    expect(component.teachingCertificationsArray.length).toBe(initialLength + 1);
  });

  it('should add language certification', () => {
    const initialLength = component.languageCertificationsArray.length;
    component.addLanguageCertification();
    expect(component.languageCertificationsArray.length).toBe(initialLength + 1);
  });

  it('should remove teaching certification', () => {
    component.addTeachingCertification();
    const initialLength = component.teachingCertificationsArray.length;
    component.removeTeachingCertification(0);
    expect(component.teachingCertificationsArray.length).toBe(initialLength - 1);
  });

  it('should remove language certification', () => {
    component.addLanguageCertification();
    const initialLength = component.languageCertificationsArray.length;
    component.removeLanguageCertification(0);
    expect(component.languageCertificationsArray.length).toBe(initialLength - 1);
  });

  it('should handle image load events', () => {
    component.onImageLoad('teaching', 0);
    expect(component.imageLoadingStates.teaching[0]).toBe(false);
    expect(component.imageErrorStates.teaching[0]).toBe(false);
  });

  it('should handle image error events', () => {
    component.onImageError('language', 0);
    expect(component.imageLoadingStates.language[0]).toBe(false);
    expect(component.imageErrorStates.language[0]).toBe(true);
  });

  it('should close dialog on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });
});
