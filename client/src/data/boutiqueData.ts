import { Product, BoutiqueCategory } from '../types';

/**
 * DATOS FALSOS — BOUTIQUE "GARZÓN CHIC" (venta de garaje online)
 * Prendas y accesorios seleccionados. Fotos reales CC0
 * (ver img/boutique/real/manifest.json).
 */
export const BOUTIQUE_PRODUCTS: Product[] = [
  {
    id: 'b1',
    name: 'Vestido Floral Midi',
    description: 'Vestido midi con estampado floral en tonos suaves. Tela fresca y caída preciosa. Talla M.',
    price: 28000,
    image: '/img/boutique/real/vestido-floral.webp',
    category: 'aseo',
    subcategory: 'conjuntos',
    stock: 1,
    rating: 4.9,
    reviews: 12,
    discount: 30,
    emoji: '👗',
  },
  {
    id: 'b2',
    name: 'Camisa de Lino Crudo',
    description: 'Camisa de lino respirable, corte relajado. Perfecta para el calor de Santiago. Talla L.',
    price: 19500,
    image: '/img/boutique/real/camisa-lino.webp',
    category: 'aseo',
    subcategory: 'superior',
    stock: 1,
    rating: 4.7,
    reviews: 8,
    emoji: '👔',
  },
  {
    id: 'b3',
    name: 'Jeans Rectos Clásicos',
    description: 'Mezclilla resistente con corte recto atemporal. Como nuevos. Talla 32.',
    price: 22000,
    image: '/img/boutique/real/jeans.webp',
    category: 'aseo',
    subcategory: 'inferior',
    stock: 1,
    rating: 4.8,
    reviews: 15,
    discount: 20,
    emoji: '👖',
  },
  {
    id: 'b4',
    name: 'Blusa de Seda Vintage',
    description: 'Blusa de seda con corte clásico de los 90. Pieza única degarage. Talla S.',
    price: 16000,
    image: '/img/boutique/real/blusa-seda.webp',
    category: 'aseo',
    subcategory: 'superior',
    stock: 1,
    rating: 4.6,
    reviews: 6,
    emoji: '👚',
  },
  {
    id: 'b5',
    name: 'Chaqueta Denim Oversize',
    description: 'Chaqueta de mezclilla oversize, lavado medio. Combinable con todo. Talla M.',
    price: 26000,
    image: '/img/boutique/real/chaqueta-denim.webp',
    category: 'aseo',
    subcategory: 'superior',
    stock: 1,
    rating: 4.9,
    reviews: 11,
    discount: 15,
    emoji: '🧥',
  },
  {
    id: 'b6',
    name: 'Falda Plisada Coctel',
    description: 'Falda plisada con movimiento elegante, ideal para ocasiones especiales. Talla M.',
    price: 17500,
    image: '/img/boutique/real/falda.webp',
    category: 'aseo',
    subcategory: 'inferior',
    stock: 1,
    rating: 4.5,
    reviews: 5,
    emoji: '🩱',
  },
  {
    id: 'b7',
    name: 'Sombrero de Paja Amplio',
    description: 'Sombrero de paja natural con ala ancha. Sombra y estilo en la playa o la ciudad.',
    price: 12000,
    image: '/img/boutique/real/sombrero.webp',
    category: 'alimentos',
    subcategory: 'accesorios',
    stock: 2,
    rating: 4.7,
    reviews: 9,
    emoji: '👒',
  },
  {
    id: 'b8',
    name: 'Bolso de Cuero Curso',
    description: 'Bolso de cuero genuino con herrajes dorados. Curado con cariño, gran capacidad.',
    price: 34000,
    image: '/img/boutique/real/bolso.webp',
    category: 'alimentos',
    subcategory: 'accesorios',
    stock: 1,
    rating: 5.0,
    reviews: 14,
    discount: 25,
    emoji: '👜',
  },
  {
    id: 'b9',
    name: 'Bufanda de Punto',
    description: 'Bufanda tejida a mano, suave y abrigadora. Hecho con puntada artesanal.',
    price: 9500,
    image: '/img/boutique/real/bufanda.webp',
    category: 'alimentos',
    subcategory: 'accesorios',
    stock: 3,
    rating: 4.8,
    reviews: 7,
    emoji: '🧣',
  },
  {
    id: 'b10',
    name: 'Tacones Clásicos 38',
    description: 'Zapatos de tacón clásico en tono neutro. Altura perfecta para toda la noche. Talla 38.',
    price: 21000,
    image: '/img/boutique/real/zapatos.webp',
    category: 'alimentos',
    subcategory: 'accesorios',
    stock: 1,
    rating: 4.6,
    reviews: 10,
    emoji: '👠',
  },
  {
    id: 'b11',
    name: 'Collar de Piedras Azules',
    description: 'Collar con piedras naturales engarzadas. Pieza statement artesanal.',
    price: 14000,
    image: '/img/boutique/real/collar.webp',
    category: 'alimentos',
    subcategory: 'accesorios',
    stock: 2,
    rating: 4.9,
    reviews: 13,
    emoji: '📿',
  },
  {
    id: 'b12',
    name: 'Gafas de Sol Retro',
    description: 'Gafas con montura rosa retro y protección UV. Estilo de los 70 auténtico.',
    price: 8500,
    image: '/img/boutique/real/gafas.webp',
    category: 'alimentos',
    subcategory: 'accesorios',
    stock: 4,
    rating: 4.4,
    reviews: 6,
    discount: 10,
    emoji: '🕶️',
  },
];

