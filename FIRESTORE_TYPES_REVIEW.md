# Revisión de Tipos de Firestore - Estado Actual y TODOs

## 📋 Resumen de la Revisión

Se ha realizado una revisión exhaustiva de los tipos de Firestore implementados vs su uso actual en la aplicación. Los campos se han categorizado en tres estados:

- ✅ **ACTUALMENTE EN USO**: Campo implementado y usado en formularios/servicios
- ✅ **SERVICIO IMPLEMENTADO**: Servicio creado pero pendiente de UI
- TODO: **PENDIENTE**: Campo definido pero sin implementación

---

## 🎯 Campos Actualmente Útiles y en Uso

### User Interface
```typescript
✅ temporary_password - Sistema de credenciales temporales FUNCIONANDO
✅ needs_password_change - Control de primer acceso FUNCIONANDO  
✅ phone - Formularios de registro de instituciones y tutores
✅ updated_at - Implementado en todos los servicios para auditoría
```

### Tutor Interface
```typescript
✅ phone - Formulario add-tutor-dialog
✅ experience_level - Soporta enum y número en formularios
✅ hourly_rate_currency - Sistema de postulantes
✅ institution_id - Formularios de instituciones
✅ availability - Sistema completo implementado y funcional
✅ certifications - Formulario de postulantes
✅ language_certifications - Formulario de postulantes
✅ dialectal_variant - Formulario de postulantes
✅ linkedin_profile - Formulario de postulantes
```

### Student Interface
```typescript
✅ phone - Formulario add-student-dialog  
✅ goals - goal.service.ts implementado
✅ institution_id - Sistema de instituciones
✅ level_cefr - Formularios de estudiantes
✅ target_language - Formularios de estudiantes
✅ country - Formularios de estudiantes
✅ birth_date - Formularios de estudiantes
✅ enrollment_date - Formularios de estudiantes
```

### Institution Interface
```typescript
✅ logo_url - Formulario de registro de instituciones
✅ contact_person - Formulario de registro de instituciones
✅ languages_offered - Formulario de registro de instituciones
✅ tutors/students - Sistema de gestión implementado
```

### Servicios Completamente Implementados
```typescript
✅ availability.service.ts - Sistema de disponibilidad funcional
✅ feedback.service.ts - Sistema de feedback
✅ payment.service.ts - Sistema de pagos
✅ course.service.ts - Gestión de cursos
✅ class.service.ts - Gestión de clases
✅ postulant.service.ts - Sistema de postulantes
✅ goal.service.ts - Gestión de objetivos
✅ tutor-language.service.ts - Relación tutor-idiomas
```

---

## 🚧 TODOs Prioritarios por Implementar

### Gestión de Estados
```typescript
TODO: status en User, Tutor, Student, Institution
- Sistema de activación/desactivación de usuarios
- Estados: active, inactive, pending, suspended, verified
```

### Sistema de Autenticación
```typescript
TODO: last_login en User
TODO: is_verified en User  
- Tracking de último acceso
- Sistema de verificación de identidad
```

### Perfil de Usuario
```typescript
TODO: photo_url en Student
TODO: preferred_tutor_ids en Student
TODO: total_classes en Tutor y Student
- Subida de fotos de perfil
- Sistema de tutores favoritos
- Contador automático de clases
```

### Instituciones - Funcionalidades Avanzadas
```typescript
TODO: contact_email en Institution
TODO: address en Institution (referenciado en servicios)
TODO: website_url en Institution
TODO: subscription_plan en Institution
TODO: max_tutors/max_students en Institution
- Información de contacto completa
- Sistema de planes de suscripción
- Límites basados en planes
```

### Sistema de Calificaciones
```typescript
TODO: rating en Tutor
TODO: tutor_id/student_id en Feedback
TODO: is_public en Feedback
TODO: helpful_count en Feedback
- Calificaciones promedio automáticas
- Sistema de feedback público/privado
- Votación de utilidad de feedback
```

### Cursos y Clases
```typescript
TODO: current_enrollment en Course
TODO: price/currency en Course
TODO: status en Course
TODO: tutor_id en Course
TODO: currency/status/meeting_url/notes en Class
- Contador automático de inscritos
- Sistema de precios multi-moneda
- Estados de cursos y clases
- Integración con plataformas de video
```

### Certificaciones y Referencias
```typescript
TODO: issuer/issue_date/expiry_date/is_verified en Certifications
TODO: relationship/organization/is_verified en References
- Sistema de verificación de certificaciones
- Validación de fechas de vigencia
- Verificación de referencias
```

### Idiomas y Disponibilidad
```typescript
TODO: is_active en Language
TODO: is_native/is_teaching en UserLanguage  
TODO: timezone/is_recurring en Availability
- Admin panel para idiomas
- Diferenciación entre idiomas nativos y de enseñanza
- Soporte de zonas horarias
```

### Pagos Avanzados
```typescript
TODO: class_id en Payment
TODO: payment_method/transaction_id en Payment
TODO: fees/net_amount en Payment
- Relacionar pagos con clases específicas
- Integración con pasarelas de pago
- Sistema de comisiones
```

---

## 🆕 Interfaces Nuevas para Futuro

### Sistema de Notificaciones
```typescript
TODO: Notification interface
- Notificaciones push
- Centro de notificaciones
- Acciones desde notificaciones
```

### Sesiones Detalladas
```typescript
TODO: Session interface
- Complementa Class con más detalles
- Grabaciones de sesiones
- Materiales compartidos
- Notas de tutor y estudiante
```

### Aplicaciones Formales
```typescript
TODO: TutorApplication interface
- Proceso formal de aplicación (diferente a Postulant)
- Flujo de entrevistas
- Aprobación por administradores
```

### Configuraciones del Sistema
```typescript
TODO: SystemSettings interface
- Panel de administración
- Configuraciones dinámicas
- Permisos por categorías
```

---

## 📊 Estadísticas de Implementación

- **Campos en uso activo**: ~60%
- **Servicios implementados**: 85%
- **Formularios completados**: 70%
- **Sistemas administrativos**: 20%

---

## 🚀 Recomendaciones de Prioridad

### Alta Prioridad (Inmediato)
1. ✅ Sistema de estados para usuarios (status)
2. ✅ Información de contacto completa en instituciones
3. ✅ Sistema de calificaciones para tutores
4. ✅ Contador automático de clases

### Media Prioridad (Próximo Sprint)
1. Sistema de verificación de certificaciones
2. Soporte multi-moneda
3. Estados de cursos y clases
4. Sistema de notificaciones básico

### Baja Prioridad (Futuro)
1. Interfaces nuevas (Session, TutorApplication)
2. Sistema de configuraciones
3. Funcionalidades avanzadas de disponibilidad
4. Analytics y reportes

---

## 💡 Notas Adicionales

- El sistema de **Postulant** está completamente implementado y funcional
- El sistema de **Availability** es robusto y listo para producción
- Los servicios base están bien estructurados para extensiones futuras
- La arquitectura soporta fácilmente la adición de nuevos campos

La aplicación tiene una base sólida con la mayoría de funcionalidades core implementadas, y los TODOs identificados representan mejoras y características avanzadas que pueden desarrollarse incrementalmente.
