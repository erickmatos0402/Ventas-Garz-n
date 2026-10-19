import { Product } from '../types';

/**
 * El catálogo real vive en Supabase (`public.products`). Ya no se usan
 * productos de demostración con valoraciones ni reseñas inventadas.
 */

/** Precio final aplicando el descuento (si lo tiene) */
export function getDiscountedPrice(product: Pick<Product, 'price' | 'discount'>): number {
  if (!product.discount) return product.price;
  return Math.round(product.price * (1 - product.discount / 100));
}
