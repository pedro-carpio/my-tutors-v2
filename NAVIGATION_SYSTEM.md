# Sistema de Navegación con Roles y Traducciones

## Descripción

El sistema de navegación ha sido actualizado para incluir:
1. **Control de acceso basado en roles**: Los elementos del menú se muestran según el rol del usuario
2. **Soporte multiidioma**: Todos los elementos pueden ser traducidos dinámicamente
3. **Gestión automática**: El menú se actualiza automáticamente cuando cambia el rol o idioma

## Roles Disponibles

- `student`: Estudiante
- `tutor`: Tutor/Profesor
- `institution`: Institución educativa
- `admin`: Administrador del sistema

## Estructura de Navegación

### Elementos por Rol

#### Dashboard (Todos los roles)
- **Home**: Página principal accesible para todos

#### Estudiante (`student`)
- **My Classes**: Ver clases reservadas
- **Find Tutors**: Buscar y contratar tutores

#### Tutor (`tutor`)
- **My Students**: Gestionar estudiantes
- **Availability**: Configurar disponibilidad

#### Institución (`institution`)
- **Manage Tutors**: Gestionar tutores afiliados
- **Manage Students**: Gestionar estudiantes

#### Administrador (`admin`)
- **User Management**: Gestión completa de usuarios
- **System Settings**: Configuración del sistema

## Uso de la Funcionalidad

### En el Componente Layout

```typescript
// El menú se filtra automáticamente basado en el rol del usuario
export class LayoutComponent implements OnInit, OnDestroy {
  currentUserRole: UserRole | null = null;
  filteredMenu: Navigation[] = [];

  ngOnInit(): void {
    // Se suscribe a cambios del usuario autenticado
    // Obtiene el rol del usuario y filtra el menú automáticamente
  }
}
```

### Configuración de Elementos de Navegación

```typescript
// Ejemplo de configuración con roles y traducciones
{
  title: 'navigation.student',           // Clave de traducción
  translationKey: 'navigation.student', // Clave explícita
  type: 'group',
  roles: ['student'],                    // Solo visible para estudiantes
  children: [
    {
      title: 'navigation.myClasses',
      translationKey: 'navigation.myClasses',
      type: 'item',
      url: '/student/classes',
      matIcon: 'class',
      roles: ['student']
    }
  ]
}
```

### Agregar Nuevos Elementos

Para agregar un nuevo elemento al menú:

1. **Actualizar el menú en `layout.component.ts`**:
```typescript
{
  title: 'navigation.newFeature',
  translationKey: 'navigation.newFeature',
  type: 'item',
  url: '/new-feature',
  matIcon: 'new_releases',
  roles: ['tutor', 'admin'] // Roles que pueden ver este elemento
}
```

2. **Agregar traducciones en `i18n.service.ts`**:
```typescript
// Español
navigation: {
  newFeature: 'Nueva Funcionalidad'
}

// Inglés
navigation: {
  newFeature: 'New Feature'
}
```

## Características del Sistema

### Control de Acceso
- **Automático**: El filtrado se hace automáticamente al cargar el componente
- **Reactivo**: Se actualiza inmediatamente cuando cambia el rol del usuario
- **Seguro**: Los elementos sin rol definido son visibles para todos

### Traducciones
- **Dinámicas**: Cambian inmediatamente al cambiar idioma
- **Fallback**: Si no existe traducción, muestra el título original
- **Cacheadas**: Las traducciones se mantienen en memoria para mejor rendimiento

### Cambio de Idioma
- **Botón integrado**: Botón en la barra de navegación
- **Persistente**: El idioma seleccionado se guarda en localStorage
- **Global**: Afecta toda la aplicación

## Extensiones Futuras

### Roles Jerárquicos
Posibilidad de implementar roles con jerarquía donde un admin puede ver elementos de otros roles.

### Permisos Granulares
Además de roles, se podrían agregar permisos específicos para funcionalidades particulares.

### Navegación Contextual
Menús que cambien según la sección actual de la aplicación.

## Métodos Principales

### `filterMenuByRole()`
Filtra el menú completo basado en el rol del usuario actual.

### `hasAccess(item, userRole)`
Verifica si un usuario con un rol específico puede acceder a un elemento.

### `getTranslatedTitle(item)`
Obtiene el título traducido de un elemento de navegación.

### `changeLanguage()`
Alterna entre español e inglés.

## Consideraciones Técnicas

- El componente se suscribe a cambios de autenticación y rol
- Las suscripciones se limpian automáticamente al destruir el componente
- El filtrado es reactivo y eficiente
- Las traducciones usan el pipe `translate` para actualizaciones automáticas
