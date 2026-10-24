import { supabase } from '../utils/supabase';
import type {
  OrderItemRow,
  OrderRow,
  OrderStatus,
  PaymentMode,
  ProductStore,
  ProfileRow,
} from '../types/database';

export interface CreateOrderInput {
  items: { productId: string; quantity: number }[];
  phone: string;
  paymentMode: PaymentMode;
  /** Inicio (ISO 8601) del rango de 1 hora elegido para la recogida. */
  pickupReadyAt: string;
  /** Tienda del pedido: Mercado y Boutique se administran por separado. */
  store: ProductStore;
}

/** Pedido con sus líneas y los datos del cliente, para el panel de admin. */
export interface AdminOrder extends OrderRow {
  items: OrderItemRow[];
  customerName: string;
  customerEmail: string;
}

export const orderService = {
  /**
   * Crea el pedido en Supabase. La función `create_order` recalcula precios,
   * el recargo por transferencia (30%), el total y la ventana de recogida,
   * valida el stock y lo descuenta en una sola transacción: el cliente nunca
   * envía importes. El rango de 1 hora lo elige el cliente y lo confirma la
   * base de datos (horario de la tienda). El flujo actual es solo recogida.
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
      p_pickup_ready_at: input.pickupReadyAt,
      p_store: input.store,
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

  /**
   * Últimos pedidos de una tienda, sin líneas ni perfil: es la consulta
   * ligera que usa el aviso al administrador para detectar pedidos nuevos.
   * RLS solo devuelve todos los pedidos a las cuentas con rol admin.
   */
  listRecent: async (store: ProductStore, limit = 20): Promise<OrderRow[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('store', store)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  /**
   * Pedidos de una tienda con sus líneas y el cliente (solo administradores:
   * RLS devuelve todos los pedidos únicamente a las cuentas con rol admin).
   * Se consulta en tres pasos sencillos para no depender de joins tipados.
   */
  listForAdmin: async (store: ProductStore): Promise<AdminOrder[]> => {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('store', store)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    if (!orders?.length) return [];

    const orderIds = orders.map((order) => order.id);
    const userIds = [...new Set(orders.map((order) => order.user_id))];

    const [{ data: items, error: itemsError }, { data: profiles, error: profilesError }] =
      await Promise.all([
        supabase.from('order_items').select('*').in('order_id', orderIds),
        supabase.from('profiles').select('*').in('id', userIds),
      ]);

    if (itemsError) throw new Error(itemsError.message);
    if (profilesError) throw new Error(profilesError.message);

    const itemsByOrder = new Map<string, OrderItemRow[]>();
    for (const item of items ?? []) {
      const list = itemsByOrder.get(item.order_id) ?? [];
      list.push(item);
      itemsByOrder.set(item.order_id, list);
    }
    const profileById = new Map<string, ProfileRow>(
      (profiles ?? []).map((profile) => [profile.id, profile])
    );

    return orders.map((order) => {
      const profile = profileById.get(order.user_id);
      return {
        ...order,
        items: itemsByOrder.get(order.id) ?? [],
        customerName: profile?.name ?? 'Cliente',
        customerEmail: profile?.email ?? '',
      };
    });
  },

  /** Marca un pedido como entregado o cancelado (acción de administrador). */
  updateStatus: async (orderId: string, status: OrderStatus): Promise<void> => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select('id');

    if (error) throw new Error(error.message);
    if (!data?.length) {
      throw new Error('No se pudo actualizar el pedido. ¿Tu cuenta es de administrador?');
    }
  },
};
