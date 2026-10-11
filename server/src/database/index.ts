import { Pool, QueryResult } from 'pg';
import type { PoolClient } from 'pg';
import { databaseConfig } from '../config/database.js';
import { setTimeout as sleep } from 'node:timers/promises';

// Los Polls de pg se cierran cuando el proceso termina, pero hay que darle un margen
// de espera para que la conexión al puerto 5432 no aborte de inmediato.
const _DB_CONNECT_RETRY_WINDOW_MS = 3000;


export const pool = new Pool({
  user: databaseConfig.user,
  password: databaseConfig.password,
  host: databaseConfig.host,
  port: databaseConfig.port,
  database: databaseConfig.database,
});

// Pool "raíz" para administración (crear la base de datos si no existe)
const adminPool = new Pool({
  user: databaseConfig.user,
  password: databaseConfig.password,
  host: databaseConfig.host,
  port: databaseConfig.port,
  database: 'postgres',
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error', { text, error });
    throw error;
  }
}

export async function connect() {
  const client = await pool.connect();
  return client;
}

export async function ensureDatabaseExists(timeoutMs = 3000): Promise<void> {
  // Espera atenta a que PostgreSQL esté listo (si no lo está, no se pierde el proceso)
  const deadline = Date.now() + timeoutMs;
  let pgReady = false;
  while (!pgReady && Date.now() < deadline) {
    try {
      const readyClient = await adminPool.connect();
      try {
        const check = await readyClient.query('SELECT 1 AS ok');
        readyClient.release();
        pgReady = check.rows?.[0]?.ok === 1;
      } finally {
        readyClient.release();
      }
    } catch {
      // Silencioso, vamos esperando
    }
    await sleep(250);
  }

  if (!pgReady) {
    console.warn(
      '⚠️  PostgreSQL no responde en ' + databaseConfig.host + ':' + databaseConfig.port +
      '. La base de datos no se comprobará/creará, pero el servidor sí arrancará y responderá a /api/health.',
    );
    return;
  }

  const client = await adminPool.connect();
  try {
    const check = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      databaseConfig.database,
    ]);
    if (check.rowCount === 0) {
      await client.query(`CREATE DATABASE ${databaseConfig.database}`);
      console.log(`✅ Base de datos "${databaseConfig.database}" creada automáticamente`);
    } else {
      console.log(`ℹ️  Base de datos "${databaseConfig.database}" ya existía`);
    }
  } catch (error) {
    // Si no hay servidor de PostgreSQL en el host, el setup se sale batallando,
    // pero el servidor ya arrancó y responde a /api/health. El usuario debe
    // iniciar PostgreSQL y luego reiniciar la app, o ejecutar:
    //   npm run db:setup
    console.warn(
      '⚠️  No se pudo comprobar/crear la base de datos (el servidor de PostgreSQL no responde en ' +
      databaseConfig.host + ':' + databaseConfig.port + ').',
      error instanceof Error ? error.message : String(error),
    );
    console.warn('   Accede a PostgreSQL (psql) e inicializa la BD con:');
    console.warn('   psql -U postgres -d postgres -f database/schema.sql');
  } finally {
    client.release();
  }
}