/**
 * Filtros del catálogo de Boutique: las prendas agrupadas por zona del
 * cuerpo (parte superior / parte inferior / conjuntos o vestidos) y los
 * accesorios. El `id` es el valor de `Product.subcategory`.
 */
export const BOUTIQUE_CATEGORIES: { id: '' | BoutiqueCategory; label: string }[] = [
  { id: '', label: 'Todos' },
  { id: 'superior', label: 'Parte superior' },
  { id: 'inferior', label: 'Parte inferior' },
  { id: 'conjuntos', label: 'Conjuntos o vestidos' },
  { id: 'accesorios', label: 'Accesorios' },
];

/** Precio final aplicando el descuento (si lo tiene) */
export function getBoutiqueDiscountedPrice(product: Product): number {
  if (!product.discount) return product.price;
  return Math.round(product.price * (1 - product.discount / 100));
}

/** Ruta del logo de la sección Mercado.
 * Logo actualizado: logo.jpg (database/Fotos/logo.jpg)
 */
export const MARKET_LOGO_PATH = '/img/Fotos/logo.jpg';

/** Metadatos de cada tienda: logo, eslogan, texto del hero y etiquetas de categoría */
export const STORE_META_DATA: Record<
  'market' | 'boutique',
  {
    id: 'market' | 'boutique';
    name: string;
    tagline: string;
    heroTitleA: string;
    heroTitleB: string;
    heroSubtitle: string;
    badgeText: string;
    logo: string;
    categoryLabelA: string;
    categoryLabelB: string;
    searchPlaceholder: string;
  }
> = {
  market: {
    id: 'market',
    name: 'Ventas Garzón',
    tagline: 'Tu mercado local de confianza',
    heroTitleA: 'Lo que tu casa necesita,',
    heroTitleB: 'en un solo lugar',
    heroSubtitle:
      'Aseo y alimentos seleccionados uno a uno. Compra fácil, coordina la recogida en tienda y lleva calidad a tu familia.',
    badgeText: 'Tu mercado local de confianza',
    logo: MARKET_LOGO_PATH,
    categoryLabelA: 'Aseo',
    categoryLabelB: 'Alimentos',
    searchPlaceholder: 'Busca shampoo, sponch, café, detergente...',
  },
  boutique: {
    id: 'boutique',
    name: 'Garzón Chic',
    tagline: 'Venta de garaje online · moda con historia',
    heroTitleA: 'Estilo único,',
    heroTitleB: 'a precio de garaje',
    heroSubtitle:
      'Prendas y accesorios seleccionados en pieza única o tallas limitadas. Cada prenda tiene su historia; dale una nueva.',
    badgeText: 'Venta de garaje online',
    logo: '/img/logo_chic.jpg',
    categoryLabelA: 'Ropa',
    categoryLabelB: 'Accesorios',
    searchPlaceholder: 'Busca vestidos, jeans, bolsos, accesorios...',
  },
};
