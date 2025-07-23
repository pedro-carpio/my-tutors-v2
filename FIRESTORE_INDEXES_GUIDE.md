# Guía de Índices de Firestore - Sistema de Tutores y Estudiantes

## Índices Implementados

### Estudiantes (Students)

#### Índices Básicos por Institución
1. **institution_id + full_name (ASC)**
   - Usado para: Lista básica de estudiantes por institución ordenados alfabéticamente
   - Método: `getStudentsByInstitution()`

2. **institution_id + enrollment_date (ASC/DESC)**
   - Usado para: Ordenar estudiantes por fecha de inscripción
   - Método: `getStudentsByInstitutionSortedByEnrollment()`

3. **institution_id + level_cefr (ASC/DESC)**
   - Usado para: Ordenar estudiantes por nivel CEFR
   - Método: `getStudentsByInstitutionSortedByLevel()`

4. **institution_id + birth_date (ASC/DESC)**
   - Usado para: Ordenar estudiantes por edad
   - Método: `getStudentsByInstitutionSortedByAge()`

#### Índices Compuestos por Institución
5. **institution_id + target_language + full_name (ASC)**
   - Usado para: Filtrar estudiantes por institución e idioma objetivo
   - Método: `getStudentsByInstitutionAndTargetLanguage()`

6. **institution_id + country + full_name (ASC)**
   - Usado para: Filtrar estudiantes por institución y país
   - Método: `getStudentsByInstitutionAndCountry()`

7. **institution_id + level_cefr + full_name (ASC)**
   - Usado para: Filtrar estudiantes por institución y nivel específico
   - Método: `getStudentsByInstitutionAndLevel()`

#### Índices Globales
8. **country + full_name (ASC)**
   - Usado para: Listar estudiantes por país (sin filtro de institución)
   - Método: `getStudentsByCountry()`

9. **target_language + full_name (ASC)**
   - Usado para: Listar estudiantes por idioma objetivo
   - Método: `getStudentsByTargetLanguage()`

10. **level_cefr + full_name (ASC)**
    - Usado para: Listar estudiantes por nivel CEFR
    - Método: `getStudentsByLevel()`

11. **enrollment_date (DESC)**
    - Usado para: Obtener estudiantes más recientes
    - Método: `getNewestStudents()`

### Tutores (Tutors)

#### Índices Básicos por Institución
1. **institution_id + full_name (ASC)**
   - Usado para: Lista básica de tutores por institución ordenados alfabéticamente
   - Método: `getTutorsByInstitution()`

2. **institution_id + hourly_rate (ASC/DESC)**
   - Usado para: Ordenar tutores por tarifa horaria (menor a mayor / mayor a menor)
   - Método: `getTutorsByInstitutionSortedByRate()`

3. **institution_id + experience_level (ASC/DESC)**
   - Usado para: Ordenar tutores por nivel de experiencia
   - Método: `getTutorsByInstitutionSortedByExperience()`

4. **institution_id + max_hours_per_week (ASC/DESC)**
   - Usado para: Ordenar tutores por disponibilidad horaria
   - Método: `getTutorsByInstitutionSortedByAvailability()`

#### Índices Compuestos por Institución
5. **institution_id + country + full_name (ASC)**
   - Usado para: Filtrar tutores por institución y país, ordenados alfabéticamente
   - Método: `getTutorsByInstitutionAndCountry()`

6. **institution_id + birth_language + full_name (ASC)**
   - Usado para: Filtrar tutores por institución e idioma nativo, ordenados alfabéticamente
   - Método: `getTutorsByInstitutionAndLanguage()`

#### Índices Globales
7. **country + full_name (ASC)**
   - Usado para: Listar tutores por país (sin filtro de institución)
   - Método: `getTutorsByCountry()`

8. **max_hours_per_week (DESC)**
   - Usado para: Obtener tutores destacados por disponibilidad
   - Método: `getFeaturedTutors()`

## Casos de Uso por Índice

### Para Instituciones - Estudiantes
- **Listado básico**: `institution_id + full_name`
- **Filtro por fecha de inscripción**: `institution_id + enrollment_date`
- **Filtro por nivel**: `institution_id + level_cefr`
- **Filtro por edad**: `institution_id + birth_date`
- **Filtro por idioma objetivo**: `institution_id + target_language + full_name`
- **Filtro por país**: `institution_id + country + full_name`
- **Filtro por nivel específico**: `institution_id + level_cefr + full_name`

