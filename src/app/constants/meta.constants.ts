// Constantes para meta tags comunes de la aplicación
export const META_CONSTANTS = {
  // Información básica del sitio
  SITE_NAME: 'My Tutors',
  SITE_URL: 'https://mytutors.click',
  AUTHOR: 'My Tutors',
  DEFAULT_IMAGE: 'https://mytutors.click/images/default-og-image.jpg',

  // Meta tags por defecto
  DEFAULT_ROBOTS: 'index, follow',
  DEFAULT_TWITTER_CARD: 'summary_large_image',
  
  // Configuración para Meta platforms
  META_CONFIG: {
    FACEBOOK_APP_ID: '', // Agregar tu Facebook App ID aquí
    FACEBOOK_ADMINS: '', // Agregar IDs de administradores de Facebook
    FACEBOOK_PAGES: '', // Agregar ID de página de Facebook
    SITE_NAME: 'My Tutors',
    DEFAULT_LOCALE: 'es_ES',
    DEFAULT_IMAGE_ALT: 'My Tutors - Plataforma de educación de idiomas'
  },
  
  // Páginas específicas
  PAGES: {
    TUTOR_POSTULATE: {
      title: 'Enseña idiomas y gana dinero - My Tutors',
      description: 'Únete a My Tutors y enseña idiomas a estudiantes de todo el mundo. Horarios flexibles, pagos seguros y estudiantes reales cada semana. ¡Postúlate ahora!',
      keywords: 'enseñar idiomas, tutor online, clases virtuales, trabajo flexible, ganar dinero enseñando, profesor de idiomas, educación online',
      path: '/postulate/tutor',
      image: 'https://mytutors.click/images/tutor-hero.jpg'
    },
    INSTITUTION_DIAGNOSIS: {
      title: 'Diagnóstico My Tutors - Mejoremos juntos la educación',
      description: 'Ayúdanos a mejorar My Tutors. Comparte tu experiencia como tutor o institución para desarrollar mejores herramientas educativas.',
      keywords: 'diagnóstico educativo, mejora continua, feedback tutores, instituciones educativas, herramientas pedagógicas, My Tutors',
      path: '/diagnosis',
      image: 'https://mytutors.click/images/diagnosis-hero.jpg'
    },
    HOME: {
      title: 'My Tutors - Conectando tutores con estudiantes',
      description: 'Plataforma líder para encontrar tutores de idiomas. Clases personalizadas, horarios flexibles y profesores certificados.',
      keywords: 'tutores idiomas, clases online, aprender idiomas, profesores nativos, educación personalizada',
      path: '/',
      image: 'https://mytutors.click/images/home-hero.jpg'
    },
    STUDENT_REGISTER: {
      title: 'Regístrate como Estudiante - My Tutors',
      description: 'Encuentra el tutor perfecto para aprender idiomas. Clases personalizadas con profesores nativos y certificados.',
      keywords: 'aprender idiomas, clases particulares, tutores nativos, educación online, estudiante',
      path: '/register/student',
      image: 'https://mytutors.click/images/student-hero.jpg'
    },
    INSTITUTION_REGISTER: {
      title: 'Regístrate como Institución - My Tutors',
      description: 'Conecta tu institución con una red global de tutores certificados. Mejora la educación de idiomas en tu centro.',
      keywords: 'institución educativa, tutores certificados, educación institucional, servicios educativos',
      path: '/register/institution',
      image: 'https://mytutors.click/images/institution-hero.jpg'
    }
  },

  // Configuraciones específicas para Meta platforms por página
  META_SPECIFIC: {
    TUTOR_POSTULATE: {
      facebookTitle: '🎓 Enseña idiomas desde casa y gana dinero',
      facebookDescription: 'Únete a My Tutors: horarios flexibles, pagos seguros, estudiantes reales. ¡Sin jefes, sin complicaciones! 💼✨',
      whatsappTitle: '📚 Enseña idiomas y gana dinero',
      whatsappDescription: 'My Tutors: horarios flexibles, pagos seguros. ¡Postúlate ahora! 🚀',
      instagramHashtags: '#EnseñarIdiomas #TutorOnline #TrabajoFlexible #EducaciónOnline #MyTutors'
    },
    INSTITUTION_DIAGNOSIS: {
      facebookTitle: '🔍 Ayúdanos a mejorar My Tutors',
      facebookDescription: 'Tu experiencia es valiosa. Comparte tus ideas para crear mejores herramientas educativas. 🎯📈',
      whatsappTitle: '💡 Mejoremos juntos My Tutors',
      whatsappDescription: 'Comparte tu experiencia para mejorar la educación. ¡Tu opinión importa! 🌟',
      instagramHashtags: '#EducaciónMejor #Feedback #MyTutors #InnovaciónEducativa #JuntosSomosMás'
    },
    HOME: {
      facebookTitle: '🌍 My Tutors - Tu plataforma de idiomas',
      facebookDescription: 'Conectamos tutores y estudiantes globalmente. Clases personalizadas, horarios flexibles. ¡Aprende con los mejores! 🎓',
      whatsappTitle: '🌟 My Tutors - Aprende idiomas',
      whatsappDescription: 'Clases personalizadas con tutores nativos. ¡Horarios que se adaptan a ti! 📚',
      instagramHashtags: '#AprenderIdiomas #TutoresNativos #EducaciónPersonalizada #MyTutors #IdiomasOnline'
    },
    STUDENT_REGISTER: {
      facebookTitle: '🎯 Regístrate como Estudiante - My Tutors',
      facebookDescription: 'Encuentra tu tutor perfecto. Clases personalizadas con profesores nativos y certificados. ¡Empieza hoy! 📚✨',
      whatsappTitle: '📖 Regístrate como Estudiante',
      whatsappDescription: 'Tutores nativos, clases personalizadas. ¡Aprende a tu ritmo! 🚀',
      instagramHashtags: '#EstudianteOnline #AprenderIdiomas #TutoresNativos #EducaciónPersonalizada #MyTutors'
    },
    INSTITUTION_REGISTER: {
      facebookTitle: '🏫 Regístrate como Institución - My Tutors',
      facebookDescription: 'Conecta tu institución con tutores certificados globalmente. Mejora la educación de idiomas en tu centro. 🌍📈',
      whatsappTitle: '🎓 Regístrate como Institución',
      whatsappDescription: 'Red global de tutores certificados para tu institución. ¡Mejora la educación! 🌟',
      instagramHashtags: '#InstituciónEducativa #TutoresCertificados #EducaciónInstitucional #MyTutors #RedGlobalEducativa'
    }
  },
  
  // Idiomas soportados
  LANGUAGES: {
    ES: {
      locale: 'es_ES',
      direction: 'ltr'
    },
    EN: {
      locale: 'en_US',
      direction: 'ltr'
    },
    FR: {
      locale: 'fr_FR',
      direction: 'ltr'
    },
    DE: {
      locale: 'de_DE',
      direction: 'ltr'
    }
  }
};

