/**
 * Tipos de la base de datos de Supabase.
 *
 * Se mantienen a mano (en vez de generarlos con la CLI) para que el
 * frontend compile sin depender de una conexión al proyecto. Si cambias
 * el esquema en `database/supabase/schema.sql`, actualiza este archivo.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProductCategory = 'aseo' | 'alimentos';
export type ProductStore = 'market' | 'boutique';
export type BoutiqueSubcategory = 'superior' | 'inferior' | 'conjuntos' | 'accesorios';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type DeliveryMode = 'pickup' | 'delivery';
export type PaymentMode = 'cash' | 'transfer';

export type ProfileRow = {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductRow = {
  id: string;
  store: ProductStore;
  name: string;
  description: string;
  price: number;
  image: string;
  fallback_image: string | null;
  category: ProductCategory;
  subcategory: BoutiqueSubcategory | null;
  stock: number;
  restock_days: number | null;
  rating: number | null;
  reviews: number;
  discount: number | null;
  emoji: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderRow = {
  id: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  /** Se conserva en 0: la tienda ya no cobra impuestos. */
  tax: number;
  /** Recargo del 30% cuando el pago es por transferencia. */
  transfer_fee: number;
  delivery_fee: number;
  total: number;
  shipping_address: string | null;
  phone: string | null;
  delivery_mode: DeliveryMode;
  payment_mode: PaymentMode;
  /** Inicio del rango de 1 hora elegido por el cliente para recoger. */
  pickup_ready_at: string;
  created_at: string;
  updated_at: string;
};

export type ProductReviewRow = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  author_name: string;
  created_at: string;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  image: string | null;
  unit_price: number;
  quantity: number;
  created_at: string;
};
/** `type` (no interface): debe satisfacer `Record<string, unknown>`. */
export type CreateOrderArgs = {
  p_items: Json;
  p_shipping_address: string | null;
  p_phone: string | null;
  p_delivery_mode: DeliveryMode;
  p_payment_mode: PaymentMode;
  /** Inicio del rango de 1 hora elegido para la recogida (ISO 8601). */
  p_pickup_ready_at: string | null;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'customer' | 'admin';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'customer' | 'admin';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: {
          id?: string;
          store?: ProductStore;
          name: string;
          description?: string;
          price: number;
          image?: string;
          fallback_image?: string | null;
          category: ProductCategory;
          subcategory?: BoutiqueSubcategory | null;
          stock?: number;
          restock_days?: number | null;
          rating?: number | null;
          reviews?: number;
          discount?: number | null;
          emoji?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store?: ProductStore;
          name?: string;
          description?: string;
          price?: number;
          image?: string;
          fallback_image?: string | null;
          category?: ProductCategory;
          subcategory?: BoutiqueSubcategory | null;
          stock?: number;
          restock_days?: number | null;
          rating?: number | null;
          reviews?: number;
          discount?: number | null;
          emoji?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: {
          id?: string;
          user_id: string;
          status?: OrderStatus;
          subtotal: number;
          tax: number;
          transfer_fee?: number;
          delivery_fee?: number;
          total: number;
          shipping_address?: string | null;
          phone?: string | null;
          delivery_mode: DeliveryMode;
          payment_mode: PaymentMode;
          pickup_ready_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: OrderStatus;
          subtotal?: number;
          tax?: number;
          transfer_fee?: number;
          delivery_fee?: number;
          total?: number;
          shipping_address?: string | null;
          phone?: string | null;
          delivery_mode?: DeliveryMode;
          payment_mode?: PaymentMode;
          pickup_ready_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: OrderItemRow;
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          name: string;
          image?: string | null;
          unit_price: number;
          quantity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          name?: string;
          image?: string | null;
          unit_price?: number;
          quantity?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      product_reviews: {
        Row: ProductReviewRow;
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          rating: number;
          comment?: string;
          author_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          user_id?: string;
          rating?: number;
          comment?: string;
          author_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      create_order: {
        Args: CreateOrderArgs;
        Returns: OrderRow;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
