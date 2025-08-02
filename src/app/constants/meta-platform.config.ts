/**
 * Configuración específica para Meta Platforms
 * Personaliza estos valores según tu aplicación
 */

export const META_PLATFORM_CONFIG = {
  // Facebook App Configuration
  FACEBOOK: {
    APP_ID: '', // 🔧 CONFIGURA: Tu Facebook App ID
    ADMINS: '', // 🔧 CONFIGURA: IDs de administradores de Facebook (separados por coma)
    PAGES: '', // 🔧 CONFIGURA: ID de tu página de Facebook
    VERIFICATION: '', // 🔧 CONFIGURA: Meta tag de verificación de Facebook
  },

  // Default Image Sizes (optimizadas para Meta)
  IMAGE_SIZES: {
    FACEBOOK: {
      WIDTH: '1200',
      HEIGHT: '630',
      RATIO: '1.91:1'
    },
    INSTAGRAM: {
      WIDTH: '1080',
      HEIGHT: '1080',
      RATIO: '1:1' // Instagram prefiere cuadrado
    },
    WHATSAPP: {
      WIDTH: '1200',
      HEIGHT: '630',
      RATIO: '1.91:1' // Mismo que Facebook
    }
  },

  // Límites de caracteres por plataforma
  TEXT_LIMITS: {
    FACEBOOK: {
      TITLE_MAX: 60,
      DESCRIPTION_MAX: 155
    },
    INSTAGRAM: {
      TITLE_MAX: 50,
      DESCRIPTION_MAX: 125 // Más espacio para hashtags
    },
    WHATSAPP: {
      TITLE_MAX: 45,
      DESCRIPTION_MAX: 100 // WhatsApp prefiere textos más cortos
    }
  },

  // Configuraciones por tipo de contenido
  CONTENT_TYPES: {
    EDUCATIONAL: {
      THEME_COLOR: '#1877f2', // Azul educativo
      EMOJIS: ['📚', '🎓', '📖', '✏️', '🌟'],
      HASHTAGS: ['#Educación', '#Aprendizaje', '#MyTutors']
    },
    TUTORING: {
      THEME_COLOR: '#42a5f5',
      EMOJIS: ['👨‍🏫', '👩‍🏫', '🎯', '💡', '🚀'],
      HASHTAGS: ['#Tutores', '#EnseñarIdiomas', '#EducaciónOnline']
    },
    INSTITUTIONAL: {
      THEME_COLOR: '#2e7d32',
      EMOJIS: ['🏫', '🌍', '📈', '🤝', '💼'],
      HASHTAGS: ['#InstituciónEducativa', '#RedGlobal', '#Innovación']
    }
  }
};

/**
 * Helper para generar texto optimizado por plataforma
 */
export const optimizeTextForPlatform = (
  text: string, 
  platform: 'facebook' | 'instagram' | 'whatsapp',
  type: 'title' | 'description'
): string => {
  const limits = META_PLATFORM_CONFIG.TEXT_LIMITS[platform.toUpperCase() as keyof typeof META_PLATFORM_CONFIG.TEXT_LIMITS];
  const maxLength = type === 'title' ? limits.TITLE_MAX : limits.DESCRIPTION_MAX;
  
  if (text.length <= maxLength) {
    return text;
  }
  
  // Truncar manteniendo palabras completas
  const truncated = text.substring(0, maxLength - 3);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  return truncated.substring(0, lastSpaceIndex) + '...';
};

/**
 * Helper para agregar emojis según el tipo de contenido
 */
export const addContentEmojis = (
  text: string,
  contentType: keyof typeof META_PLATFORM_CONFIG.CONTENT_TYPES,
  position: 'start' | 'end' = 'start'
): string => {
  const emojis = META_PLATFORM_CONFIG.CONTENT_TYPES[contentType].EMOJIS;
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
  
  return position === 'start' ? `${randomEmoji} ${text}` : `${text} ${randomEmoji}`;
};

/**
 * Helper para validar imágenes según plataforma
 */
export const validateImageForPlatform = (
  imageUrl: string,
  platform: 'facebook' | 'instagram' | 'whatsapp'
): {
  isValid: boolean;
  recommendedSize: string;
  error?: string;
} => {
  const config = META_PLATFORM_CONFIG.IMAGE_SIZES[platform.toUpperCase() as keyof typeof META_PLATFORM_CONFIG.IMAGE_SIZES];
  
  if (!imageUrl) {
    return {
      isValid: false,
      recommendedSize: `${config.WIDTH}x${config.HEIGHT}`,
      error: 'No se proporcionó imagen'
    };
  }
  
  if (!imageUrl.startsWith('http')) {
    return {
      isValid: false,
      recommendedSize: `${config.WIDTH}x${config.HEIGHT}`,
      error: 'La imagen debe tener una URL absoluta'
    };
  }
  
  return {
    isValid: true,
    recommendedSize: `${config.WIDTH}x${config.HEIGHT}`
  };
};

/**
 * Helper para generar meta tags con validación automática
 */
export const generateValidatedMetaTags = (
  title: string,
  description: string,
  imageUrl: string,
  platform: 'facebook' | 'instagram' | 'whatsapp',
  contentType: keyof typeof META_PLATFORM_CONFIG.CONTENT_TYPES = 'EDUCATIONAL'
) => {
  // Optimizar textos
  const optimizedTitle = optimizeTextForPlatform(title, platform, 'title');
  const optimizedDescription = optimizeTextForPlatform(description, platform, 'description');
  
  // Agregar emojis si no los tiene
  const titleWithEmoji = optimizedTitle.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u) 
    ? optimizedTitle 
    : addContentEmojis(optimizedTitle, contentType);
  
  // Validar imagen
  const imageValidation = validateImageForPlatform(imageUrl, platform);
  
  return {
    title: titleWithEmoji,
    description: optimizedDescription,
    image: imageUrl,
    validation: {
      title: {
        original: title,
        optimized: titleWithEmoji,
        truncated: title.length > optimizedTitle.length
      },
      description: {
        original: description,
        optimized: optimizedDescription,
        truncated: description.length > optimizedDescription.length
      },
      image: imageValidation
    },
    themeColor: META_PLATFORM_CONFIG.CONTENT_TYPES[contentType].THEME_COLOR,
    suggestedHashtags: META_PLATFORM_CONFIG.CONTENT_TYPES[contentType].HASHTAGS
  };
};