### Para Instituciones - Tutores
- **Listado básico**: `institution_id + full_name`
- **Filtro por precio**: `institution_id + hourly_rate`
- **Filtro por experiencia**: `institution_id + experience_level`
- **Filtro por disponibilidad**: `institution_id + max_hours_per_week`
- **Filtro por país**: `institution_id + country + full_name`
- **Filtro por idioma**: `institution_id + birth_language + full_name`

### Para Búsquedas Globales
- **Estudiantes por país**: `country + full_name`
- **Estudiantes por idioma objetivo**: `target_language + full_name`
- **Estudiantes por nivel**: `level_cefr + full_name`
- **Estudiantes más recientes**: `enrollment_date (DESC)`
- **Tutores por país**: `country + full_name`
- **Tutores destacados**: `max_hours_per_week (DESC)`

## Métodos de Servicio Disponibles

### Estudiantes (StudentService)

```typescript
// Básicos por institución
getStudentsByInstitution(institutionId: string)
getStudentsByInstitutionSortedByEnrollment(institutionId: string, direction: 'asc' | 'desc')
getStudentsByInstitutionSortedByLevel(institutionId: string, direction: 'asc' | 'desc')
getStudentsByInstitutionSortedByAge(institutionId: string, direction: 'asc' | 'desc')

// Filtros compuestos por institución
getStudentsByInstitutionAndTargetLanguage(institutionId: string, targetLanguage: string)
getStudentsByInstitutionAndCountry(institutionId: string, country: string)
getStudentsByInstitutionAndLevel(institutionId: string, level: LevelCEFR)

// Globales
getStudentsByCountry(country: string)
getStudentsByTargetLanguage(targetLanguage: string)
getStudentsByLevel(level: LevelCEFR)
getNewestStudents(count: number)
getAllStudents()
```

### Tutores (TutorService)

```typescript
// Básicos por institución
getTutorsByInstitution(institutionId: string)
getTutorsByInstitutionSortedByRate(institutionId: string, direction: 'asc' | 'desc')
getTutorsByInstitutionSortedByExperience(institutionId: string, direction: 'asc' | 'desc')
getTutorsByInstitutionSortedByAvailability(institutionId: string, direction: 'asc' | 'desc')

// Filtros compuestos por institución
getTutorsByInstitutionAndCountry(institutionId: string, country: string)
getTutorsByInstitutionAndLanguage(institutionId: string, language: string)

// Globales
getTutorsByCountry(country: string)
getFeaturedTutors(count: number)
getAllTutors()
getTutorsByAvailability(minHours: number)
```

## Campos Útiles para Ordenamiento

### Estudiantes (Student)
- `full_name`: Nombre completo (ordenamiento alfabético)
- `level_cefr`: Nivel CEFR actual (A1, A2, B1, B2, C1, C2)
- `enrollment_date`: Fecha de inscripción
- `birth_date`: Fecha de nacimiento (para ordenamiento por edad)
- `target_language`: Idioma que está aprendiendo
- `country`: País de origen
- `goals`: Objetivos de aprendizaje (array)

### Tutores (Tutor)
- `full_name`: Nombre completo (ordenamiento alfabético)
- `hourly_rate`: Tarifa por hora (ordenamiento por precio)
- `experience_level`: Nivel de experiencia (años)
- `max_hours_per_week`: Máximo de horas disponibles por semana
- `country`: País de origen
- `birth_language`: Idioma nativo

## Comandos para Desplegar Índices

```bash
# Desplegar solo índices compuestos
firebase deploy --only firestore:indexes

# Verificar estado de índices
firebase firestore:indexes
```

## Configuración Adicional Requerida

⚠️ **Importante**: Algunos índices deben configurarse manualmente como **índices de campo único** en la consola de Firebase. Ver archivo `SINGLE_FIELD_INDEXES.md` para detalles.

## Notas Importantes

1. Los índices compuestos requieren el orden exacto de los campos
2. Los índices de campo único se configuran en Firebase Console
3. Cada combinación de ordenamiento (ASC/DESC) requiere un índice separado
4. Los índices tardan tiempo en construirse en producción
5. Firestore permite índices automáticos para consultas simples (un solo campo)
6. Si recibes error "index is not necessary", el índice puede manejarse con configuración de campo único
