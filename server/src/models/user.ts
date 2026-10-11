import { query } from '../database/index.js';
import { hashPassword, comparePasswords, generateToken, validateEmail, ApiError, formatDatabaseError } from '../utils/helpers.js';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  created_at: string;
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const result = await query('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    throw new ApiError(500, 'Error al obtener usuario');
  }
}

export async function getUserByEmail(email: string): Promise<any | null> {
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  } catch (error) {
    throw new ApiError(500, 'Error al obtener usuario');
  }
}

export async function createUser(name: string, email: string, password: string, role = 'customer'): Promise<User> {
  try {
    if (!validateEmail(email)) {
      throw new ApiError(400, 'Email inválido');
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw new ApiError(400, 'El email ya está registrado');
    }

    const hashedPassword = await hashPassword(password);

    const result = await query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, avatar, created_at',
      [name, email, hashedPassword, role]
    );

    return result.rows[0];
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, formatDatabaseError(error));
  }
}

export async function verifyPassword(email: string, password: string): Promise<User | null> {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return null;
    }

    const passwordMatch = await comparePasswords(password, user.password);
    if (!passwordMatch) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    throw new ApiError(500, 'Error al verificar contraseña');
  }
}

export async function updateUser(id: number, data: Partial<User>): Promise<User> {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(data.name);
      paramCount++;
    }

    if (data.avatar !== undefined) {
      updates.push(`avatar = $${paramCount}`);
      values.push(data.avatar);
      paramCount++;
    }

    if (updates.length === 0) {
      const user = await getUserById(id);
      if (!user) throw new ApiError(404, 'Usuario no encontrado');
      return user;
    }

    values.push(id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING id, name, email, role, avatar, created_at`,
      values
    );

    if (!result.rows[0]) {
      throw new ApiError(404, 'Usuario no encontrado');
    }

    return result.rows[0];
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, formatDatabaseError(error));
  }
}
