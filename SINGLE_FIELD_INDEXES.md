# Configuración de Índices de Campo Único

Los siguientes índices deben configurarse como **índices de campo único** en la consola de Firebase, no en el archivo `firestore.indexes.json`:

## Estudiantes (students)

### Índices de campo único requeridos:
1. `enrollment_date` - orden descendente (para `getNewestStudents()`)
2. `level_cefr` - orden ascendente (para consultas de filtro)
3. `country` - orden ascendente (para consultas de filtro)  
4. `target_language` - orden ascendente (para consultas de filtro)
5. `birth_date` - orden ascendente y descendente (para ordenamiento por edad)

### Cómo configurar en Firebase Console:
1. Ve a Firebase Console > Firestore > Índices
2. Pestaña "Campos únicos"
3. Selecciona la colección `students`
4. Agrega cada campo con la configuración:
   - **Modo de consulta**: Activado
   - **Orden**: Según se especifica arriba

## Tutores (tutors)

### Índices de campo único requeridos:
1. `max_hours_per_week` - orden descendente (para `getFeaturedTutors()`)
2. `country` - orden ascendente (para consultas de filtro)
3. `experience_level` - orden ascendente y descendente
4. `hourly_rate` - orden ascendente y descendente

### Consultas que funcionan automáticamente:
- Consultas con un solo `where()` sin `orderBy()`
- Consultas con solo `orderBy()` en un campo
- Combinaciones simples que Firestore puede optimizar automáticamente

## Nota importante:
Los índices compuestos en `firestore.indexes.json` son solo para consultas que combinan múltiples campos con filtros WHERE y ORDER BY.