// Helper para generar URLs completas
export const generateFullUrl = (path: string): string => {
  return `${META_CONSTANTS.SITE_URL}${path}`;
};

// Helper para generar meta tags completos basados en una página
export const generatePageMetaTags = (pageKey: keyof typeof META_CONSTANTS.PAGES, customData?: Partial<{
  title: string;
  description: string;
  keywords: string;
  image: string;
  imageAlt: string;
  facebookAppId: string;
}>) => {
  const pageData = META_CONSTANTS.PAGES[pageKey];
  const metaConfig = META_CONSTANTS.META_CONFIG;
  
  return {
    title: customData?.title || pageData.title,
    description: customData?.description || pageData.description,
    keywords: customData?.keywords || pageData.keywords,
    author: META_CONSTANTS.AUTHOR,
    robots: META_CONSTANTS.DEFAULT_ROBOTS,
    canonicalUrl: generateFullUrl(pageData.path),
    openGraph: {
      title: customData?.title || pageData.title,
      description: customData?.description || pageData.description,
      type: 'website' as const,
      url: generateFullUrl(pageData.path),
      image: customData?.image || pageData.image,
      siteName: metaConfig.SITE_NAME,
      locale: metaConfig.DEFAULT_LOCALE,
      imageAlt: customData?.imageAlt || metaConfig.DEFAULT_IMAGE_ALT
    },
    twitter: {
      card: 'summary_large_image',
      title: customData?.title || pageData.title,
      description: customData?.description || pageData.description,
      image: customData?.image || pageData.image
    },
    meta: {
      title: customData?.title || pageData.title,
      description: customData?.description || pageData.description,
      image: customData?.image || pageData.image,
      url: generateFullUrl(pageData.path),
      type: 'website' as const,
      siteName: metaConfig.SITE_NAME,
      locale: metaConfig.DEFAULT_LOCALE,
      imageAlt: customData?.imageAlt || metaConfig.DEFAULT_IMAGE_ALT,
      facebookAppId: customData?.facebookAppId || metaConfig.FACEBOOK_APP_ID,
      facebookAdmins: metaConfig.FACEBOOK_ADMINS,
      facebookPages: metaConfig.FACEBOOK_PAGES
    }
  };
};

// Helper específico para generar meta tags optimizadas para Facebook
export const generateFacebookMetaTags = (pageKey: keyof typeof META_CONSTANTS.PAGES, customData?: Partial<{
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  appId: string;
}>) => {
  const pageData = META_CONSTANTS.PAGES[pageKey];
  const metaConfig = META_CONSTANTS.META_CONFIG;
  
  return {
    title: customData?.title || pageData.title,
    description: customData?.description || pageData.description,
    image: customData?.image || pageData.image,
    url: generateFullUrl(pageData.path),
    type: 'website' as const,
    siteName: metaConfig.SITE_NAME,
    locale: metaConfig.DEFAULT_LOCALE,
    imageAlt: customData?.imageAlt || `${pageData.title} - ${metaConfig.SITE_NAME}`,
    facebookAppId: customData?.appId || metaConfig.FACEBOOK_APP_ID,
    facebookAdmins: metaConfig.FACEBOOK_ADMINS,
    facebookPages: metaConfig.FACEBOOK_PAGES
  };
};

