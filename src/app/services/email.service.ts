import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

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
  startTime: string;
  duration: number;
  students: Array<{
    name: string;
    age: number;
    level: string;
  }>;
  modality: string;
  location?: string;
  totalPayment?: number;
  currency?: string;
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
   * Genera el template HTML para el email de bienvenida del tutor
   */
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
              <p><strong>Fecha:</strong> ${data.classDate}</p>
              <p><strong>Hora de inicio:</strong> ${data.startTime}</p>
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
Fecha: ${data.classDate}
Hora: ${data.startTime}
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
      const mailCollection = collection(this.firestore, 'mail');
      
      await addDoc(mailCollection, {
        to: [to],
        message: {
          subject: template.subject,
          html: template.html,
          text: template.text
        }
      });
      
      console.log(`Email enviado exitosamente a: ${to}`);
    } catch (error) {
      console.error('Error enviando email:', error);
      throw new Error(`Error al enviar email a ${to}`);
    }
  }
}
