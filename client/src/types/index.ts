/**
 * Subcategoría de la Boutique: agrupa las prendas por zona del cuerpo
 * (superior / inferior / conjuntos o vestidos) y los accesorios.
 */
export type BoutiqueCategory = 'superior' | 'inferior' | 'conjuntos' | 'accesorios';

export interface Product {
  id: string;
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
  rating?: number;
  reviews?: number;
  /** Porcentaje de descuento (0 = sin oferta). Solo demo con datos falsos */
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
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  shippingAddress?: string;
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