// Helper específico para generar meta tags optimizadas para WhatsApp
export const generateWhatsAppMetaTags = (pageKey: keyof typeof META_CONSTANTS.PAGES, customData?: Partial<{
  title: string;
  description: string;
  image: string;
}>) => {
  const pageData = META_CONSTANTS.PAGES[pageKey];
  
  // WhatsApp funciona mejor con descripciones más cortas y títulos concisos
  const whatsappTitle = customData?.title || pageData.title;
  const whatsappDescription = customData?.description || 
    (pageData.description.length > 120 ? 
      pageData.description.substring(0, 117) + '...' : 
      pageData.description);
  
  return {
    title: whatsappTitle,
    description: whatsappDescription,
    image: customData?.image || pageData.image,
    url: generateFullUrl(pageData.path)
  };
};

// Helper para generar meta tags específicas para campañas de marketing
export const generateMarketingCampaignMetaTags = (
  pageKey: keyof typeof META_CONSTANTS.PAGES,
  campaignData: {
    campaignName: string;
    campaignSource: 'facebook' | 'instagram' | 'whatsapp';
    utmParams?: {
      source: string;
      medium: string;
      campaign: string;
      content?: string;
    };
  },
  customData?: Partial<{
    title: string;
    description: string;
    image: string;
  }>
) => {
  const baseMetaTags = generatePageMetaTags(pageKey, customData);
  
  // Agregar parámetros UTM a la URL si están disponibles
  let campaignUrl = baseMetaTags.canonicalUrl;
  if (campaignData.utmParams) {
    const urlParams = new URLSearchParams();
    urlParams.append('utm_source', campaignData.utmParams.source);
    urlParams.append('utm_medium', campaignData.utmParams.medium);
    urlParams.append('utm_campaign', campaignData.utmParams.campaign);
    if (campaignData.utmParams.content) {
      urlParams.append('utm_content', campaignData.utmParams.content);
    }
    campaignUrl += '?' + urlParams.toString();
  }
  
  // Personalizar título y descripción para la campaña
  const campaignTitle = customData?.title || 
    `${baseMetaTags.title} - ${campaignData.campaignName}`;
  
  return {
    ...baseMetaTags,
    title: campaignTitle,
    canonicalUrl: campaignUrl,
    openGraph: {
      ...baseMetaTags.openGraph,
      title: campaignTitle,
      url: campaignUrl
    },
    twitter: {
      ...baseMetaTags.twitter,
      title: campaignTitle
    },
    meta: {
      ...baseMetaTags.meta,
      title: campaignTitle,
      url: campaignUrl
    }
  };
};

// Helper para generar meta tags optimizadas para plataforma específica
export const generatePlatformOptimizedMetaTags = (
  pageKey: keyof typeof META_CONSTANTS.PAGES,
  platform: 'facebook' | 'whatsapp' | 'instagram' | 'general',
  customData?: Partial<{
    title: string;
    description: string;
    image: string;
    hashtags: string;
  }>
) => {
  const baseMetaTags = generatePageMetaTags(pageKey);
  const metaSpecific = META_CONSTANTS.META_SPECIFIC[pageKey];
  
  let optimizedTitle = baseMetaTags.title;
  let optimizedDescription = baseMetaTags.description;
  
  // Optimizar según plataforma
  switch (platform) {
    case 'facebook':
      optimizedTitle = customData?.title || metaSpecific?.facebookTitle || baseMetaTags.title;
      optimizedDescription = customData?.description || metaSpecific?.facebookDescription || baseMetaTags.description;
      break;
    
    case 'whatsapp':
      optimizedTitle = customData?.title || metaSpecific?.whatsappTitle || baseMetaTags.title;
      optimizedDescription = customData?.description || metaSpecific?.whatsappDescription || baseMetaTags.description;
      break;
    
    case 'instagram':
      optimizedTitle = customData?.title || metaSpecific?.facebookTitle || baseMetaTags.title;
      optimizedDescription = customData?.description || 
        (metaSpecific?.facebookDescription ? 
          `${metaSpecific.facebookDescription} ${metaSpecific.instagramHashtags || ''}` : 
          baseMetaTags.description);
      break;
    
    default:
      optimizedTitle = customData?.title || baseMetaTags.title;
      optimizedDescription = customData?.description || baseMetaTags.description;
  }
  
  return {
    ...baseMetaTags,
    title: optimizedTitle,
    description: optimizedDescription,
    openGraph: {
      ...baseMetaTags.openGraph,
      title: optimizedTitle,
      description: optimizedDescription
    },
    twitter: {
      ...baseMetaTags.twitter,
      title: optimizedTitle,
      description: optimizedDescription
    },
    meta: {
      ...baseMetaTags.meta,
      title: optimizedTitle,
      description: optimizedDescription
    }
  };
};
