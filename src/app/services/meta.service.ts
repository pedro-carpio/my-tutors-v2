import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class MetaService {
  private meta = inject(Meta);
  private title = inject(Title);

  /**
   * Establece el título de la página
   */
  setTitle(title: string): void {
    this.title.setTitle(title);
  }

  /**
   * Establece la descripción de la página
   */
  setDescription(description: string): void {
    this.meta.updateTag({ name: 'description', content: description });
  }

  /**
   * Establece las palabras clave de la página
   */
  setKeywords(keywords: string): void {
    this.meta.updateTag({ name: 'keywords', content: keywords });
  }

  /**
   * Establece las meta tags de Open Graph para redes sociales
   */
  setOpenGraphTags(data: {
    title: string;
    description: string;
    image?: string;
    url?: string;
    type?: string;
    siteName?: string;
    locale?: string;
    imageAlt?: string;
    imageWidth?: string;
    imageHeight?: string;
  }): void {
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:type', content: data.type || 'website' });
    
    if (data.siteName) {
      this.meta.updateTag({ property: 'og:site_name', content: data.siteName });
    }
    
    if (data.locale) {
      this.meta.updateTag({ property: 'og:locale', content: data.locale });
    }
    
    if (data.image) {
      this.meta.updateTag({ property: 'og:image', content: data.image });
      
      if (data.imageAlt) {
        this.meta.updateTag({ property: 'og:image:alt', content: data.imageAlt });
      }
      
      if (data.imageWidth) {
        this.meta.updateTag({ property: 'og:image:width', content: data.imageWidth });
      }
      
      if (data.imageHeight) {
        this.meta.updateTag({ property: 'og:image:height', content: data.imageHeight });
      }
    }
    
    if (data.url) {
      this.meta.updateTag({ property: 'og:url', content: data.url });
    }
  }

  /**
   * Establece las meta tags de Twitter Card
   */
  setTwitterCardTags(data: {
    title: string;
    description: string;
    image?: string;
    card?: string;
  }): void {
    this.meta.updateTag({ name: 'twitter:card', content: data.card || 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.description });
    
    if (data.image) {
      this.meta.updateTag({ name: 'twitter:image', content: data.image });
    }
  }

  /**
   * Establece meta tags específicas para Facebook
   */
  setFacebookTags(data: {
    appId?: string;
    admins?: string;
    pages?: string;
  }): void {
    if (data.appId) {
      this.meta.updateTag({ property: 'fb:app_id', content: data.appId });
    }
    
    if (data.admins) {
      this.meta.updateTag({ property: 'fb:admins', content: data.admins });
    }
    
    if (data.pages) {
      this.meta.updateTag({ property: 'fb:pages', content: data.pages });
    }
  }

  /**
   * Establece meta tags específicas para WhatsApp
   */
  setWhatsAppTags(data: {
    title: string;
    description: string;
    image?: string;
    url?: string;
  }): void {
    // WhatsApp usa principalmente Open Graph, pero podemos optimizar para WhatsApp
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    
    if (data.image) {
      this.meta.updateTag({ property: 'og:image', content: data.image });
      // WhatsApp prefiere imágenes cuadradas o 1.91:1
      this.meta.updateTag({ property: 'og:image:width', content: '1200' });
      this.meta.updateTag({ property: 'og:image:height', content: '630' });
    }
    
    if (data.url) {
      this.meta.updateTag({ property: 'og:url', content: data.url });
    }
  }

  /**
   * Establece meta tags completas para Meta platforms (Facebook, Instagram, WhatsApp)
   */
  setMetaPlatformTags(data: {
    title: string;
    description: string;
    image?: string;
    url?: string;
    type?: string;
    siteName?: string;
    locale?: string;
    imageAlt?: string;
    facebookAppId?: string;
    facebookAdmins?: string;
    facebookPages?: string;
  }): void {
    // Open Graph tags (usado por Facebook, Instagram, WhatsApp)
    this.setOpenGraphTags({
      title: data.title,
      description: data.description,
      image: data.image,
      url: data.url,
      type: data.type || 'website',
      siteName: data.siteName,
      locale: data.locale,
      imageAlt: data.imageAlt,
      imageWidth: '1200',
      imageHeight: '630'
    });

    // Facebook específico
    if (data.facebookAppId || data.facebookAdmins || data.facebookPages) {
      this.setFacebookTags({
        appId: data.facebookAppId,
        admins: data.facebookAdmins,
        pages: data.facebookPages
      });
    }

    // Meta tags adicionales para mejor compatibilidad
    this.meta.updateTag({ name: 'theme-color', content: '#1877f2' }); // Color de Facebook
    this.meta.updateTag({ name: 'msapplication-TileColor', content: '#1877f2' });
  }

  /**
   * Establece meta tags canónicas
   */
  setCanonicalUrl(url: string): void {
    // Primero remover cualquier link canónico existente
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Crear nuevo link canónico
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    document.head.appendChild(link);
  }

  /**
   * Establece meta tags de robots
   */
  setRobotsTags(robots: string): void {
    this.meta.updateTag({ name: 'robots', content: robots });
  }

  /**
   * Establece meta tags de autor
   */
  setAuthor(author: string): void {
    this.meta.updateTag({ name: 'author', content: author });
  }

  /**
   * Establece todas las meta tags de una vez
   */
  setAllMetaTags(metaData: {
    title: string;
    description: string;
    keywords?: string;
    author?: string;
    robots?: string;
    canonicalUrl?: string;
    openGraph?: {
      title: string;
      description: string;
      image?: string;
      url?: string;
      type?: string;
      siteName?: string;
      locale?: string;
      imageAlt?: string;
    };
    twitter?: {
      title: string;
      description: string;
      image?: string;
      card?: string;
    };
    meta?: {
      title: string;
      description: string;
      image?: string;
      url?: string;
      type?: string;
      siteName?: string;
      locale?: string;
      imageAlt?: string;
      facebookAppId?: string;
      facebookAdmins?: string;
      facebookPages?: string;
    };
  }): void {
    // Título de la página
    this.setTitle(metaData.title);
    
    // Meta tags básicas
    this.setDescription(metaData.description);
    
    if (metaData.keywords) {
      this.setKeywords(metaData.keywords);
    }
    
    if (metaData.author) {
      this.setAuthor(metaData.author);
    }
    
    if (metaData.robots) {
      this.setRobotsTags(metaData.robots);
    }
    
    if (metaData.canonicalUrl) {
      this.setCanonicalUrl(metaData.canonicalUrl);
    }
    
    // Open Graph tags
    if (metaData.openGraph) {
      this.setOpenGraphTags(metaData.openGraph);
    }
    
    // Twitter Card tags
    if (metaData.twitter) {
      this.setTwitterCardTags(metaData.twitter);
    }

    // Meta Platform tags (Facebook, Instagram, WhatsApp)
    if (metaData.meta) {
      this.setMetaPlatformTags(metaData.meta);
    }
  }

  /**
   * Limpia todas las meta tags dinámicas
   */
  clearMetaTags(): void {
    const tagsToRemove = [
      'description',
      'keywords',
      'author',
      'robots',
      'theme-color',
      'msapplication-TileColor',
      'og:title',
      'og:description',
      'og:type',
      'og:image',
      'og:image:alt',
      'og:image:width',
      'og:image:height',
      'og:url',
      'og:site_name',
      'og:locale',
      'fb:app_id',
      'fb:admins',
      'fb:pages',
      'twitter:card',
      'twitter:title',
      'twitter:description',
      'twitter:image'
    ];

    tagsToRemove.forEach(tag => {
      if (tag.startsWith('og:') || tag.startsWith('fb:')) {
        this.meta.removeTag(`property="${tag}"`);
      } else {
        this.meta.removeTag(`name="${tag}"`);
      }
    });

    // Remover link canónico
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }
  }
}
