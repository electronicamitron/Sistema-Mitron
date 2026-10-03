// Categories and subcategories – stable IDs, data-driven, no code changes needed to add new subcategories.

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
}

// 10 categorías oficiales de Sistema Mitron
export const CATEGORIES: Category[] = [
  { id: 'audio', name: 'Audio' },
  { id: 'smart-home', name: 'Smart Home' },
  { id: 'hogar-oficina', name: 'Hogar y Oficina' },
  { id: 'computacion-movil', name: 'Computación y Móvil' },
  { id: 'energia-iluminacion', name: 'Energía e Iluminación' },
  { id: 'seguridad', name: 'Seguridad' },
  { id: 'tv-video', name: 'TV y Video' },
  { id: 'electronica-herramientas', name: 'Electrónica y Herramientas' },
  { id: 'cables-conectividad', name: 'Cables y Conectividad' },
  { id: 'musica-instrumentos', name: 'Música e Instrumentos' },
];

export const SUBCATEGORIES: Subcategory[] = [
  // AUDIO
  { id: 'audio-audifonos', name: 'Audífonos', categoryId: 'audio' },
  { id: 'audio-microfonos', name: 'Micrófonos', categoryId: 'audio' },
  { id: 'audio-bocinas-bafles', name: 'Bocinas y bafles', categoryId: 'audio' },
  { id: 'audio-amplificadores', name: 'Amplificadores', categoryId: 'audio' },
  { id: 'audio-profesional', name: 'Audio profesional', categoryId: 'audio' },
  { id: 'cab-audio', name: 'Cables de audio', categoryId: 'audio' },

  // SMART HOME
  { id: 'smarthome-iluminacion', name: 'Iluminación inteligente', categoryId: 'smart-home' },
  { id: 'smarthome-apagadores', name: 'Apagadores y contactos', categoryId: 'smart-home' },
  { id: 'smarthome-automatizacion', name: 'Automatización', categoryId: 'smart-home' },
  { id: 'smarthome-sensores', name: 'Sensores', categoryId: 'smart-home' },
  { id: 'smarthome-cerraduras', name: 'Cerraduras inteligentes', categoryId: 'smart-home' },
  { id: 'smarthome-seguridad', name: 'Seguridad Smart', categoryId: 'smart-home' },

  // HOGAR Y OFICINA
  { id: 'hogar-ergonomia', name: 'Ergonomía', categoryId: 'hogar-oficina' },
  { id: 'hogar-limpieza', name: 'Limpieza de equipos', categoryId: 'hogar-oficina' },
  { id: 'hogar-organizacion', name: 'Organización', categoryId: 'hogar-oficina' },

  // COMPUTACIÓN Y MÓVIL
  { id: 'comp-perifericos', name: 'Periféricos', categoryId: 'computacion-movil' },
  { id: 'comp-cargadores', name: 'Cargadores', categoryId: 'computacion-movil' },
  { id: 'comp-usb-hubs', name: 'USB y Hubs', categoryId: 'computacion-movil' },
  { id: 'comp-almacenamiento', name: 'Almacenamiento', categoryId: 'computacion-movil' },
  { id: 'comp-accesorios-moviles', name: 'Accesorios móviles', categoryId: 'computacion-movil' },

  // ENERGÍA E ILUMINACIÓN
  { id: 'energia-pilas', name: 'Pilas y baterías', categoryId: 'energia-iluminacion' },
  { id: 'energia-fuentes', name: 'Fuentes de poder', categoryId: 'energia-iluminacion' },
  { id: 'energia-reguladores', name: 'Reguladores y No-Break', categoryId: 'energia-iluminacion' },
  { id: 'energia-led', name: 'Iluminación LED', categoryId: 'energia-iluminacion' },

  // SEGURIDAD (CCTV es subcategoría)
  { id: 'seg-camaras', name: 'Cámaras', categoryId: 'seguridad' },
  { id: 'seg-grabadores', name: 'Grabadores (DVR/NVR)', categoryId: 'seguridad' },
  { id: 'seg-cctv', name: 'CCTV', categoryId: 'seguridad' },
  { id: 'seg-alarmas', name: 'Alarmas', categoryId: 'seguridad' },
  { id: 'seg-acceso', name: 'Controles de Acceso', categoryId: 'seguridad' },
  { id: 'seg-cerraduras', name: 'Cerraduras', categoryId: 'seguridad' },
  { id: 'seg-radios', name: 'Radios', categoryId: 'seguridad' },
  { id: 'seg-cables', name: 'Cables y conectores CCTV', categoryId: 'seguridad' },

  // TV Y VIDEO
  { id: 'tv-soportes', name: 'Soportes y montaje', categoryId: 'tv-video' },
  { id: 'tv-cables', name: 'Cables HDMI y video', categoryId: 'tv-video' },
  { id: 'tv-streaming', name: 'Streaming', categoryId: 'tv-video' },
  { id: 'tv-accesorios', name: 'Accesorios', categoryId: 'tv-video' },

  // ELECTRÓNICA Y HERRAMIENTAS
  { id: 'elec-componentes', name: 'Componentes', categoryId: 'electronica-herramientas' },
  { id: 'elec-sensores', name: 'Sensores y módulos', categoryId: 'electronica-herramientas' },
  { id: 'elec-desarrollo', name: 'Desarrollo y programación', categoryId: 'electronica-herramientas' },
  { id: 'elec-prototipado', name: 'Prototipado', categoryId: 'electronica-herramientas' },
  { id: 'elec-soldadura', name: 'Soldadura', categoryId: 'electronica-herramientas' },
  { id: 'elec-medicion', name: 'Medición', categoryId: 'electronica-herramientas' },
  { id: 'herr-manuales', name: 'Herramientas manuales', categoryId: 'electronica-herramientas' },
  { id: 'herr-electricas', name: 'Herramientas eléctricas', categoryId: 'electronica-herramientas' },
  { id: 'herr-accesorios', name: 'Accesorios de herramientas', categoryId: 'electronica-herramientas' },

  // CABLES Y CONECTIVIDAD
  { id: 'red-routers', name: 'Routers y Switches', categoryId: 'cables-conectividad' },
  { id: 'red-cables', name: 'Cables de Red', categoryId: 'cables-conectividad' },
  { id: 'red-antenas', name: 'Antenas', categoryId: 'cables-conectividad' },
  { id: 'cab-hdmi', name: 'HDMI y video', categoryId: 'cables-conectividad' },
  { id: 'cab-usb', name: 'USB', categoryId: 'cables-conectividad' },
  { id: 'cab-coaxial', name: 'Coaxial', categoryId: 'cables-conectividad' },
  { id: 'cab-energia', name: 'Energía', categoryId: 'cables-conectividad' },
  { id: 'cab-adaptadores', name: 'Adaptadores', categoryId: 'cables-conectividad' },
  { id: 'cab-conectores', name: 'Conectores', categoryId: 'cables-conectividad' },

  // MÚSICA E INSTRUMENTOS
  { id: 'mus-guitarras', name: 'Guitarras', categoryId: 'musica-instrumentos' },
  { id: 'mus-bajos', name: 'Bajos', categoryId: 'musica-instrumentos' },
  { id: 'mus-teclados', name: 'Teclados', categoryId: 'musica-instrumentos' },
  { id: 'mus-percusion', name: 'Percusión', categoryId: 'musica-instrumentos' },
  { id: 'mus-cuerdas', name: 'Cuerdas y plumillas', categoryId: 'musica-instrumentos' },
  { id: 'mus-accesorios', name: 'Accesorios', categoryId: 'musica-instrumentos' },
  { id: 'mus-soportes', name: 'Soportes', categoryId: 'musica-instrumentos' },
];

export const getCategoryName = (id: string | null | undefined): string => {
  if (!id) return 'Sin categoría';
  return CATEGORIES.find(c => c.id === id)?.name ?? 'Sin categoría';
};

export const getSubcategoryName = (id: string | null | undefined): string => {
  if (!id) return '';
  return SUBCATEGORIES.find(s => s.id === id)?.name ?? '';
};

export const getSubcategoriesForCategory = (categoryId: string): Subcategory[] => {
  return SUBCATEGORIES.filter(s => s.categoryId === categoryId);
};
