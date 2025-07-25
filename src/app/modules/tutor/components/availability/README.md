# Sistema de Disponibilidad de Tutores

## Descripción
Sistema completo de gestión de disponibilidad para tutores que incluye:
- Calendario semanal estilo Outlook
- Editor interactivo con funcionalidad click & drag
- Visualización clara de horarios disponibles
- Persistencia en Firestore
- Validación de datos de disponibilidad

## Componentes

### 1. AvailabilityComponent
**Ubicación:** `src/app/modules/tutor/components/availability/availability.component.ts`

**Funcionalidades:**
- Muestra la disponibilidad actual del tutor en formato calendario semanal
- Toolbar con título "Disponibilidad" y botón "Modificar"
- Vista de resumen de horarios por día
- Integración con TutorService y AvailabilityService para persistencia
- Validación automática de datos antes de guardar

**Uso:**
```typescript
// El componente se carga automáticamente para usuarios con rol 'tutor'
// Accesible en la ruta: /tutor/availability
```

### 2. SetAvailabilityDialogComponent
**Ubicación:** `src/app/modules/tutor/components/availability/set-availability-dialog/set-availability-dialog.component.ts`

**Funcionalidades:**
- Editor interactivo con click & drag para seleccionar/deseleccionar horas
- Soporte para selección de rangos de horas y días
- Preview visual durante la selección
- Botones: Reiniciar, Cancelar, Actualizar
- Prevención de selección de texto durante drag

**Interacciones:**
- **Click + Drag:** Selecciona rango de horas
- **Click en hora seleccionada + Drag:** Deselecciona rango
- **Botón Reiniciar:** Limpia toda la disponibilidad
- **Botón Actualizar:** Guarda cambios
- **Botón Cancelar:** Descarta cambios

## Modelo de Datos

### Interfaz Availability
```typescript
interface Availability {
  week_day: string; // ISO 8601 format (e.g., "Monday")
  hours: number[];  // Array of hours in 24-hour format (e.g., [9, 10, 13, 14])
}
```

### Estructura en Firestore
```typescript
// Documento del tutor en colección 'tutors'
{
  user_id: string,
  full_name: string,
  // ... otros campos del tutor
  availability: [
    {
      week_day: "Monday",
      hours: [9, 10, 11, 14, 15, 16]
    },
    {
      week_day: "Tuesday", 
      hours: [8, 9, 10, 13, 14]
    }
    // ... resto de días
  ]
}
```

## Servicios

### TutorService - Métodos existentes
```typescript
// Obtener tutor por user ID
getTutor(userId: string): Observable<Tutor | undefined>

// Actualizar disponibilidad del tutor
updateTutorAvailability(userId: string, availability: Availability[]): Promise<void>
```

### AvailabilityService - Métodos específicos para disponibilidad semanal
```typescript
// Obtener disponibilidad semanal del tutor
getTutorWeeklyAvailability(tutorId: string): Observable<{ availability?: Availability[] }>

// Actualizar disponibilidad semanal
updateTutorWeeklyAvailability(tutorId: string, availability: Availability[]): Promise<void>

// Establecer disponibilidad completa (reemplaza)
setTutorWeeklyAvailability(tutorId: string, availability: Availability[]): Promise<void>

// Agregar hora específica a un día
addAvailabilityHour(tutorId: string, dayKey: string, hour: number): Promise<void>

// Remover hora específica de un día
removeAvailabilityHour(tutorId: string, dayKey: string, hour: number): Promise<void>

// Limpiar toda la disponibilidad
clearTutorAvailability(tutorId: string): Promise<void>

// Utilidades
getDayAvailability(availability: Availability[], dayKey: string): number[]
isHourAvailable(availability: Availability[], dayKey: string, hour: number): boolean
getAvailabilityRange(availability: Availability[]): { earliest: number, latest: number } | null
formatHour(hour: number): string
getAvailabilitySummary(availability: Availability[]): Record<string, string>
createDefaultWeeklyAvailability(): Availability[]
validateAvailabilityData(availability: Availability[]): boolean
getTotalWeeklyHours(availability: Availability[]): number
hasAvailabilityOnDay(availability: Availability[], dayKey: string): boolean
getAvailableDays(availability: Availability[]): string[]
```

## Rutas
- **Vista principal:** `/tutor/availability`
- **Requiere autenticación:** Sí
- **Rol requerido:** `tutor`

## Validación de Datos

### Validaciones implementadas:
- **Días válidos:** Solo acepta días de la semana en formato ISO 8601
- **Horas válidas:** Solo acepta números enteros del 0 al 23
- **Formato correcto:** Verifica que la estructura siga el modelo definido

### Ejemplo de validación:
```typescript
const isValid = availabilityService.validateAvailabilityData([
  {
    week_day: "Monday",
    hours: [9, 10, 11] // ✅ Válido
  },
  {
    week_day: "InvalidDay", // ❌ Inválido
    hours: [25, 26] // ❌ Inválido (horas > 23)
  }
]);
```

## Flujo de Uso

1. **Tutor accede** a `/tutor/availability`
2. **Ve su disponibilidad actual** en formato calendario
3. **Hace clic en "Modificar"** para abrir el editor
4. **Usa click & drag** para ajustar horarios:
   - Arrastra en horas vacías para seleccionar
   - Arrastra en horas ocupadas para deseleccionar
5. **Usa "Reiniciar"** si quiere empezar de cero
6. **Hace clic en "Actualizar"** para guardar cambios
7. **Sistema valida** los datos antes de guardar
8. **Los cambios se reflejan** inmediatamente en la vista principal

## Características Técnicas

### Prevención de Errores
- Validación de usuario autenticado
- Validación de datos de disponibilidad
- Manejo de errores en operaciones de Firestore
- Mensajes informativos al usuario (SnackBar)

### Optimizaciones
- `trackBy` functions para mejor rendimiento
- Event listeners optimizados para drag operations
- Prevención de selección de texto durante drag
- Uso de servicios especializados para lógica de negocio

### Accesibilidad
- Tooltips informativos
- Indicadores visuales claros
- Controles de teclado básicos
- Colores contrastantes para diferentes estados

## Próximas Mejoras Sugeridas

1. **Zonas horarias:** Soporte para diferentes zonas horarias
2. **Disponibilidad por fechas:** Calendario mensual para fechas específicas
3. **Plantillas:** Guardar y aplicar plantillas de disponibilidad
4. **Notificaciones:** Alertas cuando se modifica disponibilidad
5. **Exportación:** Exportar horarios a formatos externos (iCal, etc.)
6. **Historial:** Registro de cambios en la disponibilidad
7. **Conflictos:** Detección automática de conflictos con clases programadas
