import { inject, Injectable } from '@angular/core';
import { Observable, combineLatest, of, from, firstValueFrom } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  doc,
  docData,
  getDoc,
  Firestore,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  collectionData,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from '@angular/fire/firestore';
import { JobPosting, JobPostingStatus, ClassType, ClassModality, Tutor, UserLanguage, Availability, ExperienceLevel } from '../types/firestore.types';
import { TutorService } from './tutor.service';
import { UserLanguageService } from './tutor-language.service';
import { LanguageService } from './language.service';

@Injectable({
  providedIn: 'root',
})
export class JobPostingService {
  private firestore: Firestore = inject(Firestore);
  private tutorService = inject(TutorService);
  private userLanguageService = inject(UserLanguageService);
  private languageService = inject(LanguageService);
  private collectionName = 'job_postings';

  // Método para verificar si un idioma (código o nombre) coincide con otro usando el LanguageService
  private async languagesMatch(language1: string, language2: string): Promise<boolean> {
    try {
      // Normalizar ambos idiomas a lowercase
      const lang1 = language1.toLowerCase().trim();
      const lang2 = language2.toLowerCase().trim();
      
      // Si son exactamente iguales, ya coinciden
      if (lang1 === lang2) {
        return true;
      }

      // Buscar el primer idioma en el service
      const languages1 = await firstValueFrom(this.languageService.getLanguageByCode(lang1));
      const languages2 = await firstValueFrom(this.languageService.getLanguageByCode(lang2));
      
      // Si encontramos por código, verificar coincidencias
      if (languages1 && languages1.length > 0) {
        const foundLang1 = languages1[0];
        
        // Verificar si lang2 coincide con el código, nombre o nombres localizados de lang1
        return lang2 === foundLang1.code ||
               lang2 === foundLang1.name.toLowerCase() ||
               (foundLang1.name_es ? lang2 === foundLang1.name_es.toLowerCase() : false) ||
               (foundLang1.name_en ? lang2 === foundLang1.name_en.toLowerCase() : false);
      }

      if (languages2 && languages2.length > 0) {
        const foundLang2 = languages2[0];
        
        // Verificar si lang1 coincide con el código, nombre o nombres localizados de lang2
        return lang1 === foundLang2.code ||
               lang1 === foundLang2.name.toLowerCase() ||
               (foundLang2.name_es ? lang1 === foundLang2.name_es.toLowerCase() : false) ||
               (foundLang2.name_en ? lang1 === foundLang2.name_en.toLowerCase() : false);
      }

      // Si no se encuentra por código, buscar por nombre usando búsqueda de texto
      const searchResults1 = await firstValueFrom(this.languageService.searchLanguagesByName(language1));
      const searchResults2 = await firstValueFrom(this.languageService.searchLanguagesByName(language2));
      
      // Verificar si hay coincidencias entre los resultados de búsqueda
      if (searchResults1 && searchResults2) {
        return searchResults1.some(lang1Result =>
          searchResults2.some(lang2Result => lang1Result.code === lang2Result.code)
        );
      }

      return false;
    } catch (error) {
      console.error('Error comparing languages:', error);
      // En caso de error, hacer comparación simple
      return language1.toLowerCase().trim() === language2.toLowerCase().trim();
    }
  }

  // Método para verificar si un tutor tiene un idioma específico
  private async tutorHasLanguage(tutorLanguageCodes: string[], requiredLanguage: string): Promise<boolean> {
    try {
      // Verificar cada idioma del tutor contra el requerido
      for (const tutorLangCode of tutorLanguageCodes) {
        const matches = await this.languagesMatch(tutorLangCode, requiredLanguage);
        if (matches) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking if tutor has language:', error);
      return false;
    }
  }

  // Método para obtener información detallada de un idioma
  private async getLanguageInfo(languageIdentifier: string): Promise<{
    code: string;
    name: string;
    name_es?: string;
    name_en?: string;
    found: boolean;
    searchMethod: string;
  }> {
    try {
      // Primero intentar buscar por código
      const byCode = await firstValueFrom(this.languageService.getLanguageByCode(languageIdentifier));
      if (byCode && byCode.length > 0) {
        return {
          code: byCode[0].code,
          name: byCode[0].name,
          name_es: byCode[0].name_es,
          name_en: byCode[0].name_en,
          found: true,
          searchMethod: 'by_code'
        };
      }

      // Si no se encuentra por código, buscar por nombre
      const byName = await firstValueFrom(this.languageService.searchLanguagesByName(languageIdentifier));
      if (byName && byName.length > 0) {
        return {
          code: byName[0].code,
          name: byName[0].name,
          name_es: byName[0].name_es,
          name_en: byName[0].name_en,
          found: true,
          searchMethod: 'by_name'
        };
      }

      return {
        code: languageIdentifier,
        name: languageIdentifier,
        found: false,
        searchMethod: 'not_found'
      };
    } catch (error) {
      console.error('Error getting language info:', error);
      return {
        code: languageIdentifier,
        name: languageIdentifier,
        found: false,
        searchMethod: 'error'
      };
    }
  }

  // Create a new job posting
  async createJobPosting(jobPostingData: Omit<JobPosting, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.firestore, this.collectionName), {
        ...jobPostingData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating job posting:', error);
      throw error;
    }
  }

