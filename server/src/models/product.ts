import { query } from '../database/index.js';
import { ApiError, formatDatabaseError } from '../utils/helpers.js';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  rating?: number;
  reviews?: number;
  created_at: string;
}

export async function getAllProducts(page: number = 1, limit: number = 12, category?: string): Promise<any> {
  try {
    const offset = (page - 1) * limit;
    let sql = 'SELECT * FROM products';
    const params: any[] = [];

    if (category) {
      sql += ' WHERE category = $1';
      params.push(category);
      sql += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    } else {
      sql += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }

    const countSql = category ? 'SELECT COUNT(*) FROM products WHERE category = $1' : 'SELECT COUNT(*) FROM products';
    const countParams = category ? [category] : [];

    const [productsResult, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, countParams),
    ]);

    const total = parseInt(countResult.rows[0].count);

    return {
      data: productsResult.rows,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error: any) {
    throw new ApiError(500, formatDatabaseError(error));
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  try {
    const result = await query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error: any) {
    throw new ApiError(500, formatDatabaseError(error));
  }
}

export async function searchProducts(searchQuery: string): Promise<Product[]> {
  try {
    const result = await query(
      'SELECT * FROM products WHERE name ILIKE $1 OR description ILIKE $1 ORDER BY created_at DESC LIMIT 20',
      [`%${searchQuery}%`]
    );
    return result.rows;
  } catch (error: any) {
    throw new ApiError(500, formatDatabaseError(error));
  }
}

export async function createProduct(data: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
  try {
    const result = await query(
      'INSERT INTO products (name, description, price, image, category, stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [data.name, data.description, data.price, data.image, data.category, data.stock]
    );
    return result.rows[0];
  } catch (error: any) {
    throw new ApiError(500, formatDatabaseError(error));
  }
}

export async function updateProduct(id: number, data: Partial<Product>): Promise<Product> {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const fields: (keyof Omit<Product, 'id' | 'created_at'>)[] = [
      'name',
      'description',
      'price',
      'image',
      'category',
      'stock',
      'rating',
      'reviews',
    ];

    fields.forEach((field) => {
      if (data[field] !== undefined) {
        updates.push(`${field.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${paramCount}`);
        values.push(data[field]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      const product = await getProductById(id);
      if (!product) throw new ApiError(404, 'Producto no encontrado');
      return product;
    }

    values.push(id);

    const result = await query(
      `UPDATE products SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      throw new ApiError(404, 'Producto no encontrado');
    }

    return result.rows[0];
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, formatDatabaseError(error));
  }
}

export async function deleteProduct(id: number): Promise<void> {
  try {
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (!result.rows[0]) {
      throw new ApiError(404, 'Producto no encontrado');
    }
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, formatDatabaseError(error));
  }
}
