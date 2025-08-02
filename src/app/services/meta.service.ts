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
  }): void {
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:type', content: data.type || 'website' });
    
    if (data.image) {
      this.meta.updateTag({ property: 'og:image', content: data.image });
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
    };
    twitter?: {
      title: string;
      description: string;
      image?: string;
      card?: string;
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
      'og:title',
      'og:description',
      'og:type',
      'og:image',
      'og:url',
      'twitter:card',
      'twitter:title',
      'twitter:description',
      'twitter:image'
    ];

    tagsToRemove.forEach(tag => {
      if (tag.startsWith('og:')) {
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
