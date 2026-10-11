import { query, connect } from '../database/index.js';
import type { QueryResult } from 'pg';
import { ApiError, formatDatabaseError } from '../utils/helpers.js';

export interface Order {
  id: number;
  user_id: number;
  total: number;
  status: string;
  shipping_address?: string;
  created_at: string;
  updated_at: string;
}

export async function createOrder(userId: number, items: any[], shippingAddress: string, total: number): Promise<Order> {
  const client = await connect();
  
  try {
    await client.query('BEGIN');

    // Create order
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total, shipping_address) VALUES ($1, $2, $3) RETURNING *',
      [userId, total, shippingAddress]
    );

    const order = orderResult.rows[0];

    // Add order items
    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order.id, item.id, item.quantity, item.price]
      );

      // Update product stock
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.id]
      );
    }

    await client.query('COMMIT');
    return order;
  } catch (error: any) {
    await client.query('ROLLBACK');
    throw new ApiError(500, formatDatabaseError(error));
  } finally {
    client.release();
  }
}

export async function getOrders(userId: number, page: number = 1): Promise<any> {
  try {
    const limit = 10;
    const offset = (page - 1) * limit;

    const ordersResult = await query<QueryResult>(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );

    const countResult = await query<QueryResult>('SELECT COUNT(*) FROM orders WHERE user_id = $1', [userId]);
    const total = parseInt(countResult.rows[0].count);

    // Get items for each order
    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
    const itemsResult = await query<QueryResult>(
      `SELECT oi.*, p.name, p.image FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = $1`,
      [order.id]
    );
        return { ...order, items: itemsResult.rows };
      })
    );

    return {
      data: orders,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error: any) {
    throw new ApiError(500, formatDatabaseError(error));
  }
}

export async function getOrderById(id: number, userId: number): Promise<any> {
  try {
    const orderResult = await query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [id, userId]);

    if (!orderResult.rows[0]) {
      throw new ApiError(404, 'Orden no encontrada');
    }

    const itemsResult = await query(
      `SELECT oi.*, p.name, p.image FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = $1`,
      [id]
    );

    return { ...orderResult.rows[0], items: itemsResult.rows };
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, formatDatabaseError(error));
  }
}

export async function updateOrderStatus(id: number, status: string): Promise<Order> {
  try {
    const result = await query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (!result.rows[0]) {
      throw new ApiError(404, 'Orden no encontrada');
    }

    return result.rows[0];
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, formatDatabaseError(error));
  }
}
