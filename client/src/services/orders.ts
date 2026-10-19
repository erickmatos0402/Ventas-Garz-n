import { supabase } from '../utils/supabase';
import type { OrderRow, PaymentMode } from '../types/database';

export interface CreateOrderInput {
  items: { productId: string; quantity: number }[];
  phone: string;
  paymentMode: PaymentMode;
}

export const orderService = {
  /**
   * Crea el pedido en Supabase. La función `create_order` recalcula precios,
   * el recargo por transferencia (30%), el total y la ventana de recogida,
   * valida el stock y lo descuenta en una sola transacción: el cliente nunca
   * envía importes. El flujo actual es siempre recogida en tienda.
   */
  create: async (input: CreateOrderInput): Promise<OrderRow> => {
    // Si la base aún no tiene la migración nueva, `create_order` cobraría el
    // impuesto viejo y no fijaría la hora de recogida. Mejor detenerse aquí.
    const { error: schemaError } = await supabase
      .from('products')
      .select('restock_days')
      .limit(1);

    if (schemaError) {
      throw new Error(
        'La base de datos necesita actualizarse: ejecuta database/supabase/schema.sql en el SQL Editor de Supabase y vuelve a intentarlo.'
      );
    }

    const { data, error } = await supabase.rpc('create_order', {
      p_items: input.items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
      p_shipping_address: null,
      p_phone: input.phone.trim(),
      p_delivery_mode: 'pickup',
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
