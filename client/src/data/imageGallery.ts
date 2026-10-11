/**
 * Galería de imágenes disponibles en el sitio para el panel de admin.
 * El administrador puede asignar cualquiera de estas rutas a un producto
 * (o subir/pegar una propia desde el formulario).
 */

/** Fotos reales del mercado + imágenes genéricas de categoría */
export const MARKET_GALLERY_IMAGES: string[] = [
  '/img/products/shampoo.jpg',
  '/img/products/jabon-bano.jpg',
  '/img/products/jabon-lavar.jpg',
  '/img/products/pasta-dental.jpg',
  '/img/products/caldito-pollo.jpg',
  '/img/products/jugos.jpg',
  '/img/products/refrescos.jpg',
  '/img/products/pure-tomate.jpg',
  '/img/products/sopita-instantanea.jpg',
  '/img/products/sazon.jpg',
  '/img/aseo.jpg',
  '/img/alimentos.jpg',
];

/** Prendas y accesorios de la boutique Garzón Chic */
export const BOUTIQUE_GALLERY_IMAGES: string[] = [
  '/img/boutique/real/vestido-floral.webp',
  '/img/boutique/real/camisa-lino.webp',
  '/img/boutique/real/jeans.webp',
  '/img/boutique/real/blusa-seda.webp',
  '/img/boutique/real/chaqueta-denim.webp',
  '/img/boutique/real/falda.webp',
  '/img/boutique/real/sombrero.webp',
  '/img/boutique/real/bolso.webp',
  '/img/boutique/real/bufanda.webp',
  '/img/boutique/real/zapatos.webp',
  '/img/boutique/real/collar.webp',
  '/img/boutique/real/gafas.webp',
];

/** Todas las imágenes del sitio en un solo arreglo */
export const ALL_SITE_IMAGES: string[] = [
  ...MARKET_GALLERY_IMAGES,
  ...BOUTIQUE_GALLERY_IMAGES,
];
