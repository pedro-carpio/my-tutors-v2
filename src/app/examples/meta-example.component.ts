import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MetaService } from '../services/meta.service';
import { 
  generatePlatformOptimizedMetaTags, 
  generateMarketingCampaignMetaTags,
  generateWhatsAppMetaTags,
  generateFacebookMetaTags
} from '../constants/meta.constants';

/**
 * Ejemplo de componente que muestra cómo usar las meta tags optimizadas
 * para diferentes plataformas de Meta (Facebook, Instagram, WhatsApp)
 */
@Component({
  selector: 'app-meta-example',
  template: `
    <div class="container">
      <h1>Ejemplo de Meta Tags Optimizadas</h1>
      <p>Este componente demuestra cómo configurar meta tags para diferentes plataformas.</p>
      
      <div class="platform-buttons">
        <button (click)="setMetaForPlatform('facebook')">
          📘 Optimizar para Facebook
        </button>
        <button (click)="setMetaForPlatform('instagram')">
          📸 Optimizar para Instagram
        </button>
        <button (click)="setMetaForPlatform('whatsapp')">
          💬 Optimizar para WhatsApp
        </button>
        <button (click)="setMetaForCampaign()">
          🎯 Configurar para Campaña
        </button>
      </div>
      
      <div class="current-config">
        <h3>Configuración actual:</h3>
        <p><strong>Plataforma:</strong> {{ currentPlatform }}</p>
        <p><strong>Título:</strong> {{ currentTitle }}</p>
        <p><strong>Descripción:</strong> {{ currentDescription }}</p>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .platform-buttons {
      display: flex;
      gap: 10px;
      margin: 20px 0;
      flex-wrap: wrap;
    }
    
    .platform-buttons button {
      padding: 10px 15px;
      border: none;
      border-radius: 5px;
      background-color: #1877f2;
      color: white;
      cursor: pointer;
      font-size: 14px;
    }
    
    .platform-buttons button:hover {
      background-color: #166fe5;
    }
    
    .current-config {
      margin-top: 30px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 5px;
    }
  `]
})
export class MetaExampleComponent implements OnInit, OnDestroy {
  private metaService = inject(MetaService);
  private route = inject(ActivatedRoute);
  
  currentPlatform = 'general';
  currentTitle = '';
  currentDescription = '';

  ngOnInit(): void {
    // Detectar si viene de una plataforma específica por query params
    this.route.queryParams.subscribe(params => {
      const platform = params['platform'];
      const campaign = params['campaign'];
      
      if (campaign) {
        this.setMetaForCampaign();
      } else if (platform) {
        this.setMetaForPlatform(platform);
      } else {
        this.setMetaForPlatform('facebook'); // Por defecto
      }
    });
  }

  ngOnDestroy(): void {
    this.metaService.clearMetaTags();
  }

  /**
   * Configura meta tags optimizadas para una plataforma específica
   */
  setMetaForPlatform(platform: 'facebook' | 'instagram' | 'whatsapp' | 'general'): void {
    this.currentPlatform = platform;
    
    const metaData = generatePlatformOptimizedMetaTags('TUTOR_POSTULATE', platform);
    
    this.currentTitle = metaData.title;
    this.currentDescription = metaData.description;
    
    this.metaService.setAllMetaTags(metaData);
    
    console.log(`Meta tags configuradas para ${platform}:`, metaData);
  }

  /**
   * Configura meta tags para una campaña de marketing específica
   */
  setMetaForCampaign(): void {
    this.currentPlatform = 'campaña de marketing';
    
    const campaignData = {
      campaignName: 'Campaña Tutores Verano 2025',
      campaignSource: 'facebook' as const,
      utmParams: {
        source: 'facebook',
        medium: 'social',
        campaign: 'tutores_verano_2025',
        content: 'post_organico'
      }
    };
    
    const metaData = generateMarketingCampaignMetaTags(
      'TUTOR_POSTULATE',
      campaignData,
      {
        title: '🌞 Enseña idiomas este verano - Campaña Especial',
        description: '¡Aprovecha el verano para generar ingresos extra! Únete a nuestra campaña especial para tutores. 🏖️📚'
      }
    );
    
    this.currentTitle = metaData.title;
    this.currentDescription = metaData.description;
    
    this.metaService.setAllMetaTags(metaData);
    
    console.log('Meta tags configuradas para campaña:', metaData);
  }

  /**
   * Ejemplo de uso específico para WhatsApp
   */
  setWhatsAppOptimized(): void {
    const whatsappMeta = generateWhatsAppMetaTags('TUTOR_POSTULATE', {
      title: '📚 My Tutors - Enseña y gana',
      description: 'Horarios flexibles, pagos seguros. ¡Postúlate ya!'
    });
    
    this.metaService.setWhatsAppTags(whatsappMeta);
    console.log('Meta tags optimizadas para WhatsApp:', whatsappMeta);
  }

  /**
   * Ejemplo de uso específico para Facebook
   */
  setFacebookOptimized(): void {
    const facebookMeta = generateFacebookMetaTags('TUTOR_POSTULATE', {
      title: '🎓 Enseña idiomas desde casa - My Tutors',
      description: 'Únete a nuestra comunidad de tutores. Gana dinero enseñando lo que más te gusta. ¡Sin horarios fijos!',
      appId: '1234567890', // Tu Facebook App ID
      imageAlt: 'Tutor enseñando idiomas online desde casa'
    });
    
    this.metaService.setMetaPlatformTags(facebookMeta);
    console.log('Meta tags optimizadas para Facebook:', facebookMeta);
  }
}
