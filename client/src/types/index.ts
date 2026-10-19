/**
 * Subcategoría de la Boutique: agrupa las prendas por zona del cuerpo
 * (superior / inferior / conjuntos o vestidos) y los accesorios.
 */
export type BoutiqueCategory = 'superior' | 'inferior' | 'conjuntos' | 'accesorios';

export interface Product {
  id: string;
  /** Tienda a la que pertenece el producto en Supabase */
  store?: 'market' | 'boutique';
  name: string;
  description: string;
  price: number;
  image: string;
  /** Imagen alternativa (ilustración) si la principal falla */
  fallbackImage?: string;
  category: 'aseo' | 'alimentos';
  /** Solo en productos de la Boutique: filtro del catálogo de moda */
  subcategory?: BoutiqueCategory;
  stock: number;
  /** Días estimados de espera para reponer existencias (null = sin fecha) */
  restockDays?: number;
  /** Promedio real de las reseñas; undefined mientras no haya ninguna */
  rating?: number;
  /** Cantidad real de reseñas publicadas */
  reviews?: number;
  /** Porcentaje de descuento (0 = sin oferta) */
  discount?: number;
  /** Emoji decorativo para la vista previa sin imagen */
  emoji?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  avatar?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  /** Recargo del 30% al pagar por transferencia */
  transferFee: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMode: 'cash' | 'transfer';
  /** Inicio de la ventana de recogida (1 hora) */
  pickupReadyAt: string;
  createdAt: string;
  updatedAt: string;
  phone?: string;
}

/** Reseña real de un producto (calificación + experiencia de compra). */
export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
