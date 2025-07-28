# Sistema de Loading Global - My Tutors v2

Este documento explica cómo usar el sistema de loading global implementado en la aplicación.

## Componentes del Sistema

### 1. LoadingService
Servicio central que maneja el estado de loading de toda la aplicación.

```typescript
import { LoadingService } from '../services/loading.service';

// En tu componente o servicio
constructor(private loadingService: LoadingService) {}

// Mostrar loading manualmente
this.loadingService.show();

// Ocultar loading manualmente
this.loadingService.hide();

// Ejecutar función con loading automático
await this.loadingService.executeWithLoading(async () => {
  // Tu código async aquí
  await someAsyncOperation();
});
```

### 2. GlobalLoadingComponent
Componente visual que muestra la pantalla de carga global.

Ya está integrado en `app.component.html` y se muestra automáticamente cuando `LoadingService.isLoading()` es true.

### 3. LoadingInterceptor
Interceptor HTTP que automáticamente muestra loading durante peticiones HTTP.

Se ejecuta automáticamente para todas las peticiones HTTP de la aplicación.

## Formas de Usar el Sistema

### Opción 1: Ejecutar con Loading Automático (Recomendada)

```typescript
import { LoadingService } from '../services/loading.service';

export class MyComponent {
  private loadingService = inject(LoadingService);

  async onButtonClick() {
    await this.loadingService.executeWithLoading(async () => {
      // Tu operación async
      await this.sessionService.login();
      await this.userService.createUser(userData);
    });
  }
}
```

### Opción 2: Control Manual

```typescript
export class MyComponent {
  private loadingService = inject(LoadingService);

  async onButtonClick() {
    this.loadingService.show();
    try {
      await this.sessionService.login();
      await this.userService.createUser(userData);
    } finally {
      this.loadingService.hide();
    }
  }
}
```

### Opción 3: En Templates (para deshabilitar botones)

```html
<button 
  mat-raised-button 
  [disabled]="loadingService.isLoading()"
  (click)="onButtonClick()">
  Procesar
</button>
```

### Opción 4: Usando el Decorador (Avanzado)

```typescript
import { AutoLoading } from '../decorators/loading.decorator';

export class MyService {
  public loadingService = inject(LoadingService);

  @AutoLoading()
  async createUser(userData: User): Promise<void> {
    // Este método automáticamente mostrará loading
    await setDoc(docRef, userData);
  }
}
```

## Ejemplos de Uso por Módulo

### Autenticación (Login/Register)
```typescript
// En LoginComponent
async onEmailLogin() {
  await this.loadingService.executeWithLoading(async () => {
    await this.sessionService.loginWithEmail(email, password);
  });
}
```

### Operaciones CRUD
```typescript
// En cualquier servicio
async saveData(data: any) {
  return this.loadingService.executeWithLoading(async () => {
    return await this.firestore.collection('items').add(data);
  });
}
```

### Navegación con Datos
```typescript
// Al navegar y cargar datos
async navigateToProfile() {
  await this.loadingService.executeWithLoading(async () => {
    const userData = await this.userService.getCurrentUser();
    this.router.navigate(['/profile'], { state: { userData } });
  });
}
```

## Características del Sistema

### 1. Contador de Loading
El servicio usa un contador interno para manejar múltiples operaciones simultáneas:
- `show()` incrementa el contador
- `hide()` decrementa el contador
- Loading se oculta solo cuando el contador llega a 0

### 2. Signal y Observable
Soporta tanto Angular Signals como RxJS Observables:
```typescript
// Con Signals (recomendado para Angular 17+)
isLoading = this.loadingService.isLoading;

// Con Observables
this.loadingService.loading$.subscribe(loading => {
  console.log('Loading state:', loading);
});
```

### 3. Interceptor HTTP Automático
Todas las peticiones HTTP muestran loading automáticamente. No necesitas hacer nada adicional.

### 4. Estilo Responsive
El componente de loading es responsive y funciona en móviles y desktop.

## Personalización

### Cambiar Texto de Loading
Modifica las traducciones en `i18n.service.ts`:
```typescript
common: {
  loading: 'Cargando...' // Español
  loading: 'Loading...'  // Inglés
}
```

### Cambiar Estilo Visual
Modifica `global-loading.component.ts` para cambiar:
- Colores
- Tamaño del spinner
- Animaciones
- Posición

### Deshabilitar en Rutas Específicas
```typescript
// En un componente específico
ngOnInit() {
  // Fuerza ocultar loading si necesario
  this.loadingService.forceHide();
}
```

## Buenas Prácticas

1. **Usa `executeWithLoading`** para la mayoría de casos
2. **Evita loading manual** a menos que necesites control muy específico
3. **No anides llamadas con loading** (el contador se encarga automáticamente)
4. **Usa en operaciones que toman más de 500ms**
5. **Combina con validaciones** antes de mostrar loading

## Ejemplo Completo

```typescript
import { Component, inject } from '@angular/core';
import { LoadingService } from '../services/loading.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-user-profile',
  template: `
    <button 
      mat-raised-button 
      [disabled]="loadingService.isLoading()"
      (click)="saveProfile()">
      {{ loadingService.isLoading() ? 'Guardando...' : 'Guardar Perfil' }}
    </button>
  `
})
export class UserProfileComponent {
  private loadingService = inject(LoadingService);
  private userService = inject(UserService);

  async saveProfile() {
    if (!this.validateForm()) return;

    await this.loadingService.executeWithLoading(async () => {
      // Simular múltiples operaciones
      await this.userService.updateProfile(this.profileData);
      await this.userService.uploadAvatar(this.avatarFile);
      await this.refreshUserData();
      
      this.showSuccessMessage();
    });
  }
}
```

Este sistema proporciona una experiencia de usuario consistente y profesional durante todas las operaciones asíncronas de la aplicación.
