import { supabase } from '../utils/supabase';
import type { ProductReview } from '../types';
import type { ProductReviewRow } from '../types/database';

/** Mensaje accionable cuando el esquema todavía no se ha ejecutado. */
function toError(message: string): Error {
  if (
    message.includes('Could not find the table') ||
    message.includes('schema cache') ||
    message.includes('column') ||
    message.includes('relation')
  ) {
    return new Error(
      'La base de datos no está configurada: ejecuta database/supabase/schema.sql en el SQL Editor de Supabase.'
    );
  }
  return new Error(message);
}

function mapReview(row: ProductReviewRow): ProductReview {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    authorName: row.author_name,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const reviewService = {
  /** Reseñas publicadas de un producto (de la más reciente a la más vieja). */
  listByProduct: async (productId: string): Promise<ProductReview[]> => {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw toError(error.message);
    return (data ?? []).map(mapReview);
  },

  /** Últimas reseñas de toda la tienda: sustituyen a los testimonios inventados. */
  listRecent: async (limit = 12): Promise<ProductReview[]> => {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw toError(error.message);
    return (data ?? []).map(mapReview);
  },

  /**
   * Crea o actualiza la reseña del usuario para el producto. La base de
   * datos recalcula el promedio en `products.rating` / `products.reviews`.
   */
  save: async (input: {
    productId: string;
    userId: string;
    rating: number;
    comment: string;
  }): Promise<ProductReview> => {
    const rating = Math.round(input.rating);
    if (rating < 1 || rating > 5) throw new Error('Elige entre 1 y 5 estrellas');
    if (input.comment.trim().length < 5) {
      throw new Error('Cuéntanos un poco más sobre tu experiencia (mínimo 5 caracteres)');
    }

    const { data, error } = await supabase
      .from('product_reviews')
      .upsert(
        {
          product_id: input.productId,
          user_id: input.userId,
          rating,
          comment: input.comment.trim(),
        },
        { onConflict: 'product_id,user_id' }
      )
      .select()
      .single();

    if (error) throw toError(error.message);
    return mapReview(data);
  },

  remove: async (reviewId: string): Promise<void> => {
    const { data, error } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', reviewId)
      .select('id');

    if (error) throw toError(error.message);
    if (!data?.length) throw new Error('No se pudo eliminar la reseña');
  },
};
