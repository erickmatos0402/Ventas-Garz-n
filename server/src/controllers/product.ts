import { Request, Response } from 'express';
import { z } from 'zod';
import { getAllProducts, getProductById, searchProducts, createProduct, updateProduct, deleteProduct } from '../models/product.js';
import { ApiError } from '../utils/helpers.js';

const createProductSchema = z.object({
  name: z.string().min(3),
  description: z.string(),
  price: z.number().positive(),
  image: z.string().url().optional(),
  category: z.enum(['aseo', 'alimentos']),
  stock: z.number().int().nonnegative(),
});

export async function listProducts(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const category = (req.query.category as string) || undefined;

    const result = await getAllProducts(page, 12, category);

    res.json(result);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

export async function getProduct(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ApiError(400, 'ID inválido');
    }

    const product = await getProductById(id);
    if (!product) {
      throw new ApiError(404, 'Producto no encontrado');
    }

    res.json(product);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

export async function searchProductsHandler(req: Request, res: Response) {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      throw new ApiError(400, 'Búsqueda debe tener al menos 2 caracteres');
    }

    const products = await searchProducts(query);

    res.json(products);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

export async function createProductHandler(req: Request, res: Response) {
  try {
    const body = createProductSchema.parse(req.body);

    const product = await createProduct({
      name: body.name,
      description: body.description,
      price: body.price,
      image: body.image || '',
      category: body.category,
      stock: body.stock,
    });

    res.status(201).json(product);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
    }
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

export async function updateProductHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ApiError(400, 'ID inválido');
    }

    const product = await updateProduct(id, req.body);

    res.json(product);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

export async function deleteProductHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ApiError(400, 'ID inválido');
    }

    await deleteProduct(id);

    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}