  // Get job posting by ID
  getJobPosting(jobPostingId: string): Observable<JobPosting | undefined> {
    const docRef = doc(this.firestore, this.collectionName, jobPostingId);
    return docData(docRef, { idField: 'id' }) as Observable<JobPosting | undefined>;
  }

  // Get all job postings
  getAllJobPostings(): Observable<JobPosting[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobPosting[]>;
  }

  // Get job postings by institution
  getJobPostingsByInstitution(institutionId: string): Observable<JobPosting[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobPosting[]>;
  }

  // Get job postings by status
  getJobPostingsByStatus(status: JobPostingStatus): Observable<JobPosting[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('status', '==', status),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobPosting[]>;
  }

  // Get available job postings for tutors (published and not assigned)
  getAvailableJobPostings(): Observable<JobPosting[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('status', '==', 'published'),
      orderBy('class_date', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobPosting[]>;
  }

  // Get job postings that match a specific tutor's profile and characteristics
  getPersonalizedJobPostingsForTutor(tutorId: string): Observable<JobPosting[]> {
    console.log('🎯 Starting personalized job posting search for tutor:', tutorId);
    
    return this.tutorService.getTutor(tutorId).pipe(
      switchMap((tutor) => {
        if (!tutor) {
          console.log('❌ Tutor not found:', tutorId);
          return of([]);
        }

        console.log('👤 Tutor found:', {
          tutorId: tutor.user_id,
          name: tutor.full_name,
          experienceLevel: tutor.experience_level,
          hourlyRate: tutor.hourly_rate,
          country: tutor.country
        });

        // Obtener los idiomas que enseña el tutor
        return this.userLanguageService.getTeachingLanguagesByTutor(tutorId).pipe(
          switchMap((tutorLanguages) => {
            console.log('🗣️ Tutor teaching languages:', {
              count: tutorLanguages.length,
              languages: tutorLanguages.map(lang => ({
                id: lang.language_id,
                level: lang.level_cefr,
                isNative: lang.is_native
              }))
            });

            // Obtener todas las job postings disponibles
            return this.getAvailableJobPostings().pipe(
              switchMap((jobPostings) => {
                console.log('📋 Available job postings to analyze:', {
                  totalCount: jobPostings.length,
                  postings: jobPostings.map(jp => ({
                    id: jp.id,
                    title: jp.title,
                    targetLanguage: jp.target_language,
                    requiredLanguages: jp.required_languages,
                    experienceLevel: jp.required_experience_level,
                    maxRate: jp.max_hourly_rate
                  }))
                });

                // Filtrar las job postings basándose en las características del tutor (ahora asíncrono)
                const filterPromise = async () => {
                  const compatibleJobPostings = [];
                  for (const jobPosting of jobPostings) {
                    const isCompatible = await this.isJobPostingCompatibleWithTutor(jobPosting, tutor, tutorLanguages);
                    if (isCompatible) {
                      compatibleJobPostings.push(jobPosting);
                    }
                  }

                  console.log('📊 Filtering results summary:', {
                    tutorId,
                    totalAvailable: jobPostings.length,
                    compatible: compatibleJobPostings.length,
                    filtered: jobPostings.length - compatibleJobPostings.length,
                    compatibleIds: compatibleJobPostings.map(jp => jp.id)
                  });

                  return compatibleJobPostings;
                };

                return from(filterPromise());
              })
            );
          })
        );
      })
    );
  }

  // Método privado para verificar compatibilidad entre job posting y tutor
  private async isJobPostingCompatibleWithTutor(
    jobPosting: JobPosting, 
    tutor: Tutor, 
    tutorLanguages: UserLanguage[]
  ): Promise<boolean> {
    console.log('🔍 Analyzing job posting compatibility:', {
      jobPostingId: jobPosting.id,
      jobPostingTitle: jobPosting.title,
      tutorId: tutor.user_id,
      tutorName: tutor.full_name
    });

    const tutorLanguageCodes = tutorLanguages.map(lang => lang.language_id);

    // 0. Verificar compatibilidad de ubicación (país y estado)
    if (jobPosting.location_country) {
      console.log('🌍 Location compatibility check:', {
        jobCountry: jobPosting.location_country,
        jobState: jobPosting.location_state,
        tutorCountry: tutor.country,
        tutorState: tutor.state
      });

      // Verificar que el país coincida
      if (jobPosting.location_country !== tutor.country) {
        console.log('❌ REJECTED: Country mismatch', {
          jobCountry: jobPosting.location_country,
          tutorCountry: tutor.country
        });
        return false;
      }

      // Si el job posting especifica un estado, verificar que coincida
      if (jobPosting.location_state && jobPosting.location_state !== tutor.state) {
        console.log('❌ REJECTED: State mismatch', {
          jobState: jobPosting.location_state,
          tutorState: tutor.state
        });
        return false;
      }

      console.log('✅ Location compatibility passed');
    }

    // 1. Verificar idioma objetivo usando LanguageService
    if (jobPosting.target_language) {
      console.log('📋 Target language check - Getting language info...');
      
      const targetLanguageInfo = await this.getLanguageInfo(jobPosting.target_language);
      const tutorHasTargetLanguage = await this.tutorHasLanguage(tutorLanguageCodes, jobPosting.target_language);
      
      console.log('📋 Target language check:', {
        required: jobPosting.target_language,
        targetLanguageInfo,
        tutorHas: tutorLanguageCodes,
        passes: tutorHasTargetLanguage
      });
      
      if (!tutorHasTargetLanguage) {
        console.log('❌ REJECTED: Tutor does not speak the target language', {
          targetLanguage: jobPosting.target_language,
          targetLanguageInfo,
          tutorLanguages: tutorLanguageCodes
        });
        return false;
      }
    }

    // 2. Verificar idiomas requeridos adicionales usando LanguageService
    if (jobPosting.required_languages && jobPosting.required_languages.length > 0) {
      console.log('🗣️ Required languages check - Checking each required language...');
      
      const requiredLanguagesInfo = [];
      const missingLanguages = [];
      
      for (const requiredLang of jobPosting.required_languages) {
        const langInfo = await this.getLanguageInfo(requiredLang);
        const tutorHasLang = await this.tutorHasLanguage(tutorLanguageCodes, requiredLang);
        
        requiredLanguagesInfo.push({
          original: requiredLang,
          info: langInfo,
          tutorHas: tutorHasLang
        });
        
        if (!tutorHasLang) {
          missingLanguages.push(requiredLang);
        }
      }
      
      console.log('🗣️ Required languages check:', {
        required: jobPosting.required_languages,
        requiredLanguagesInfo,
        tutorHas: tutorLanguageCodes,
        missingLanguages,
        passes: missingLanguages.length === 0
      });
      
      if (missingLanguages.length > 0) {
        console.log('❌ REJECTED: Tutor missing required languages', {
          missing: missingLanguages,
          required: jobPosting.required_languages,
          tutorHas: tutorLanguageCodes
        });
        return false;
      }
    }

    // 3. Verificar nivel de experiencia
    if (jobPosting.required_experience_level) {
      console.log('🎯 Experience level check:', {
        required: jobPosting.required_experience_level,
        tutorHas: tutor.experience_level,
        requiredType: typeof jobPosting.required_experience_level,
        tutorType: typeof tutor.experience_level
      });

      if (typeof jobPosting.required_experience_level === 'number' && typeof tutor.experience_level === 'number') {
        const passes = tutor.experience_level >= jobPosting.required_experience_level;
        console.log('📊 Numeric experience comparison:', {
          tutorLevel: tutor.experience_level,
          requiredLevel: jobPosting.required_experience_level,
          passes
        });
        
        if (!passes) {
          console.log('❌ REJECTED: Tutor experience level too low', {
            tutorLevel: tutor.experience_level,
            requiredLevel: jobPosting.required_experience_level
          });
          return false;
        }
      } else if (typeof jobPosting.required_experience_level === 'string' && typeof tutor.experience_level === 'string') {
        // Mapeo de niveles string para comparación
        const levelOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
        const tutorLevelNum = levelOrder[tutor.experience_level as keyof typeof levelOrder] || 0;
        const requiredLevelNum = levelOrder[jobPosting.required_experience_level as keyof typeof levelOrder] || 0;
        
        const passes = tutorLevelNum >= requiredLevelNum;
        console.log('📝 String experience comparison:', {
          tutorLevel: tutor.experience_level,
          tutorLevelNum,
          requiredLevel: jobPosting.required_experience_level,
          requiredLevelNum,
          passes
        });
        
        if (!passes) {
          console.log('❌ REJECTED: Tutor experience level insufficient', {
            tutorLevel: tutor.experience_level,
            requiredLevel: jobPosting.required_experience_level
          });
          return false;
        }
      }
    }

    // 4. Verificar tarifa máxima
    if (jobPosting.max_hourly_rate && tutor.hourly_rate) {
      const passes = tutor.hourly_rate <= jobPosting.max_hourly_rate;
      console.log('💰 Hourly rate check:', {
        tutorRate: tutor.hourly_rate,
        maxRate: jobPosting.max_hourly_rate,
        passes
      });
      
      if (!passes) {
        console.log('❌ REJECTED: Tutor hourly rate exceeds maximum', {
          tutorRate: tutor.hourly_rate,
          maxRate: jobPosting.max_hourly_rate
        });
        return false;
      }
    }

    // Si pasa todos los filtros, es compatible
    console.log('✅ ACCEPTED: Job posting is compatible with tutor', {
      jobPostingId: jobPosting.id,
      tutorId: tutor.user_id
    });
    return true;
  }

  // Get job postings assigned to a specific tutor
  getJobPostingsByTutor(tutorId: string): Observable<JobPosting[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('assigned_tutor_id', '==', tutorId),
      orderBy('class_date', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobPosting[]>;
  }

  // Get job postings by institution and status
  getJobPostingsByInstitutionAndStatus(institutionId: string, status: JobPostingStatus): Observable<JobPosting[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      where('status', '==', status),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobPosting[]>;
  }

  // Get job postings by modality
  getJobPostingsByModality(modality: ClassModality): Observable<JobPosting[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('modality', '==', modality),
      where('status', '==', 'published'),
      orderBy('class_date', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobPosting[]>;
  }

  // Get job postings by class type
  getJobPostingsByClassType(classType: ClassType): Observable<JobPosting[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('class_type', '==', classType),
      where('status', '==', 'published'),
      orderBy('class_date', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobPosting[]>;
  }

  // Get upcoming job postings (class_date >= today)
  getUpcomingJobPostings(): Observable<JobPosting[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const q = query(
      collection(this.firestore, this.collectionName),
      where('class_date', '>=', today),
      where('status', 'in', ['published', 'assigned']),
      orderBy('class_date', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobPosting[]>;
  }

  // Update job posting
  async updateJobPosting(jobPostingId: string, jobPostingData: Partial<JobPosting>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, jobPostingId);
      await updateDoc(docRef, {
        ...jobPostingData,
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating job posting:', error);
      throw error;
    }
  }

  // Assign tutor to job posting
  async assignTutorToJobPosting(jobPostingId: string, tutorId: string, hourlyRate?: number): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, jobPostingId);
      const updateData: Partial<JobPosting> = {
        assigned_tutor_id: tutorId,
        assigned_at: new Date(),
        status: 'assigned',
        updated_at: serverTimestamp(),
      };
      
      if (hourlyRate) {
        updateData.hourly_rate = hourlyRate;
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error assigning tutor to job posting:', error);
      throw error;
    }
  }

  // Unassign tutor from job posting
  async unassignTutorFromJobPosting(jobPostingId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, jobPostingId);
      await updateDoc(docRef, {
        assigned_tutor_id: null,
        assigned_at: null,
        status: 'published',
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error unassigning tutor from job posting:', error);
      throw error;
    }
  }

  // Update job posting status
  async updateJobPostingStatus(jobPostingId: string, status: JobPostingStatus): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, jobPostingId);
      await updateDoc(docRef, {
        status,
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating job posting status:', error);
      throw error;
    }
  }

  // Delete job posting
  async deleteJobPosting(jobPostingId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, jobPostingId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting job posting:', error);
      throw error;
    }
  }

  // Calculate total payment based on duration and hourly rate
  calculateTotalPayment(durationMinutes: number, hourlyRate: number): number {
    const hours = durationMinutes / 60;
    return Number((hours * hourlyRate).toFixed(2));
  }

  // Update payment information
  async updatePaymentInfo(jobPostingId: string, hourlyRate: number, currency: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, jobPostingId);
      
      // Get current job posting to calculate total payment
      const jobPostingSnapshot = await getDoc(docRef);
      if (jobPostingSnapshot.exists()) {
        const jobPosting = jobPostingSnapshot.data() as JobPosting;
        const totalPayment = this.calculateTotalPayment(jobPosting.total_duration_minutes, hourlyRate);
        
        await updateDoc(docRef, {
          hourly_rate: hourlyRate,
          currency,
          total_payment: totalPayment,
          updated_at: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error updating payment info:', error);
      throw error;
    }
  }
}
