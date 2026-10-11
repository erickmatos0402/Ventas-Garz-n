import { Request, Response } from 'express';
import { query } from '../database/index.js';
import { getAllProducts } from '../models/product.js';
import { ApiError } from '../utils/helpers.js';

export async function getDashboard(req: Request, res: Response) {
  try {
    // Get total products
    const productsResult = await query('SELECT COUNT(*) as total FROM products');
    const totalProducts = parseInt(productsResult.rows[0].total);

    // Get total orders
    const ordersResult = await query('SELECT COUNT(*) as total FROM orders');
    const totalOrders = parseInt(ordersResult.rows[0].total);

    // Get total users
    const usersResult = await query('SELECT COUNT(*) as total FROM users');
    const totalUsers = parseInt(usersResult.rows[0].total);

    // Get total revenue
    const revenueResult = await query('SELECT SUM(total) as total FROM orders WHERE status != $1', ['cancelled']);
    const totalRevenue = parseFloat(revenueResult.rows[0].total || 0);

    // Get recent orders
    const recentOrdersResult = await query(`
      SELECT o.*, u.name, u.email FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    res.json({
      stats: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue,
      },
      recentOrders: recentOrdersResult.rows,
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

export async function listAllProducts(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);

    const result = await getAllProducts(page, 20);

    res.json(result);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

export async function listSectionProducts(req: Request, res: Response) {
  try {
    const section = String(req.query.section || 'market');

    const result = await getAllProducts(1, 20, section);

    res.json(result);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

export async function createSectionProduct(req: Request, res: Response) {
  try {
    const { name, description, price, image, category, stock } = req.body;

    if (!name || !description || price == null || !image || !category || stock == null) {
      throw new ApiError(400, 'Faltan datos obligatorios del producto');
    }

    if (category !== 'market' && category !== 'boutique') {
      throw new ApiError(400, 'Sección inválida. Use market o boutique.');
    }

    const result = await query(
      `INSERT INTO products (name, description, price, image, category, stock)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, price, image, category, stock]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

export async function updateSectionProduct(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ApiError(400, 'ID inválido');
    }

    const { name, description, price, image, category, stock } = req.body;

    const allowedFields: Array<keyof typeof req.body> = ['name', 'description', 'price', 'image', 'category', 'stock'];
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(req.body[field]);
        paramCount++;
      }
    });

    if (updates.length > 0) {
      values.push(id);

      const result = await query(
        `UPDATE products SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      if (!result.rows[0]) {
        throw new ApiError(404, 'Producto no encontrado');
      }

      return res.json(result.rows[0]);
    }

    const product = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (!product.rows[0]) {
      throw new ApiError(404, 'Producto no encontrado');
    }

    res.json(product.rows[0]);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

export async function deleteSectionProduct(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ApiError(400, 'ID inválido');
    }

    const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (!result.rows[0]) {
      throw new ApiError(404, 'Producto no encontrado');
    }

    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

export async function listAllOrders(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const status = req.query.status as string;

    const limit = 20;
    const offset = (page - 1) * limit;

    let sql = 'SELECT o.*, u.name, u.email FROM orders o JOIN users u ON o.user_id = u.id';
    const params: any[] = [];

    if (status) {
      sql += ' WHERE o.status = $1';
      params.push(status);
      sql += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
    } else {
      sql += ` ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }

    const ordersResult = await query(sql, params);

    const countSql = status ? 'SELECT COUNT(*) FROM orders WHERE status = $1' : 'SELECT COUNT(*) FROM orders';
    const countParams = status ? [status] : [];
    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: ordersResult.rows,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

export async function listAllUsers(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);

    const limit = 20;
    const offset = (page - 1) * limit;

    const usersResult = await query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const countResult = await query('SELECT COUNT(*) FROM users');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: usersResult.rows,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

export async function getSalesAnalytics(req: Request, res: Response) {
  try {
    // Get sales by category
    const categorySalesResult = await query(`
      SELECT p.category, COUNT(oi.id) as count, SUM(oi.price * oi.quantity) as total
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.category
    `);

    // Get sales by date (last 30 days)
    const dailySalesResult = await query(`
      SELECT DATE(o.created_at) as date, COUNT(o.id) as orders, SUM(o.total) as total
      FROM orders o
      WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
      AND o.status != 'cancelled'
      GROUP BY DATE(o.created_at)
      ORDER BY date DESC
    `);

    // Get top products
    const topProductsResult = await query(`
      SELECT p.id, p.name, COUNT(oi.id) as sales, SUM(oi.quantity) as quantity
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY p.id, p.name
      ORDER BY sales DESC
      LIMIT 10
    `);

    res.json({
      byCategory: categorySalesResult.rows,
      dailySales: dailySalesResult.rows,
      topProducts: topProductsResult.rows,
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}
