import { Request, Response } from 'express';
import { z } from 'zod';
import { createOrder, getOrders, getOrderById, updateOrderStatus } from '../models/order.js';
import { getProductById } from '../models/product.js';
import { ApiError } from '../utils/helpers.js';

const createOrderSchema = z.object({
  items: z.array(
    z.object({
      id: z.number(),
      quantity: z.number().positive(),
    })
  ),
  shippingAddress: z.string().min(10),
});

export async function createOrderHandler(req: Request, res: Response) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'No autenticado');
    }

    const body = createOrderSchema.parse(req.body);

    // Resolver precios y stock desde la base de datos (nunca confiar en el cliente)
    const itemsWithPrice = [];
    for (const item of body.items) {
      const product = await getProductById(item.id);
      if (!product) {
        throw new ApiError(400, `El producto ${item.id} no existe`);
      }
      if (product.stock < item.quantity) {
        throw new ApiError(400, `Stock insuficiente para "${product.name}" (disponible: ${product.stock})`);
      }
      itemsWithPrice.push({
        id: product.id,
        quantity: item.quantity,
        price: parseFloat(product.price as any),
      });
    }

    const total = itemsWithPrice.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await createOrder(req.user.userId, itemsWithPrice, body.shippingAddress, total);

    res.status(201).json(order);
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

export async function listOrders(req: Request, res: Response) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'No autenticado');
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);

    const result = await getOrders(req.user.userId, page);

    res.json(result);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

export async function getOrderHandler(req: Request, res: Response) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'No autenticado');
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ApiError(400, 'ID inválido');
    }

    const order = await getOrderById(id, req.user.userId);

    res.json(order);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

export async function updateOrderStatusHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ApiError(400, 'ID inválido');
    }

    const { status } = req.body;
    if (!status) {
      throw new ApiError(400, 'Estado requerido');
    }

    const order = await updateOrderStatus(id, status);

    res.json(order);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}
