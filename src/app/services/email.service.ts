import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface WelcomeEmailData {
  tutorName: string;
  email: string;
  temporaryPassword: string;
  institutionName: string;
  loginUrl: string;
}

export interface StudentWelcomeEmailData {
  studentName: string;
  email: string;
  temporaryPassword: string;
  institutionName: string;
  loginUrl: string;
}

export interface JobAssignmentEmailData {
  tutorName: string;
  tutorEmail: string;
  institutionName: string;
  institutionEmail: string;
  jobTitle: string;
  classDate: string;
  startTime?: string; // ✅ Ahora opcional para soportar class_datetime
  classDateTime?: string; // ✅ NUEVO: Campo combinado preferido
  duration: number;
  students: {
    name: string;
    age: number;
    level: string;
  }[];
  modality: string;
  location?: string;
  totalPayment?: number;
  currency?: string;
  classLink?: string; // ✅ NUEVO: Link directo a la clase
}

export interface StudentClassNotificationData {
  studentName: string;
  parentEmail: string;
  tutorName: string;
  institutionName: string;
  classDate: string;
  startTime: string;
  duration: number;
  modality: string;
  location?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  /**
   * Envía un email de bienvenida a un tutor recién creado
   */
  async sendTutorWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    const template = this.generateTutorWelcomeTemplate(data);
    await this.sendEmail(data.email, template);
  }

  /**
   * Envía un email de bienvenida a un estudiante recién creado
   */
  async sendStudentWelcomeEmail(data: StudentWelcomeEmailData): Promise<void> {
    const template = this.generateStudentWelcomeTemplate(data);
    await this.sendEmail(data.email, template);
  }

  /**
   * Envía notificación de asignación de trabajo al tutor
   */
  async sendJobAssignmentEmailToTutor(data: JobAssignmentEmailData): Promise<void> {
    const template = this.generateJobAssignmentTutorTemplate(data);
    console.log('Enviando email de asignación de trabajo al tutor:', data.tutorEmail);
    console.log('Template:', template);
    await this.sendEmail(data.tutorEmail, template);
  }

  /**
   * Envía notificación de asignación de trabajo a la institución
   */
  async sendJobAssignmentEmailToInstitution(data: JobAssignmentEmailData): Promise<void> {
    const template = this.generateJobAssignmentInstitutionTemplate(data);
    await this.sendEmail(data.institutionEmail, template);
  }

  /**
   * Envía notificación de clase asignada a los padres/estudiantes
   */
  async sendClassNotificationToStudent(data: StudentClassNotificationData): Promise<void> {
    const template = this.generateStudentClassNotificationTemplate(data);
    await this.sendEmail(data.parentEmail, template);
  }

  /**
   * Envía notificación de nueva postulación a la institución
   */
  async sendNewPostulationNotificationEmail(data: {
    institutionEmail: string;
    institutionName: string;
    jobTitle: string;
    tutorName: string;
    tutorEmail: string;
    coverLetter: string;
    teachingApproach?: string;
    classDate: string;
    loginUrl: string;
  }): Promise<void> {
    const template = this.generateNewPostulationNotificationTemplate(data);
    await this.sendEmail(data.institutionEmail, template);
  }

  /**
   * ✅ NUEVO: Método público para testing del sistema de emails
   * Permite probar el envío de emails desde la consola del navegador
   */
  async testEmailSystem(to = 'test@example.com'): Promise<void> {
    console.log('🧪 Iniciando prueba del sistema de emails...');
    
    const testTemplate: EmailTemplate = {
      subject: 'Prueba del Sistema de Emails - My Tutors',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🧪 Prueba del Sistema</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">My Tutors Email Service</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>¡Hola!</p>
            
            <p>Este es un email de prueba para verificar que el sistema de envío de correos está funcionando correctamente.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #28a745;">Estado del Sistema</h3>
              <p><strong>✅ Autenticación:</strong> Usuario autenticado correctamente</p>
              <p><strong>✅ Firestore:</strong> Permisos de escritura configurados</p>
              <p><strong>✅ Email Extension:</strong> firestore-send-email activa</p>
              <p><strong>✅ Template:</strong> Renderizado HTML exitoso</p>
            </div>

            <p style="margin-top: 30px;">Si recibes este email, ¡el sistema está funcionando perfectamente!</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              Timestamp: ${new Date().toISOString()}<br>
              El equipo técnico de My Tutors
            </p>
          </div>
        </div>
      `,
      text: `Prueba del Sistema de Emails - My Tutors

¡Hola!

Este es un email de prueba para verificar que el sistema de envío de correos está funcionando correctamente.

Estado del Sistema:
✅ Autenticación: Usuario autenticado correctamente
✅ Firestore: Permisos de escritura configurados
✅ Email Extension: firestore-send-email activa
✅ Template: Renderizado HTML exitoso

Si recibes este email, ¡el sistema está funcionando perfectamente!

Timestamp: ${new Date().toISOString()}
El equipo técnico de My Tutors`
    };

    try {
      await this.sendEmail(to, testTemplate);
      console.log('✅ Prueba de email completada exitosamente');
      console.log(`📧 Email de prueba enviado a: ${to}`);
    } catch (error) {
      console.error('❌ Prueba de email falló:', error);
      throw error;
    }
  }

  /**
   * Genera el template HTML para notificación de nueva postulación
   */
  private generateNewPostulationNotificationTemplate(data: {
    institutionName: string;
    jobTitle: string;
    tutorName: string;
    tutorEmail: string;
    coverLetter: string;
    teachingApproach?: string;
    classDate: string;
    loginUrl: string;
  }): EmailTemplate {
    return {
      subject: `Nueva Postulación: ${data.jobTitle} - ${data.tutorName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">📝 Nueva Postulación</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${data.institutionName}</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p>Estimado equipo de <strong>${data.institutionName}</strong>,</p>
            
            <p>Han recibido una nueva postulación para su convocatoria de trabajo:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">Detalles de la Convocatoria</h3>
              <p><strong>Título:</strong> ${data.jobTitle}</p>
              <p><strong>Fecha programada:</strong> ${data.classDate}</p>
            </div>

            <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0066cc; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #0066cc;">Información del Tutor</h3>
              <p><strong>Nombre:</strong> ${data.tutorName}</p>
              <p><strong>Email:</strong> ${data.tutorEmail}</p>
            </div>

            <div style="background: #f0f8f0; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #28a745;">Carta de Presentación</h3>
              <p style="font-style: italic;">"${data.coverLetter}"</p>
              ${data.teachingApproach ? `
                <h4 style="color: #28a745; margin-top: 20px;">Enfoque de Enseñanza</h4>
                <p style="font-style: italic;">"${data.teachingApproach}"</p>
              ` : ''}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Ver Postulaciones
              </a>
            </div>

            <p>Pueden revisar esta postulación y todas las demás accediendo a su panel de administración.</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              Saludos cordiales,<br>
              El equipo de My Tutors<br>
              <em>Este email se envió automáticamente cuando se recibió una nueva postulación.</em>
            </p>
          </div>
        </div>
      `,
      text: `Nueva Postulación: ${data.jobTitle}

Estimado equipo de ${data.institutionName},

Han recibido una nueva postulación para su convocatoria de trabajo.

DETALLES DE LA CONVOCATORIA:
- Título: ${data.jobTitle}
- Fecha programada: ${data.classDate}

INFORMACIÓN DEL TUTOR:
- Nombre: ${data.tutorName}
- Email: ${data.tutorEmail}

CARTA DE PRESENTACIÓN:
"${data.coverLetter}"

${data.teachingApproach ? `ENFOQUE DE ENSEÑANZA:\n"${data.teachingApproach}"` : ''}

Pueden revisar esta postulación accediendo a: ${data.loginUrl}

Saludos cordiales,
El equipo de My Tutors`
    };
  }

  /**
   * Genera el template HTML para notificación de postulación aceptada al tutor
   */
  private generatePostulationAcceptedTutorTemplate(data: {
    tutorName: string;
    institutionName: string;
    jobTitle: string;
    classDate: string;
    institutionEmail: string;
    responseNotes?: string;
    loginUrl: string;
  }): EmailTemplate {
    return {
      subject: `¡Postulación Aceptada! ${data.jobTitle} - ${data.institutionName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🎉 ¡Postulación Aceptada!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Felicitaciones, ${data.tutorName}</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p>Estimado/a <strong>${data.tutorName}</strong>,</p>
            
            <p>¡Excelentes noticias! Su postulación ha sido <strong>aceptada</strong> por <strong>${data.institutionName}</strong>.</p>
            
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #155724;">Detalles de la Clase</h3>
              <p><strong>Convocatoria:</strong> ${data.jobTitle}</p>
              <p><strong>Institución:</strong> ${data.institutionName}</p>
              <p><strong>Fecha programada:</strong> ${data.classDate}</p>
            </div>

            ${data.responseNotes ? `
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #6c757d; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #495057;">Notas de la Institución</h3>
                <p style="font-style: italic;">"${data.responseNotes}"</p>
              </div>
            ` : ''}

            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>📞 Próximos pasos:</strong> La institución se pondrá en contacto contigo pronto para coordinar los detalles finales de la clase.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Acceder a Mi Panel
              </a>
            </div>

            <p>Para cualquier consulta, puede contactar directamente a la institución en: <strong>${data.institutionEmail}</strong></p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              ¡Felicitaciones y mucho éxito en su nueva clase!<br>
              El equipo de My Tutors
            </p>
          </div>
        </div>
      `,
      text: `¡Postulación Aceptada! - ${data.jobTitle}

Estimado/a ${data.tutorName},

¡Excelentes noticias! Su postulación ha sido ACEPTADA por ${data.institutionName}.

DETALLES DE LA CLASE:
- Convocatoria: ${data.jobTitle}
- Institución: ${data.institutionName}
- Fecha programada: ${data.classDate}

${data.responseNotes ? `NOTAS DE LA INSTITUCIÓN:\n"${data.responseNotes}"\n` : ''}

PRÓXIMOS PASOS:
La institución se pondrá en contacto contigo pronto para coordinar los detalles finales de la clase.

Para cualquier consulta, puede contactar a: ${data.institutionEmail}

Accede a tu panel: ${data.loginUrl}

¡Felicitaciones y mucho éxito!
El equipo de My Tutors`
    };
  }

  /**
   * Genera el template HTML para notificación de postulación rechazada al tutor
   */
  private generatePostulationRejectedTutorTemplate(data: {
    tutorName: string;
    institutionName: string;
    jobTitle: string;
    responseNotes?: string;
    loginUrl: string;
  }): EmailTemplate {
    return {
      subject: `Actualización de Postulación: ${data.jobTitle} - ${data.institutionName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">📋 Actualización de Postulación</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${data.institutionName}</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p>Estimado/a <strong>${data.tutorName}</strong>,</p>
            
            <p>Le escribimos para informarle sobre el estado de su postulación para la convocatoria <strong>${data.jobTitle}</strong> en <strong>${data.institutionName}</strong>.</p>
            
            <div style="background: #f8d7da; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #721c24;">Estado de la Postulación</h3>
              <p>Lamentamos informarle que en esta ocasión su postulación no ha sido seleccionada.</p>
            </div>

            ${data.responseNotes ? `
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #6c757d; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #495057;">Comentarios de la Institución</h3>
                <p style="font-style: italic;">"${data.responseNotes}"</p>
              </div>
            ` : ''}

            <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #0c5460;"><strong>💼 Siga explorando:</strong> No se desanime, hay muchas más oportunidades disponibles en nuestra plataforma.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Ver Más Oportunidades
              </a>
            </div>

            <p>Agradecemos su interés y le animamos a seguir postulándose a nuevas convocatorias.</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              Saludos cordiales,<br>
              El equipo de My Tutors
            </p>
          </div>
        </div>
      `,
      text: `Actualización de Postulación - ${data.jobTitle}

Estimado/a ${data.tutorName},

Le escribimos para informarle sobre el estado de su postulación para la convocatoria ${data.jobTitle} en ${data.institutionName}.

ESTADO: Lamentamos informarle que en esta ocasión su postulación no ha sido seleccionada.

${data.responseNotes ? `COMENTARIOS:\n"${data.responseNotes}"\n` : ''}

No se desanime, hay muchas más oportunidades disponibles en nuestra plataforma.

Ver más oportunidades: ${data.loginUrl}

Agradecemos su interés y le animamos a seguir postulándose.

Saludos cordiales,
El equipo de My Tutors`
    };
  }

  /**
   * Envía notificación de postulación aceptada al tutor
   */
  async sendPostulationAcceptedEmailToTutor(data: {
    tutorEmail: string;
    tutorName: string;
    institutionName: string;
    jobTitle: string;
    classDate: string;
    institutionEmail: string;
    responseNotes?: string;
    loginUrl: string;
  }): Promise<void> {
    const template = this.generatePostulationAcceptedTutorTemplate(data);
    await this.sendEmail(data.tutorEmail, template);
  }

  /**
   * Envía notificación de postulación rechazada al tutor
   */
  async sendPostulationRejectedEmailToTutor(data: {
    tutorEmail: string;
    tutorName: string;
    institutionName: string;
    jobTitle: string;
    responseNotes?: string;
    loginUrl: string;
  }): Promise<void> {
    const template = this.generatePostulationRejectedTutorTemplate(data);
    await this.sendEmail(data.tutorEmail, template);
  }
  private generateTutorWelcomeTemplate(data: WelcomeEmailData): EmailTemplate {
    return {
      subject: `¡Bienvenido a ${data.institutionName}! - Credenciales de acceso`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">¡Bienvenido!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Tu cuenta ha sido creada exitosamente</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p>Hola <strong>${data.tutorName}</strong>,</p>
            
            <p>¡Bienvenido a la familia de ${data.institutionName}! Tu cuenta de tutor ha sido creada exitosamente.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">Credenciales de Acceso</h3>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Contraseña temporal:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${data.temporaryPassword}</code></p>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>⚠️ Importante:</strong> Esta es una contraseña temporal que deberás cambiar en tu primer inicio de sesión.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Acceder a la Plataforma
              </a>
            </div>

            <p style="margin-top: 30px;">¡Estamos emocionados de trabajar contigo!</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              Saludos,<br>
              El equipo de ${data.institutionName}
            </p>
          </div>
        </div>
      `,
      text: `¡Bienvenido ${data.tutorName}!

Tu cuenta de tutor en ${data.institutionName} ha sido creada exitosamente.

Credenciales de acceso:
Email: ${data.email}
Contraseña temporal: ${data.temporaryPassword}

IMPORTANTE: Esta es una contraseña temporal que deberás cambiar en tu primer inicio de sesión.

Accede a la plataforma: ${data.loginUrl}

¡Estamos emocionados de trabajar contigo!

Saludos,
El equipo de ${data.institutionName}`
    };
  }

  /**
   * Genera el template HTML para el email de bienvenida del estudiante
   */
  private generateStudentWelcomeTemplate(data: StudentWelcomeEmailData): EmailTemplate {
    return {
      subject: `¡Bienvenido a ${data.institutionName}! - Credenciales de acceso`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">¡Bienvenido!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Tu aventura de aprendizaje comienza aquí</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p>Hola <strong>${data.studentName}</strong>,</p>
            
            <p>¡Bienvenido a ${data.institutionName}! Tu cuenta de estudiante ha sido creada y estamos emocionados de acompañarte en tu proceso de aprendizaje.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #28a745;">Credenciales de Acceso</h3>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Contraseña temporal:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${data.temporaryPassword}</code></p>
            </div>

            <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #004085;"><strong>📚 Tip:</strong> Esta contraseña temporal debe cambiarse en tu primer acceso para mayor seguridad.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Comenzar a Aprender
              </a>
            </div>

            <p style="margin-top: 30px;">¡Estamos emocionados de acompañarte en tu proceso de aprendizaje!</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              Saludos,<br>
              El equipo de ${data.institutionName}
            </p>
          </div>
        </div>
      `,
      text: `¡Bienvenido ${data.studentName}!

Tu cuenta de estudiante en ${data.institutionName} ha sido creada exitosamente.

Credenciales de acceso:
Email: ${data.email}
Contraseña temporal: ${data.temporaryPassword}

IMPORTANTE: Esta es una contraseña temporal que deberás cambiar en tu primer inicio de sesión.

Accede a la plataforma: ${data.loginUrl}

¡Estamos emocionados de acompañarte en tu proceso de aprendizaje!

Saludos,
El equipo de ${data.institutionName}`
    };
  }

  /**
   * Genera el template HTML para notificación de trabajo asignado al tutor
   */
  private generateJobAssignmentTutorTemplate(data: JobAssignmentEmailData): EmailTemplate {
    const studentsHtml = data.students.map(student => 
      `<li><strong>${student.name}</strong> (${student.age} años) - Nivel: ${student.level}</li>`
    ).join('');

    const locationInfo = data.modality === 'presencial' && data.location 
      ? `<p><strong>Ubicación:</strong> ${data.location}</p>`
      : data.modality === 'virtual' 
        ? `<p><strong>Modalidad:</strong> Virtual (se enviará link de Zoom próximamente)</p>`
        : `<p><strong>Modalidad:</strong> ${data.modality}</p>`;

    const paymentInfo = data.totalPayment && data.currency
      ? `<p><strong>Pago total:</strong> ${data.totalPayment} ${data.currency}</p>`
      : '';

    // ✅ NUEVO: Usar campo combinado o separado según disponibilidad
    const dateTimeInfo = data.classDateTime
      ? `<p><strong>Fecha y hora:</strong> ${data.classDateTime}</p>`
      : `<p><strong>Fecha:</strong> ${data.classDate}</p><p><strong>Hora de inicio:</strong> ${data.startTime}</p>`;

    // ✅ NUEVO: Botón de acceso a clase si está disponible
    const classButtonHtml = data.classLink 
      ? `<div style="text-align: center; margin: 30px 0;">
          <a href="${data.classLink}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
            🎓 Ver Detalles de la Clase
          </a>
         </div>`
      : '';

    return {
      subject: `Clase asignada: ${data.jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">¡Clase Asignada!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Nueva oportunidad de enseñanza</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hola <strong>${data.tutorName}</strong>,</p>
            
            <p>¡Excelente noticia! Has sido seleccionado para dar la siguiente clase:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">${data.jobTitle}</h3>
              ${dateTimeInfo}
              <p><strong>Duración:</strong> ${data.duration} minutos</p>
              ${locationInfo}
              <p><strong>Institución:</strong> ${data.institutionName}</p>
              ${paymentInfo}
            </div>

            <h4>Estudiantes asignados:</h4>
            <ul style="background: white; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #28a745;">
              ${studentsHtml}
            </ul>

            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #856404;">Próximos pasos:</h4>
              <ul style="color: #856404; margin-bottom: 0;">
                <li>Se te enviará el link de Zoom en las próximas horas</li>
                <li>Prepara materiales según el nivel de los estudiantes</li>
                <li>Confirma tu disponibilidad con la institución</li>
              </ul>
            </div>

            ${classButtonHtml}

            <p style="margin-top: 30px;">¡Que tengas una excelente clase!</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Saludos,<br>
              El equipo de My Tutors
            </p>
          </div>
        </div>
      `,
      text: `¡Clase Asignada!

Hola ${data.tutorName},

Has sido seleccionado para dar la siguiente clase:

${data.jobTitle}
${data.classDateTime ? 'Fecha y hora: ' + data.classDateTime : 'Fecha: ' + data.classDate + '\nHora: ' + (data.startTime || '')}
Duración: ${data.duration} minutos
Modalidad: ${data.modality}
${data.location ? 'Ubicación: ' + data.location : ''}
Institución: ${data.institutionName}
${data.totalPayment ? 'Pago total: ' + data.totalPayment + ' ' + data.currency : ''}

Estudiantes:
${data.students.map(s => `- ${s.name} (${s.age} años) - ${s.level}`).join('\n')}

Próximos pasos:
- Se te enviará el link de Zoom en las próximas horas
- Prepara materiales según el nivel de los estudiantes
- Confirma tu disponibilidad con la institución

¡Que tengas una excelente clase!

Saludos,
El equipo de My Tutors`
    };
  }

  /**
   * Genera el template HTML para notificación de trabajo asignado a la institución
   */
  private generateJobAssignmentInstitutionTemplate(data: JobAssignmentEmailData): EmailTemplate {
    const studentsHtml = data.students.map(student => 
      `<li><strong>${student.name}</strong> (${student.age} años) - Nivel: ${student.level}</li>`
    ).join('');

    return {
      subject: `Tutor asignado: ${data.jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Tutor Asignado</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Su convocatoria ha sido cubierta</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Estimado equipo de <strong>${data.institutionName}</strong>,</p>
            
            <p>Nos complace informarles que su convocatoria ha sido asignada exitosamente:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #28a745;">${data.jobTitle}</h3>
              <p><strong>Tutor asignado:</strong> ${data.tutorName}</p>
              <p><strong>Email del tutor:</strong> ${data.tutorEmail}</p>
              <p><strong>Fecha:</strong> ${data.classDate}</p>
              <p><strong>Hora:</strong> ${data.startTime}</p>
              <p><strong>Duración:</strong> ${data.duration} minutos</p>
            </div>

            <h4>Estudiantes:</h4>
            <ul style="background: white; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #667eea;">
              ${studentsHtml}
            </ul>

            <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #0c5460;">Recordatorio importante:</h4>
              <p style="color: #0c5460; margin-bottom: 0;">
                Por favor, asignen un link de Zoom para la clase virtual y envíen la información al tutor y a los padres de familia.
              </p>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Saludos,<br>
              El equipo de My Tutors
            </p>
          </div>
        </div>
      `,
      text: `Tutor Asignado

Estimado equipo de ${data.institutionName},

Su convocatoria ha sido asignada exitosamente:

${data.jobTitle}
Tutor: ${data.tutorName} (${data.tutorEmail})
Fecha: ${data.classDate}
Hora: ${data.startTime}
Duración: ${data.duration} minutos

Estudiantes:
${data.students.map(s => `- ${s.name} (${s.age} años) - ${s.level}`).join('\n')}

RECORDATORIO: Por favor, asignen un link de Zoom y envíen la información.

Saludos,
El equipo de My Tutors`
    };
  }

  /**
   * Genera el template HTML para notificación de clase a estudiantes/padres
   */
  private generateStudentClassNotificationTemplate(data: StudentClassNotificationData): EmailTemplate {
    const locationInfo = data.modality === 'presencial' && data.location 
      ? `<p><strong>Ubicación:</strong> ${data.location}</p>`
      : data.modality === 'virtual' 
        ? `<p><strong>Modalidad:</strong> Virtual (recibirán el link de Zoom próximamente)</p>`
        : `<p><strong>Modalidad:</strong> ${data.modality}</p>`;

    return {
      subject: `Clase confirmada para ${data.studentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Clase Confirmada</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Nueva clase programada</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Estimada familia,</p>
            
            <p>Nos complace confirmarles que se ha programado una nueva clase para <strong>${data.studentName}</strong>:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">Detalles de la clase</h3>
              <p><strong>Tutor:</strong> ${data.tutorName}</p>
              <p><strong>Fecha:</strong> ${data.classDate}</p>
              <p><strong>Hora:</strong> ${data.startTime}</p>
              <p><strong>Duración:</strong> ${data.duration} minutos</p>
              ${locationInfo}
              <p><strong>Institución:</strong> ${data.institutionName}</p>
            </div>

            <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #004085;">Información importante:</h4>
              <ul style="color: #004085; margin-bottom: 0;">
                <li>Asegúrense de que ${data.studentName} esté listo 5 minutos antes</li>
                <li>Tengan a mano materiales de escritura</li>
                ${data.modality === 'virtual' ? '<li>El link de Zoom se enviará por separado</li>' : ''}
              </ul>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Saludos,<br>
              El equipo de ${data.institutionName}
            </p>
          </div>
        </div>
      `,
      text: `Clase Confirmada para ${data.studentName}

Estimada familia,

Se ha programado una nueva clase:

Tutor: ${data.tutorName}
Fecha: ${data.classDate}
Hora: ${data.startTime}
Duración: ${data.duration} minutos
Modalidad: ${data.modality}
${data.location ? 'Ubicación: ' + data.location : ''}
Institución: ${data.institutionName}

Información importante:
- Asegúrense de estar listos 5 minutos antes
- Tengan materiales de escritura
${data.modality === 'virtual' ? '- El link de Zoom se enviará por separado' : ''}

Saludos,
El equipo de ${data.institutionName}`
    };
  }

  /**
   * Envía un email utilizando la extensión firestore-send-email
   */
  private async sendEmail(to: string, template: EmailTemplate): Promise<void> {
    try {
      // Verificar autenticación antes de proceder
      if (!this.auth.currentUser) {
        throw new Error('Usuario no autenticado - no se puede enviar email');
      }

      console.log('🔄 Iniciando envío de email...', {
        destinatario: to,
        asunto: template.subject,
        usuarioAutenticado: this.auth.currentUser.uid,
        email: this.auth.currentUser.email
      });

      const mailCollection = collection(this.firestore, 'mail');
      console.log('📁 Colección mail obtenida');
      
      const emailDoc = {
        to: [to],
        message: {
          subject: template.subject,
          html: template.html,
          text: template.text || ''
        },
        // Agregar timestamp para debugging
        created: new Date().toISOString(),
        // Agregar información del remitente autenticado
        from_uid: this.auth.currentUser.uid,
        from_email: this.auth.currentUser.email,
        // Agregar estado inicial
        delivery: {
          state: 'PENDING',
          attempts: 0
        }
      };

      console.log('📧 Documento de email preparado:', {
        to: emailDoc.to,
        subject: emailDoc.message.subject,
        from_uid: emailDoc.from_uid,
        from_email: emailDoc.from_email,
        hasHtml: !!emailDoc.message.html,
        hasText: !!emailDoc.message.text
      });

      const docRef = await addDoc(mailCollection, emailDoc);
      console.log('✅ Email document creado exitosamente con ID:', docRef.id);
      console.log(`📬 Email enviado exitosamente a: ${to}`);
      
    } catch (error: unknown) {
      const errorObj = error as { message?: string; code?: string; stack?: string };
      
      console.error('❌ Error detallado enviando email:', {
        error: error,
        message: errorObj?.message,
        code: errorObj?.code,
        destinatario: to,
        usuarioAutenticado: this.auth.currentUser?.uid || 'NO_AUTH',
        emailAuth: this.auth.currentUser?.email || 'NO_EMAIL',
        stack: errorObj?.stack
      });

      // Proporcionar más contexto sobre el error
      let errorMessage = `Error al enviar email a ${to}`;
      
      if (errorObj?.code === 'permission-denied') {
        errorMessage += ': Permisos insuficientes para escribir en la colección mail. Verificar reglas de Firestore.';
      } else if (errorObj?.code === 'unauthenticated') {
        errorMessage += ': Usuario no autenticado. Iniciar sesión antes de enviar emails.';
      } else if (errorObj?.message?.includes('no autenticado')) {
        errorMessage += ': Sesión no válida. Volver a iniciar sesión.';
      } else if (errorObj?.message) {
        errorMessage += `: ${errorObj.message}`;
      }
      
      throw new Error(errorMessage);
    }
  }
}
