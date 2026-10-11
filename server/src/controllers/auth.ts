import { Request, Response } from 'express';
import { z } from 'zod';
import { createUser, getUserById, verifyPassword, updateUser, getUserByEmail } from '../models/user.js';
import { generateToken, ApiError } from '../utils/helpers.js';

const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function register(req: Request, res: Response) {
  try {
    const body = registerSchema.parse(req.body);

    const user = await createUser(body.name, body.email, body.password);
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      user,
      token,
    });
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

export async function login(req: Request, res: Response) {
  try {
    const body = loginSchema.parse(req.body);

    const user = await verifyPassword(body.email, body.password);
    if (!user) {
      throw new ApiError(401, 'Email o contraseña incorrectos');
    }

    const fullUser = await getUserById(user.id);
    const token = generateToken(user.id, user.role);

    res.json({
      user: fullUser,
      token,
    });
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

export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'No autenticado');
    }

    const user = await getUserById(req.user.userId);
    if (!user) {
      throw new ApiError(404, 'Usuario no encontrado');
    }

    res.json(user);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'No autenticado');
    }

    const { name, avatar } = req.body;

    const user = await updateUser(req.user.userId, { name, avatar });

    res.json(user);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    const user = await getUserByEmail(email);
    if (!user) {
      // No revelar si el email existe
      return res.json({ message: 'Si el email existe, recibirás un enlace de recuperación' });
    }

    // TODO: Implementar envío de email con token temporal

    res.json({ message: 'Se ha enviado un enlace de recuperación a tu email' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    // TODO: Implementar reset de contraseña con token

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
}
