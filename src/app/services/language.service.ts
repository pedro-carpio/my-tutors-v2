import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  doc,
  docData,
  Firestore,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  collectionData,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Language } from '../types/firestore.types';
import { I18nService } from './i18n.service';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private firestore: Firestore = inject(Firestore);
  private i18nService: I18nService = inject(I18nService);
  private collectionName = 'languages';

  // Create a new language
  async createLanguage(languageData: Omit<Language, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.firestore, this.collectionName), languageData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating language:', error);
      throw error;
    }
  }

  // Get language by ID
  getLanguage(languageId: string): Observable<Language | undefined> {
    const docRef = doc(this.firestore, this.collectionName, languageId);
    return docData(docRef, { idField: 'id' }) as Observable<Language | undefined>;
  }

  // Get language by code (ISO 639‑1)
  getLanguageByCode(code: string): Observable<Language[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('code', '==', code.toLowerCase())
    );
    return collectionData(q, { idField: 'id' }) as Observable<Language[]>;
  }

  // Get all languages
  getAllLanguages(): Observable<Language[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('name', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Language[]>;
  }

  // Search languages by name
  searchLanguagesByName(namePrefix: string): Observable<Language[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('name', '>=', namePrefix),
      where('name', '<=', namePrefix + '\uf8ff'),
      orderBy('name', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Language[]>;
  }

  // Update language
  async updateLanguage(languageId: string, languageData: Partial<Language>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, languageId);
      await updateDoc(docRef, languageData);
    } catch (error) {
      console.error('Error updating language:', error);
      throw error;
    }
  }

  // Delete language
  async deleteLanguage(languageId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, languageId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting language:', error);
      throw error;
    }
  }

  // Check if language exists by code
  async languageExistsByCode(code: string): Promise<boolean> {
    try {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('code', '==', code.toLowerCase())
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking language existence:', error);
      return false;
    }
  }

  // Get popular languages (you might want to add a popularity field later)
  getPopularLanguages(): Observable<Language[]> {
    // For now, just return all languages sorted by name
    // In the future, you could add a popularity score field
    return this.getAllLanguages();
  }

  // Get localized name for a language based on current UI language
  getLocalizedLanguageName(language: Language): string {
    const currentLang = this.i18nService.getCurrentLanguage();
    
    if (currentLang === 'es' && language.name_es) {
      return language.name_es;
    }
    
    if (currentLang === 'en' && language.name_en) {
      return language.name_en;
    }
    
    // Fallback to default name (English)
    return language.name;
  }

  // Demo method: Insert default popular languages for teaching
  async insertDefaultLanguages(): Promise<void> {
    try {
      const defaultLanguages: Omit<Language, 'id'>[] = [
        {
          code: 'es',
          name: 'Spanish',
          name_en: 'Spanish',
          name_es: 'Español',
          is_active: true,
        },
        {
          code: 'en',
          name: 'English',
          name_en: 'English',
          name_es: 'Inglés',
          is_active: true,
        },
        {
          code: 'fr',
          name: 'French',
          name_en: 'French',
          name_es: 'Francés',
          is_active: true,
        },
        {
          code: 'de',
          name: 'German',
          name_en: 'German',
          name_es: 'Alemán',
          is_active: true,
        },
        {
          code: 'pt',
          name: 'Portuguese',
          name_en: 'Portuguese',
          name_es: 'Portugués',
          is_active: true,
        },
        {
          code: 'it',
          name: 'Italian',
          name_en: 'Italian',
          name_es: 'Italiano',
          is_active: true,
        },
        {
          code: 'zh',
          name: 'Chinese (Mandarin)',
          name_en: 'Chinese (Mandarin)',
          name_es: 'Chino Mandarín',
          is_active: true,
        },
        {
          code: 'ja',
          name: 'Japanese',
          name_en: 'Japanese',
          name_es: 'Japonés',
          is_active: true,
        },
        {
          code: 'ko',
          name: 'Korean',
          name_en: 'Korean',
          name_es: 'Coreano',
          is_active: true,
        },
        {
          code: 'ru',
          name: 'Russian',
          name_en: 'Russian',
          name_es: 'Ruso',
          is_active: true,
        },
        {
          code: 'ar',
          name: 'Arabic',
          name_en: 'Arabic',
          name_es: 'Árabe',
          is_active: true,
        },
        {
          code: 'nl',
          name: 'Dutch',
          name_en: 'Dutch',
          name_es: 'Holandés',
          is_active: true,
        },
        {
          code: 'sv',
          name: 'Swedish',
          name_en: 'Swedish',
          name_es: 'Sueco',
          is_active: true,
        },
        {
          code: 'no',
          name: 'Norwegian',
          name_en: 'Norwegian',
          name_es: 'Noruego',
          is_active: true,
        },
        {
          code: 'da',
          name: 'Danish',
          name_en: 'Danish',
          name_es: 'Danés',
          is_active: true,
        },
        {
          code: 'fi',
          name: 'Finnish',
          name_en: 'Finnish',
          name_es: 'Finés',
          is_active: true,
        },
        {
          code: 'pl',
          name: 'Polish',
          name_en: 'Polish',
          name_es: 'Polaco',
          is_active: true,
        },
        {
          code: 'tr',
          name: 'Turkish',
          name_en: 'Turkish',
          name_es: 'Turco',
          is_active: true,
        },
        {
          code: 'he',
          name: 'Hebrew',
          name_en: 'Hebrew',
          name_es: 'Hebreo',
          is_active: true,
        },
        {
          code: 'hi',
          name: 'Hindi',
          name_en: 'Hindi',
          name_es: 'Hindi',
          is_active: true,
        }
      ];

      console.log('🌐 Insertando idiomas por defecto...');
      
      for (const language of defaultLanguages) {
        // Verificar si ya existe el idioma por código
        const exists = await this.languageExistsByCode(language.code);
        
        if (!exists) {
          const docId = await this.createLanguage({
            ...language,
            created_at: serverTimestamp()
          });
          console.log(`✅ Idioma "${language.name}" (${language.code}) insertado con ID: ${docId}`);
        } else {
          console.log(`ℹ️ Idioma "${language.name}" (${language.code}) ya existe, omitiendo...`);
        }
      }
      
      console.log('🎉 Proceso de inserción de idiomas completado');
    } catch (error) {
      console.error('❌ Error insertando idiomas por defecto:', error);
      throw error;
    }
  }

  // Clear all languages (USE WITH CAUTION - for development only)
  async clearAllLanguages(): Promise<void> {
    try {
      console.log('🚨 ADVERTENCIA: Eliminando TODOS los idiomas...');
      
      const q = query(collection(this.firestore, this.collectionName));
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      console.log(`🗑️ ${snapshot.size} idiomas eliminados`);
    } catch (error) {
      console.error('❌ Error limpiando idiomas:', error);
      throw error;
    }
  }
}
