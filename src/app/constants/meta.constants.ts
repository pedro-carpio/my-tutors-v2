// Constantes para meta tags comunes de la aplicación
export const META_CONSTANTS = {
  // Información básica del sitio
  SITE_NAME: 'My Tutors',
  SITE_URL: 'https://my-tutors.com',
  AUTHOR: 'My Tutors',
  DEFAULT_IMAGE: 'https://my-tutors.com/assets/images/default-og-image.jpg',
  
  // Meta tags por defecto
  DEFAULT_ROBOTS: 'index, follow',
  DEFAULT_TWITTER_CARD: 'summary_large_image',
  
  // Páginas específicas
  PAGES: {
    TUTOR_POSTULATE: {
      title: 'Enseña idiomas y gana dinero - My Tutors',
      description: 'Únete a My Tutors y enseña idiomas a estudiantes de todo el mundo. Horarios flexibles, pagos seguros y estudiantes reales cada semana. ¡Postúlate ahora!',
      keywords: 'enseñar idiomas, tutor online, clases virtuales, trabajo flexible, ganar dinero enseñando, profesor de idiomas, educación online',
      path: '/postulate/tutor',
      image: 'https://my-tutors.com/assets/images/tutor-hero.jpg'
    },
    INSTITUTION_DIAGNOSIS: {
      title: 'Diagnóstico My Tutors - Mejoremos juntos la educación',
      description: 'Ayúdanos a mejorar My Tutors. Comparte tu experiencia como tutor o institución para desarrollar mejores herramientas educativas.',
      keywords: 'diagnóstico educativo, mejora continua, feedback tutores, instituciones educativas, herramientas pedagógicas, My Tutors',
      path: '/diagnosis',
      image: 'https://my-tutors.com/assets/images/diagnosis-hero.jpg'
    },
    HOME: {
      title: 'My Tutors - Conectando tutores con estudiantes',
      description: 'Plataforma líder para encontrar tutores de idiomas. Clases personalizadas, horarios flexibles y profesores certificados.',
      keywords: 'tutores idiomas, clases online, aprender idiomas, profesores nativos, educación personalizada',
      path: '/',
      image: 'https://my-tutors.com/assets/images/home-hero.jpg'
    },
    STUDENT_REGISTER: {
      title: 'Regístrate como Estudiante - My Tutors',
      description: 'Encuentra el tutor perfecto para aprender idiomas. Clases personalizadas con profesores nativos y certificados.',
      keywords: 'aprender idiomas, clases particulares, tutores nativos, educación online, estudiante',
      path: '/register/student',
      image: 'https://my-tutors.com/assets/images/student-hero.jpg'
    },
    INSTITUTION_REGISTER: {
      title: 'Regístrate como Institución - My Tutors',
      description: 'Conecta tu institución con una red global de tutores certificados. Mejora la educación de idiomas en tu centro.',
      keywords: 'institución educativa, tutores certificados, educación institucional, servicios educativos',
      path: '/register/institution',
      image: 'https://my-tutors.com/assets/images/institution-hero.jpg'
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
}>) => {
  const pageData = META_CONSTANTS.PAGES[pageKey];
  
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
      image: customData?.image || pageData.image
    },
    twitter: {
      card: 'summary_large_image',
      title: customData?.title || pageData.title,
      description: customData?.description || pageData.description,
      image: customData?.image || pageData.image
    }
  };
};
