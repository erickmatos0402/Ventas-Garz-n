import { supabase } from '../utils/supabase';
import type { DeliveryMode, OrderRow, PaymentMode } from '../types/database';

export interface CreateOrderInput {
  items: { productId: string; quantity: number }[];
  shippingAddress?: string;
  phone: string;
  deliveryMode: DeliveryMode;
  paymentMode: PaymentMode;
}

export const orderService = {
  /**
   * Crea el pedido en Supabase. La función `create_order` recalcula precios,
   * impuesto, envío y total, valida el stock y lo descuenta en una sola
   * transacción: el cliente nunca envía importes.
   */
  create: async (input: CreateOrderInput): Promise<OrderRow> => {
    const { data, error } = await supabase.rpc('create_order', {
      p_items: input.items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
      p_shipping_address: input.shippingAddress?.trim() || null,
      p_phone: input.phone.trim(),
      p_delivery_mode: input.deliveryMode,
      p_payment_mode: input.paymentMode,
    });

    if (error) {
      if (error.message.includes('Could not find the function')) {
        throw new Error(
          'La base de datos no está configurada: ejecuta database/supabase/schema.sql en el SQL Editor de Supabase.'
        );
      }
      throw new Error(error.message);
    }

    return data;
  },
};
