import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import type { SignOptions } from 'jsonwebtoken';

export function generateToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, config.jwtSecret, { expiresIn: config.jwtExpire } as SignOptions);
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function formatDatabaseError(error: any): string {
  if (error.code === '23505') {
    return 'Este registro ya existe';
  }
  if (error.code === '23503') {
    return 'Referencia no válida';
  }
  return error.message || 'Error en la base de datos';
}
