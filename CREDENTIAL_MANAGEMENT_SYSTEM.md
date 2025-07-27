# Sistema de Gestión de Credenciales Temporales

## Descripción General

Se ha implementado un sistema completo para la gestión de credenciales temporales para tutores y estudiantes creados por instituciones. El sistema incluye:

1. **Generación automática de contraseñas temporales**
2. **Envío automático de emails de bienvenida**
3. **Validación de contraseñas temporales en el login**
4. **Migración automática a Google Authentication**

## Componentes Implementados

### 1. PasswordGeneratorService

**Ubicación:** `src/app/services/password-generator.service.ts`

**Características:**
- Genera contraseñas temporales usando 3 palabras aleatorias en español
- Formato: `palabra1-palabra2-palabra3` (ej: `pingüino-pizza-azul`)
- Lista de 75+ palabras divertidas y fáciles de recordar
- Validación de formato de contraseñas temporales

**Métodos principales:**
- `generateTemporaryPassword()`: Genera una contraseña temporal
- `generateMultiplePasswords(count)`: Genera múltiples contraseñas para testing
- `isTemporaryPasswordFormat(password)`: Valida formato de contraseña temporal

### 2. EmailService

**Ubicación:** `src/app/services/email.service.ts`

**Características:**
- Integración con Firebase Extension `firestore-send-email`
- Templates HTML profesionales para tutores y estudiantes
- Envío automático de credenciales de acceso
- Manejo de errores sin afectar la creación de usuarios

**Métodos principales:**
- `sendTutorWelcomeEmail(data)`: Envía email de bienvenida a tutores
- `sendStudentWelcomeEmail(data)`: Envía email de bienvenida a estudiantes

### 3. Actualizaciones en UserService

**Características agregadas:**
- Soporte para contraseñas temporales en `createEmptyUser()`
- Nuevos campos en el tipo `User`: `temporary_password` y `needs_password_change`

### 4. Actualizaciones en SessionService

**Características agregadas:**
- Validación de contraseñas temporales en `loginWithEmail()`
- Limpieza de datos temporales en `firstTimeLogin()`
- Migración automática a Firebase Auth

### 5. Actualizaciones en Componentes

**AddTutorDialogComponent y AddStudentDialogComponent:**
- Generación automática de contraseñas temporales
- Envío automático de emails de bienvenida
- Manejo de errores mejorado

**LoginComponent:**
- Manejo de errores específicos para contraseñas temporales incorrectas

## Flujo de Trabajo

### Para Instituciones (Creación de Tutores/Estudiantes)

1. **Creación del Usuario:**
   - La institución completa el formulario del tutor/estudiante
   - Se genera automáticamente una contraseña temporal (ej: `koala-taco-verde`)
   - Se crea el usuario en Firestore con la contraseña temporal

2. **Envío de Credenciales:**
   - Se envía automáticamente un email de bienvenida con:
     - Credenciales de acceso (email + contraseña temporal)
     - Enlace directo al login
     - Instrucciones paso a paso
     - Información sobre el cambio de contraseña

3. **Confirmación:**
   - Se muestra mensaje de éxito confirmando el envío del email
   - El usuario queda registrado y listo para primer acceso

### Para Tutores/Estudiantes (Primer Acceso)

1. **Primer Login:**
   - El usuario recibe el email con sus credenciales
   - Intenta hacer login con email + contraseña temporal
   - El sistema detecta que es un usuario que necesita activación

2. **Configuración de Contraseña:**
   - Se abre automáticamente el diálogo de configuración de contraseña
   - El usuario debe crear una nueva contraseña segura
   - Se valida la fortaleza de la contraseña

3. **Migración Automática:**
   - Se crea la cuenta en Firebase Authentication
   - Se migran todos los datos del usuario
   - Se limpian las credenciales temporales
   - Se redirige automáticamente según el rol

4. **Accesos Posteriores:**
   - El usuario puede hacer login normalmente con su nueva contraseña
   - Opción futura: migración a Google Authentication

## Configuración de Email

### Extensión Firebase Required

Asegúrate de que la extensión `firestore-send-email` esté instalada y configurada:

```json
{
  "extensions": {
    "firestore-send-email": "firebase/firestore-send-email@0.2.4"
  }
}
```

### Variables de Entorno

Las siguientes variables están configuradas en `extensions/firestore-send-email.env`:

- `MAIL_COLLECTION=mail`
- `TEMPLATES_COLLECTION=emailTemplates`
- `DEFAULT_FROM=My Tutors <hello@mytutors.click>`
- `SMTP_CONNECTION_URI=smtps://...`

## Seguridad

### Contraseñas Temporales

1. **Generación Segura:**
   - Palabras aleatorias sin patrones predecibles
   - No se almacenan en logs del cliente
   - Solo se almacenan temporalmente en Firestore

2. **Validación:**
   - Solo válidas para el primer acceso
   - Se eliminan automáticamente tras la configuración
   - Timeout implícito (usuario debe activar cuenta)

3. **Limpieza:**
   - Las contraseñas temporales se eliminan al migrar a Firebase Auth
   - No quedan rastros en la base de datos

### Emails

1. **Contenido Seguro:**
   - Enlaces directos al login (no a páginas genéricas)
   - Instrucciones claras sobre seguridad
   - Advertencias sobre contraseñas temporales

2. **Entrega:**
   - Utiliza SMTP seguro configurado
   - Manejo de errores sin exponer información sensible

## Testing

### Generar Contraseñas de Prueba

```typescript
// En la consola del navegador
const passwordService = new PasswordGeneratorService();
console.log(passwordService.generateMultiplePasswords(10));
```

### Verificar Formato

```typescript
const isValid = passwordService.isTemporaryPasswordFormat('koala-taco-verde');
console.log(isValid); // true
```

### Probar Envío de Emails

1. Crear un tutor/estudiante de prueba
2. Verificar que el email llegue correctamente
3. Confirmar que las credenciales funcionen
4. Probar el flujo completo de primer acceso

## Errores Comunes

### "Contraseña temporal incorrecta"
- El usuario está intentando acceder con una contraseña temporal incorrecta
- Verificar el email enviado o regenerar credenciales

### "Email no enviado"
- Verificar configuración SMTP
- Revisar logs de Firebase Extensions
- Confirmar que la extensión `firestore-send-email` esté activa

### "Error en migración"
- Posible duplicación de datos
- Verificar que el usuario no exista ya en Firebase Auth
- Revisar permisos de Firestore

## Próximas Mejoras

1. **Dashboard de Administración:**
   - Ver estado de activación de usuarios
   - Reenviar emails de bienvenida
   - Regenerar credenciales temporales

2. **Integración con Google:**
   - Migración automática a Google Auth tras primer acceso
   - SSO para instituciones

3. **Analytics:**
   - Tracking de emails abiertos
   - Estadísticas de activación de cuentas
   - Tiempo promedio de primer acceso

4. **Personalización:**
   - Templates de email personalizables por institución
   - Logos y branding personalizado
   - Idiomas múltiples en emails

## Soporte

Para reportar problemas o solicitar nuevas características, contacta al equipo de desarrollo o crea un issue en el repositorio del proyecto.
