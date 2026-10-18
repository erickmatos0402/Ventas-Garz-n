import { supabase } from '../utils/supabase';
import { Product } from '../types';
import type { Database, ProductRow } from '../types/database';

type ProductInsert = Database['public']['Tables']['products']['Insert'];

export type ProductInput = Omit<Product, 'id'>;

/** Mensaje accionable cuando el esquema todavía no se ha ejecutado. */
function toError(message: string): Error {
  if (message.includes('Could not find the table') || message.includes('schema cache')) {
    return new Error(
      'La base de datos no está configurada: ejecuta database/supabase/schema.sql en el SQL Editor de Supabase.'
    );
  }
  return new Error(message);
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    store: row.store,
    name: row.name,
    description: row.description,
    price: row.price,
    image: row.image,
    fallbackImage: row.fallback_image ?? undefined,
    category: row.category,
    subcategory: row.subcategory ?? undefined,
    stock: row.stock,
    rating: row.rating != null ? Number(row.rating) : undefined,
    reviews: row.reviews,
    discount: row.discount ?? undefined,
    emoji: row.emoji ?? undefined,
  };
}

function toInsert(input: ProductInput): ProductInsert {
  return {
    store: input.store ?? 'market',
    name: input.name,
    description: input.description ?? '',
    price: Math.round(input.price),
    image: input.image ?? '',
    fallback_image: input.fallbackImage ?? null,
    category: input.category,
    subcategory: input.subcategory ?? null,
    stock: input.stock ?? 0,
    rating: input.rating ?? null,
    reviews: input.reviews ?? 0,
    discount: input.discount ?? null,
    emoji: input.emoji ?? null,
  };
}

export const productService = {
  list: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw toError(error.message);
    return (data ?? []).map(mapProduct);
  },

  create: async (input: ProductInput): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .insert(toInsert(input))
      .select()
      .single();

    if (error) throw toError(error.message);
    return mapProduct(data);
  },

  update: async (id: string, input: ProductInput): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .update(toInsert(input))
      .eq('id', id)
      .select()
      .single();

    if (error) throw toError(error.message);
    return mapProduct(data);
  },

  remove: async (id: string): Promise<void> => {
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throw toError(error.message);
    if (!data?.length) {
      throw new Error('No se pudo eliminar el producto. ¿Tu cuenta es de administrador?');
    }
  },
};
