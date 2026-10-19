import { Product, BoutiqueCategory } from '../types';

/**
 * Catálogo de la Boutique: vive en Supabase (`public.products`, store =
 * 'boutique'). No hay productos de demostración ni valoraciones inventadas.
 */

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
export function getBoutiqueDiscountedPrice(product: Pick<Product, 'price' | 'discount'>): number {
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
      'Aseo y alimentos seleccionados uno a uno. Compra fácil, recoge en tienda y lleva calidad a tu familia.',
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
