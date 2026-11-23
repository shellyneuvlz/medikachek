import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
    const isNeon = connectionString?.includes('neon.tech') || process.env.SQL_HOST?.includes('neon.tech');
    const isSslRequired = Boolean(
      connectionString?.includes('sslmode=') ||
      isNeon ||
      process.env.DB_SSL === 'true'
    );

    const poolConfig = connectionString
      ? {
          connectionString,
          ssl: isSslRequired ? { rejectUnauthorized: false } : undefined,
          max: 10,
          idleTimeoutMillis: 15000,
          connectionTimeoutMillis: 20000,
          keepAlive: true,
          keepAliveInitialDelayMillis: 5000,
        }
      : {
          host: process.env.SQL_HOST,
          port: Number(process.env.SQL_PORT) || 5432,
          user: process.env.SQL_USER,
          password: process.env.SQL_PASSWORD,
          database: process.env.SQL_DB_NAME,
          ssl: isSslRequired ? { rejectUnauthorized: false } : undefined,
          max: 10,
          idleTimeoutMillis: 15000,
          connectionTimeoutMillis: 20000,
          keepAlive: true,
          keepAliveInitialDelayMillis: 5000,
        };

    global._postgresPool = new Pool(poolConfig);

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });

export async function withDbRetry<T>(operation: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || '').toLowerCase();
      const code = String(err?.code || '');
      const isTransient =
        code === 'ECONNRESET' ||
        code === 'ETIMEDOUT' ||
        code === 'EPIPE' ||
        code === '57P01' ||
        code === '08006' ||
        code === '08001' ||
        msg.includes('connection terminated') ||
        msg.includes('connection reset') ||
        msg.includes('timeout');
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw lastError;
}
