# Servicio de Meta Tags - My Tutors

## Descripción
El `MetaService` es un servicio Angular que facilita la gestión de meta tags, título de página y tags de Open Graph/Twitter Card para mejorar el SEO y la presentación en redes sociales.

## Características

- ✅ Gestión del título de la página
- ✅ Meta tags básicas (description, keywords, author, robots)
- ✅ Open Graph tags para redes sociales
- ✅ Twitter Card tags
- ✅ URLs canónicas
- ✅ Limpieza automática de meta tags
- ✅ Constantes predefinidas para páginas comunes

## Instalación y Configuración

El servicio ya está configurado y exportado en `src/app/services/index.ts`. Para usarlo en un componente:

```typescript
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { MetaService } from '../services/meta.service';
import { generatePageMetaTags } from '../constants/meta.constants';

@Component({
  // ...
})
export class MyComponent implements OnInit, OnDestroy {
  private metaService = inject(MetaService);

  ngOnInit(): void {
    this.setMetaTags();
  }

  ngOnDestroy(): void {
    this.metaService.clearMetaTags();
  }

  private setMetaTags(): void {
    // Opción 1: Usar constantes predefinidas
    const metaData = generatePageMetaTags('TUTOR_POSTULATE');
    this.metaService.setAllMetaTags(metaData);

    // Opción 2: Configuración manual
    this.metaService.setAllMetaTags({
      title: 'Mi Página - My Tutors',
      description: 'Descripción de mi página',
      keywords: 'palabra1, palabra2, palabra3',
      author: 'My Tutors',
      robots: 'index, follow',
      canonicalUrl: 'https://my-tutors.com/mi-pagina',
      openGraph: {
        title: 'Mi Página - My Tutors',
        description: 'Descripción para redes sociales',
        type: 'website',
        url: 'https://my-tutors.com/mi-pagina',
        image: 'https://my-tutors.com/assets/images/mi-imagen.jpg'
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Mi Página - My Tutors',
        description: 'Descripción para Twitter',
        image: 'https://my-tutors.com/assets/images/mi-imagen.jpg'
      }
    });
  }
}
```

## Métodos Disponibles

### `setTitle(title: string)`
Establece el título de la página.

### `setDescription(description: string)`
Establece la meta tag description.

### `setKeywords(keywords: string)`
Establece las palabras clave de la página.

### `setOpenGraphTags(data: OpenGraphData)`
Configura las meta tags de Open Graph para redes sociales.

### `setTwitterCardTags(data: TwitterCardData)`
Configura las meta tags de Twitter Card.

### `setCanonicalUrl(url: string)`
Establece la URL canónica de la página.

### `setRobotsTags(robots: string)`
Configura las instrucciones para robots de búsqueda.

### `setAllMetaTags(metaData: CompleteMetaData)`
Configura todas las meta tags de una vez.

### `clearMetaTags()`
Limpia todas las meta tags dinámicas. **Importante**: Llamar este método en `ngOnDestroy()`.

## Constantes Predefinidas

El archivo `meta.constants.ts` contiene configuraciones predefinidas para las páginas principales:

- `TUTOR_POSTULATE`: Página de postulación para tutores
- `INSTITUTION_DIAGNOSIS`: Página de diagnóstico para instituciones
- `HOME`: Página principal
- `STUDENT_REGISTER`: Registro de estudiantes
- `INSTITUTION_REGISTER`: Registro de instituciones

### Usar constantes predefinidas:

```typescript
import { generatePageMetaTags } from '../constants/meta.constants';

// En el componente
private setMetaTags(): void {
  const metaData = generatePageMetaTags('TUTOR_POSTULATE');
  this.metaService.setAllMetaTags(metaData);
}
```

### Personalizar constantes predefinidas:

```typescript
private setMetaTags(): void {
  const metaData = generatePageMetaTags('TUTOR_POSTULATE', {
    title: 'Título personalizado',
    description: 'Descripción personalizada'
  });
  this.metaService.setAllMetaTags(metaData);
}
```

## Mejores Prácticas

1. **Siempre implementar OnDestroy**: Para limpiar las meta tags cuando el componente se destruye.

2. **Usar constantes predefinidas**: Para mantener consistencia en las meta tags.

3. **Títulos descriptivos**: Máximo 60 caracteres para evitar truncamiento en resultados de búsqueda.

4. **Descripciones efectivas**: Entre 120-160 caracteres para óptimo SEO.

5. **Imágenes optimizadas**: 1200x630px para Open Graph, URLs absolutas.

6. **URLs canónicas**: Siempre especificar para evitar contenido duplicado.

## Ejemplo Completo

```typescript
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { MetaService } from '../services/meta.service';
import { generatePageMetaTags } from '../constants/meta.constants';

@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrl: './example.component.scss'
})
export class ExampleComponent implements OnInit, OnDestroy {
  private metaService = inject(MetaService);

  ngOnInit(): void {
    this.setMetaTags();
  }

  ngOnDestroy(): void {
    // Importante: Limpiar meta tags al destruir el componente
    this.metaService.clearMetaTags();
  }

  private setMetaTags(): void {
    const metaData = generatePageMetaTags('TUTOR_POSTULATE', {
      // Personalizaciones opcionales
      title: 'Título específico para esta instancia'
    });
    
    this.metaService.setAllMetaTags(metaData);
  }
}
```

## Resultados Esperados

Al implementar correctamente este servicio, verás:

- **Mejores resultados en buscadores**: Títulos y descripciones optimizadas
- **Mejores previews en redes sociales**: Open Graph y Twitter Cards funcionando
- **SEO mejorado**: URLs canónicas y meta tags estructuradas
- **Experiencia consistente**: Uso de constantes predefinidas

## Troubleshooting

### Las meta tags no aparecen
- Verifica que estás llamando `setMetaTags()` en `ngOnInit()`
- Asegúrate de que las rutas de importación sean correctas

### Las imágenes no aparecen en redes sociales
- Usa URLs absolutas para las imágenes
- Verifica que las imágenes sean accesibles públicamente
- Tamaño recomendado: 1200x630px

### Contenido duplicado en buscadores
- Siempre configura URLs canónicas
- Usa `robots: "noindex, nofollow"` para páginas que no deben indexarse
