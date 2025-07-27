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
   * Genera el template HTML para el email de bienvenida del tutor
   */
  private generateTutorWelcomeTemplate(data: WelcomeEmailData): EmailTemplate {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: #fff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
          .important { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a My Tutors!</h1>
            <p>Tu cuenta de tutor ha sido creada exitosamente</p>
          </div>
          
          <div class="content">
            <h2>Hola ${data.tutorName},</h2>
            
            <p>¡Bienvenido al equipo de tutores de <strong>${data.institutionName}</strong>! Tu cuenta ha sido creada y ya puedes comenzar a usar la plataforma.</p>
            
            <div class="credentials">
              <h3>🔐 Tus credenciales de acceso</h3>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Contraseña temporal:</strong> <code style="background: #f1f1f1; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${data.temporaryPassword}</code></p>
            </div>
            
            <div class="important">
              <h3>⚠️ Importante</h3>
              <p>Esta es una contraseña temporal que deberás cambiar en tu primer inicio de sesión. Por seguridad, te recomendamos crear una contraseña única y segura.</p>
            </div>
            
            <h3>📝 Próximos pasos:</h3>
            <ol>
              <li>Haz clic en el botón de abajo para acceder a la plataforma</li>
              <li>Inicia sesión con las credenciales proporcionadas</li>
              <li>Cambia tu contraseña temporal por una permanente</li>
              <li>Completa tu perfil de tutor</li>
              <li>Configura tu disponibilidad</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" class="button">Acceder a My Tutors</a>
            </div>
            <!--
            <h3>🎯 ¿Qué puedes hacer en la plataforma?</h3>
            <ul>
              <li>Gestionar tu perfil y experiencia</li>
              <li>Configurar tu disponibilidad y tarifas</li>
              <li>Conectar con estudiantes</li>
              <li>Programar y gestionar clases</li>
              <li>Recibir pagos de forma segura</li>
            </ul> -->
            
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. ¡Estamos aquí para apoyarte!</p>
            
            <div class="footer">
              <p>Saludos cordiales,<br>
              <strong>El equipo de My Tutors</strong></p>
              <p style="font-size: 12px; color: #999;">
                Este email fue enviado automáticamente. Si tienes problemas para acceder, contacta a tu administrador.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return {
      subject: `¡Bienvenido a My Tutors! - Credenciales de acceso`,
      html,
      text: `¡Bienvenido a My Tutors, ${data.tutorName}!

Tu cuenta de tutor ha sido creada exitosamente en ${data.institutionName}.

Credenciales de acceso:
Email: ${data.email}
Contraseña temporal: ${data.temporaryPassword}

IMPORTANTE: Esta es una contraseña temporal que deberás cambiar en tu primer inicio de sesión.

Accede a la plataforma: ${data.loginUrl}

¡Estamos emocionados de tenerte en nuestro equipo!

Saludos,
El equipo de My Tutors`
    };
  }

  /**
   * Genera el template HTML para el email de bienvenida del estudiante
   */
  private generateStudentWelcomeTemplate(data: StudentWelcomeEmailData): EmailTemplate {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: #fff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
          .important { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a My Tutors!</h1>
            <p>Tu cuenta de estudiante ha sido creada exitosamente</p>
          </div>
          
          <div class="content">
            <h2>Hola ${data.studentName},</h2>
            
            <p>¡Bienvenido a <strong>${data.institutionName}</strong>! Tu cuenta de estudiante ha sido creada y ya puedes comenzar tu experiencia de aprendizaje.</p>
            
            <div class="credentials">
              <h3>🔐 Tus credenciales de acceso</h3>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Contraseña temporal:</strong> <code style="background: #f1f1f1; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${data.temporaryPassword}</code></p>
            </div>
            
            <div class="important">
              <h3>⚠️ Importante</h3>
              <p>Esta es una contraseña temporal que deberás cambiar en tu primer inicio de sesión. Por seguridad, te recomendamos crear una contraseña única y segura.</p>
            </div>
            
            <h3>📚 Próximos pasos:</h3>
            <ol>
              <li>Haz clic en el botón de abajo para acceder a la plataforma</li>
              <li>Inicia sesión con las credenciales proporcionadas</li>
              <li>Cambia tu contraseña temporal por una permanente</li>
              <li>Completa tu perfil de estudiante</li>
              <li>Explora los tutores disponibles</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" class="button">Acceder a My Tutors</a>
            </div>
            
            <!-- <h3>📖 ¿Qué puedes hacer en la plataforma?</h3>
            <ul>
              <li>Gestionar tu perfil y metas de aprendizaje</li>
              <li>Buscar y conectar con tutores especializados</li>
              <li>Programar clases individuales</li>
              <li>Hacer seguimiento de tu progreso</li>
              <li>Acceder a materiales de estudio</li>
            </ul> -->
            
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. ¡Estamos aquí para apoyarte en tu proceso de aprendizaje!</p>
            
            <div class="footer">
              <p>Saludos cordiales,<br>
              <strong>El equipo de My Tutors</strong></p>
              <p style="font-size: 12px; color: #999;">
                Este email fue enviado automáticamente. Si tienes problemas para acceder, contacta a tu administrador.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return {
      subject: `¡Bienvenido a My Tutors! - Credenciales de acceso`,
      html,
      text: `¡Bienvenido a My Tutors, ${data.studentName}!

Tu cuenta de estudiante ha sido creada exitosamente en ${data.institutionName}.

Credenciales de acceso:
Email: ${data.email}
Contraseña temporal: ${data.temporaryPassword}

IMPORTANTE: Esta es una contraseña temporal que deberás cambiar en tu primer inicio de sesión.

Accede a la plataforma: ${data.loginUrl}

¡Estamos emocionados de acompañarte en tu proceso de aprendizaje!

Saludos,
El equipo de My Tutors`
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
