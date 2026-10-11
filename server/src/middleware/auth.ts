import { Request, Response, NextFunction } from 'express';
import { verifyToken, ApiError } from '../utils/helpers.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: string;
      };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new ApiError(401, 'Token no proporcionado');
    }

    const token = authorization.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded) {
      throw new ApiError(401, 'Token inválido o expirado');
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(401).json({ message: 'No autorizado' });
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== 'admin') {
      throw new ApiError(403, 'Acceso denegado - Se requieren permisos de administrador');
    }
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(403).json({ message: 'Acceso denegado' });
  }
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  res.status(500).json({ message: 'Error interno del servidor' });
}
