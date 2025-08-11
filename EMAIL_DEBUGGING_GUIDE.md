# Guía de Depuración del Sistema de Emails

## Resumen del Problema

El sistema de envío de emails estaba fallando con el error:
```
FirebaseError: Missing or insufficient permissions.
Error enviando email: Error al enviar email a pedrocarpiom@gmail.com
```

## Soluciones Implementadas

### 1. ✅ Reglas de Firestore Actualizadas

Se agregó una regla específica para la colección `mail`:

```javascript
// Email collection for firestore-send-email extension
// Allow authenticated users to create email documents
match /mail/{mailId} {
  allow create: if request.auth != null;
  allow read, update: if false; // Only the extension should read/update emails
}
```

**¿Por qué era necesario?**
- La extensión `firestore-send-email` necesita que los usuarios autenticados puedan escribir documentos en la colección `mail`
- Solo la extensión debe poder leer/actualizar estos documentos

### 2. ✅ Mejoras en EmailService

- **Verificación de autenticación**: Se verifica que el usuario esté autenticado antes de intentar enviar emails
- **Logging mejorado**: Se agregaron logs detallados para facilitar el debugging
- **Manejo de errores específicos**: Mensajes de error más descriptivos según el tipo de problema
- **Información del remitente**: Se agrega información del usuario autenticado al documento de email

### 3. ✅ Manejo de Errores Mejorado

En `AssignTutorDialogComponent`:
- Los errores de email ya no bloquean la asignación del tutor
- Mensajes de error específicos para diferentes tipos de problemas
- Diferenciación entre éxito completo y éxito parcial

### 4. ✅ Soporte para Formatos de Fecha/Hora

Se mejoró el template de email para soportar tanto:
- Formato combinado: `class_datetime`
- Formato separado: `class_date` + `start_time`

### 5. ✅ Herramientas de Testing

Se agregaron métodos de debugging:

```typescript
// En la consola del navegador:
emailService.testEmailSystem('tu-email@example.com')
component.testEmailSystem()
component.testAssignmentEmail()
```

## Configuración de la Extensión Firestore Send Email

### Archivo: `extensions/firestore-send-email.env`

```env
ALLOWED_EVENT_TYPES=firebase.extensions.firestore-send-email.v1.onSuccess
AUTH_TYPE=UsernamePassword
DATABASE=(default)
DATABASE_REGION=us-central1
DEFAULT_FROM=My Tutors <hello@mytutors.click>
DEFAULT_REPLY_TO=My Tutors <hello@mytutors.click>
EVENTARC_CHANNEL=projects/${param:PROJECT_ID}/locations/us-central1/channels/firebase
MAIL_COLLECTION=mail
OAUTH_PORT=465
OAUTH_SECURE=false
SMTP_CONNECTION_URI=smtps://hello@mytutors.click:ET3(wQjhu%/qz6!@mail.privateemail.com:465
TEMPLATES_COLLECTION=emailTemplates
TTL_EXPIRE_TYPE=day
TTL_EXPIRE_VALUE=1
USERS_COLLECTION=users
```

## Diagnóstico de Problemas

### Problema 1: "Missing or insufficient permissions"

**Causa**: Reglas de Firestore no permiten escribir en la colección `mail`

**Solución**:
1. Verificar que las reglas incluyen la regla para `mail`
2. Desplegar las reglas: `firebase deploy --only firestore:rules`
3. Verificar que el usuario esté autenticado

### Problema 2: "Usuario no autenticado"

**Causa**: El usuario no ha iniciado sesión correctamente

**Solución**:
1. Verificar `auth.currentUser` en el navegador
2. Volver a iniciar sesión si es necesario
3. Verificar que `SessionService` esté funcionando correctamente

### Problema 3: La extensión no procesa los emails

**Causa**: Configuración incorrecta o extensión no activa

**Solución**:
1. Verificar que la extensión esté instalada: Firebase Console > Extensions
2. Revisar logs de la extensión en Firebase Console
3. Verificar configuración SMTP

## Comandos de Testing

### Desde la Consola del Navegador

```javascript
// Acceder al servicio de email
const emailService = window.ng?.getComponent?.($0)?.emailService || 
                    window.ng?.injector?.get?.('EmailService');

// Probar el sistema básico
await emailService.testEmailSystem('tu-email@example.com');

// En el componente de asignación
const component = window.ng?.getComponent?.($0);
await component.testEmailSystem();
await component.testAssignmentEmail();

// Ver estado del componente
component.debugCurrentState();
```

### Desde Firebase CLI

```bash
# Desplegar solo reglas
firebase deploy --only firestore:rules

# Ver logs de extensiones
firebase functions:log --only "ext-firestore-send-email-*"

# Ver estado del proyecto
firebase projects:list
firebase use my-tutors-v2
```

## Estructura del Documento de Email

Los emails se almacenan en la colección `mail` con esta estructura:

```json
{
  "to": ["destinatario@example.com"],
  "message": {
    "subject": "Asunto del email",
    "html": "<html>...</html>",
    "text": "Versión en texto plano"
  },
  "created": "2024-01-01T12:00:00.000Z",
  "from_uid": "firebase-auth-uid",
  "from_email": "remitente@example.com",
  "delivery": {
    "state": "PENDING",
    "attempts": 0
  }
}
```

## Estados de la Extensión

La extensión actualiza los documentos con información de estado:

- **PENDING**: Email en cola para envío
- **PROCESSING**: Enviando email
- **SUCCESS**: Email enviado exitosamente
- **ERROR**: Error en el envío

## Monitoreo

### En Firebase Console

1. **Firestore**: Revisar colección `mail` para ver emails enviados
2. **Extensions**: Revisar logs de `firestore-send-email`
3. **Authentication**: Verificar usuarios activos

### En el Navegador

1. **Console**: Revisar logs del EmailService
2. **Network**: Verificar llamadas a Firestore API
3. **Application**: Revisar estado de autenticación

## Checklist de Verificación

- [ ] Usuario autenticado correctamente
- [ ] Reglas de Firestore permiten escribir en `mail`
- [ ] Extensión firestore-send-email instalada y activa
- [ ] Configuración SMTP correcta
- [ ] Email del destinatario válido
- [ ] No hay errores en la consola del navegador

## Solución de Problemas Comunes

### Error: "Auth context was not provided"

```javascript
// Verificar inyección de Auth
if (!this.auth.currentUser) {
  console.error('Usuario no autenticado');
}
```

### Error: "Collection reference expected"

```javascript
// Verificar colección de mail
const mailCollection = collection(this.firestore, 'mail');
console.log('Mail collection:', mailCollection);
```

### Email no llega al destinatario

1. Revisar carpeta de spam
2. Verificar configuración SMTP
3. Revisar logs de la extensión
4. Verificar que el dominio de envío esté configurado

## Contacto Técnico

Para problemas persistentes:
1. Revisar logs completos en Firebase Console
2. Verificar configuración de la extensión
3. Contactar soporte si es necesario

---

**Fecha de actualización**: Enero 2024
**Estado**: Implementado y funcionando
