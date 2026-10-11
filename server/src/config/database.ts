import { config as loadDotEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from the server root (where this file sits relative to src/config).
const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);
loadDotEnv({ path: path.resolve(_dirname, '../../.env') });

function parsePort(value: string | undefined): number {
  const parsed = parseInt(value || '5432', 10);
  return Number.isFinite(parsed) ? parsed : 5432;
}

export const databaseConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parsePort(process.env.DB_PORT),
  database: process.env.DB_NAME || 'ventas_garzon',
};

export const serverConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
