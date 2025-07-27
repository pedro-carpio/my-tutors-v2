import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PasswordGeneratorService {
  private words = [
    // Animales graciosos
    'pingüino', 'koala', 'oso', 'gato', 'perro', 'panda', 'nutria', 'alpaca',
    'llama', 'capibara', 'perezoso', 'mapache', 'ardilla', 'conejo', 'hamster',
    
    // Comidas divertidas
    'pizza', 'taco', 'donut', 'galleta', 'pastel', 'helado', 'chocolate', 'café',
    'banana', 'mango', 'kiwi', 'aguacate', 'sandwich', 'burrito', 'quesadilla',
    
    // Objetos cotidianos
    'sombrilla', 'calcetín', 'almohada', 'bicicleta', 'globo', 'guitarra', 'piano',
    'libro', 'lápiz', 'teclado', 'ratón', 'ventana', 'puerta', 'escalera', 'silla',
    
    // Colores y formas
    'azul', 'verde', 'amarillo', 'rojo', 'morado', 'rosa', 'naranja', 'círculo',
    'cuadrado', 'triángulo', 'estrella', 'corazón', 'luna', 'sol', 'nube',
    
    // Actividades divertidas
    'bailar', 'cantar', 'saltar', 'correr', 'nadar', 'volar', 'jugar', 'reír',
    'sonreír', 'abrazar', 'cocinar', 'dibujar', 'pintar', 'leer', 'escribir',
    
    // Adjetivos divertidos
    'feliz', 'alegre', 'divertido', 'genial', 'fantástico', 'increíble', 'mágico',
    'brillante', 'colorido', 'suave', 'esponjoso', 'gigante', 'pequeño', 'rápido',
    
    // Números y elementos adicionales
    'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'
  ];

  /**
   * Genera una contraseña temporal usando 3 palabras aleatorias de la lista
   * @returns string - Contraseña temporal en formato "palabra1-palabra2-palabra3"
   */
  generateTemporaryPassword(): string {
    const selectedWords: string[] = [];
    const availableWords = [...this.words]; // Copia para evitar repeticiones
    
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * availableWords.length);
      selectedWords.push(availableWords[randomIndex]);
      availableWords.splice(randomIndex, 1); // Remover para evitar duplicados
    }
    
    return selectedWords.join('-');
  }

  /**
   * Genera múltiples contraseñas temporales (útil para testing)
   * @param count - Número de contraseñas a generar
   * @returns string[] - Array de contraseñas temporales
   */
  generateMultiplePasswords(count: number = 5): string[] {
    const passwords: string[] = [];
    for (let i = 0; i < count; i++) {
      passwords.push(this.generateTemporaryPassword());
    }
    return passwords;
  }

  /**
   * Valida si una contraseña sigue el formato de contraseña temporal
   * @param password - Contraseña a validar
   * @returns boolean - true si es formato válido
   */
  isTemporaryPasswordFormat(password: string): boolean {
    const parts = password.split('-');
    return parts.length === 3 && parts.every(part => this.words.includes(part));
  }
}
