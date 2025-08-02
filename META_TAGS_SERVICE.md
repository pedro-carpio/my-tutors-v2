# Servicio de Meta Tags con Soporte para Meta Platforms - My Tutors

## Descripción
El `MetaService` es un servicio Angular que facilita la gestión de meta tags, título de página y tags especializados para Meta platforms (Facebook, Instagram, WhatsApp), además de Twitter Cards y SEO general.

## Características

- ✅ Gestión del título de la página
- ✅ Meta tags básicas (description, keywords, author, robots)
- ✅ Open Graph tags para redes sociales
- ✅ Twitter Card tags
- ✅ **Meta Platform Tags específicas (Facebook, Instagram, WhatsApp)**
- ✅ **Optimización por plataforma con emojis y hashtags**
- ✅ **Configuración de campañas de marketing con UTM**
- ✅ URLs canónicas para SEO
- ✅ Limpieza automática de meta tags
- ✅ Constantes predefinidas para páginas comunesMeta Tags - My Tutors

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
import { generatePlatformOptimizedMetaTags } from '../constants/meta.constants';

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
    // ✨ NUEVO: Usar meta tags optimizadas por plataforma
    const metaData = generatePlatformOptimizedMetaTags('TUTOR_POSTULATE', 'facebook');
    this.metaService.setAllMetaTags(metaData);

    // Opción 2: Configuración manual con Meta platform
    this.metaService.setAllMetaTags({
      title: 'Mi Página - My Tutors',
      description: 'Descripción de mi página',
      keywords: 'palabra1, palabra2, palabra3',
      // ... otras configuraciones
      meta: {
        title: '🎓 Mi Página - My Tutors',
        description: 'Descripción optimizada para Meta con emojis ✨',
        image: 'https://mytutors.click/images/mi-imagen.jpg',
        url: 'https://mytutors.click/mi-pagina',
        siteName: 'My Tutors',
        locale: 'es_ES',
        imageAlt: 'Descripción de la imagen para Meta',
        facebookAppId: 'tu-facebook-app-id'
      }
    });
  }
}
```

## Métodos Disponibles

### Métodos Básicos

### `setTitle(title: string)`
Establece el título de la página.

### `setDescription(description: string)`
Establece la meta tag description.

### `setKeywords(keywords: string)`
Establece las palabras clave de la página.

### Métodos para Meta Platforms

### `setMetaPlatformTags(data: MetaPlatformData)`
🆕 Configura meta tags completas optimizadas para Meta platforms (Facebook, Instagram, WhatsApp).

### `setFacebookTags(data: FacebookData)`
🆕 Configura meta tags específicas de Facebook (App ID, Admins, Pages).

### `setWhatsAppTags(data: WhatsAppData)`
🆕 Optimiza meta tags específicamente para WhatsApp (imágenes 1.91:1).

### Métodos Generales

### `setOpenGraphTags(data: OpenGraphData)`
Configura las meta tags de Open Graph para redes sociales (ahora con más opciones).

### `setTwitterCardTags(data: TwitterCardData)`
Configura las meta tags de Twitter Card.

### `setCanonicalUrl(url: string)`
Establece la URL canónica de la página.

### `setRobotsTags(robots: string)`
Configura las instrucciones para robots de búsqueda.

### `setAllMetaTags(metaData: CompleteMetaData)`
Configura todas las meta tags de una vez (ahora incluye meta platforms).

### `clearMetaTags()`
Limpia todas las meta tags dinámicas. **Importante**: Llamar este método en `ngOnDestroy()`.

## Nuevas Funcionalidades para Meta Platforms

### 1. Meta Tags Optimizadas por Plataforma

```typescript
import { generatePlatformOptimizedMetaTags } from '../constants/meta.constants';

// Para Facebook (con emojis y descripciones atractivas)
const facebookMeta = generatePlatformOptimizedMetaTags('TUTOR_POSTULATE', 'facebook');

// Para WhatsApp (títulos concisos, descripciones cortas)  
const whatsappMeta = generatePlatformOptimizedMetaTags('TUTOR_POSTULATE', 'whatsapp');

// Para Instagram (incluye hashtags automáticamente)
const instagramMeta = generatePlatformOptimizedMetaTags('TUTOR_POSTULATE', 'instagram');
```

### 2. Campañas de Marketing con UTM

```typescript
import { generateMarketingCampaignMetaTags } from '../constants/meta.constants';

const campaignMeta = generateMarketingCampaignMetaTags(
  'TUTOR_POSTULATE',
  {
    campaignName: 'Campaña Verano 2025',
    campaignSource: 'facebook',
    utmParams: {
      source: 'facebook',
      medium: 'social',
      campaign: 'tutores_verano_2025',
      content: 'post_organico'
    }
  },
  {
    title: '🌞 Campaña especial de verano',
    description: '¡Únete ahora y obtén beneficios exclusivos! ☀️'
  }
);
```

### 3. Meta Tags Específicas por Uso

```typescript
// Solo para Facebook
import { generateFacebookMetaTags } from '../constants/meta.constants';
const fbMeta = generateFacebookMetaTags('TUTOR_POSTULATE', {
  appId: 'tu-facebook-app-id',
  imageAlt: 'Descripción detallada de la imagen'
});

// Solo para WhatsApp
import { generateWhatsAppMetaTags } from '../constants/meta.constants';
const waMeta = generateWhatsAppMetaTags('TUTOR_POSTULATE', {
  title: 'Título conciso para WhatsApp',
  description: 'Descripción corta y directa'
});
```

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
