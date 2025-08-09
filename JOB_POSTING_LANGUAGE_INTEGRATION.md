# Integración de Idiomas en Job Posting Form

## Cambios Implementados

### 1. **Idiomas Objetivo (Target Languages)**
- **Fuente**: Campo `languages_offered` del documento `Institution` 
- **Funcionalidad**: Los idiomas disponibles para el campo "idioma objetivo" se cargan desde los idiomas que la institución tiene configurados en su perfil académico
- **Fallback**: Si la institución no tiene idiomas configurados, se muestran todos los idiomas disponibles desde el LanguageService

### 2. **Idiomas Requeridos (Required Languages)**  
- **Fuente**: `LanguageService` (todos los idiomas disponibles en el sistema)
- **Funcionalidad**: Los tutores pueden requerir conocimiento de cualquier idioma disponible en el sistema, independientemente de los idiomas que ofrezca la institución

### 3. **Nuevos Métodos Implementados**

#### En el Componente TypeScript:
```typescript
// Propiedad para almacenar idiomas ofrecidos por la institución
institutionOfferedLanguages: string[] = [];

// Método para obtener idiomas objetivo disponibles
getAvailableTargetLanguages(): Language[] {
  if (this.institutionOfferedLanguages.length === 0) {
    return this.availableLanguages; // Fallback a todos los idiomas
  }
  return this.availableLanguages.filter(language => 
    this.institutionOfferedLanguages.includes(language.code) ||
    // ... otros criterios de filtrado
  );
}

// Método para obtener idiomas requeridos disponibles  
getAvailableRequiredLanguages(): Language[] {
  return this.availableLanguages; // Todos los idiomas del sistema
}
```

#### Carga de Datos:
```typescript
private loadInstitutionData(): void {
  // ... código existente ...
  
  // Cargar idiomas que ofrece la institución
  this.institutionOfferedLanguages = institution.languages_offered || [];
}
```

### 4. **Template HTML Actualizado**

```html
<!-- Idioma Objetivo -->
<mat-select formControlName="target_language">
  <mat-option 
    *ngFor="let language of getAvailableTargetLanguages()" 
    [value]="language.code">
    {{ getLanguageName(language) }}
  </mat-option>
</mat-select>

<!-- Idiomas Requeridos -->
<mat-select formControlName="required_languages" multiple>
  <mat-option 
    *ngFor="let language of getAvailableRequiredLanguages()" 
    [value]="language.code">
    {{ getLanguageName(language) }}
  </mat-option>
</mat-select>
```

### 5. **Indicadores de Carga**
- Se agregaron hints visuales que muestran el estado de carga:
  - `isLoadingInstitutionData` para idiomas objetivo
  - `isLoadingLanguages` para idiomas requeridos

## Flujo de Funcionamiento

1. **Inicialización**: El componente carga simultáneamente:
   - Idiomas disponibles desde `LanguageService`
   - Datos de configuración académica desde `InstitutionService`

2. **Idiomas Objetivo**: 
   - Si la institución tiene `languages_offered` configurados → Solo esos idiomas
   - Si no tiene configuración → Todos los idiomas disponibles

3. **Idiomas Requeridos**: 
   - Siempre todos los idiomas disponibles desde `LanguageService`

4. **Validación Automática**: 
   - El idioma objetivo se agrega automáticamente a idiomas requeridos
   - Se mantiene la limpieza de duplicados basada en códigos ISO

## Beneficios

✅ **Configuración Personalizada**: Las instituciones pueden limitar los idiomas objetivo según su oferta académica  
✅ **Flexibilidad en Requisitos**: Los tutores pueden requerirse en cualquier idioma del sistema  
✅ **Consistencia de Datos**: Uso de códigos ISO estándar para idiomas  
✅ **Localización**: Nombres de idiomas se muestran según el idioma de la interfaz  
✅ **Fallback Inteligente**: Funciona incluso si la institución no ha configurado idiomas

## Archivos Modificados

- `job-posting-form.component.ts`: Lógica de carga y filtrado de idiomas
- `job-posting-form.component.html`: Template actualizado con nuevos métodos
- Dependencias: Utiliza `InstitutionService` y `LanguageService` existentes

## Testing

La aplicación compila correctamente y los cambios son compatibles con la estructura existente. Los formularios siguen funcionando con las mismas validaciones pero ahora con datos dinámicos desde la configuración institucional.
