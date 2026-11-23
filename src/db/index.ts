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
          connectionTimeoutMillis: 15000,
        }
      : {
          host: process.env.SQL_HOST,
          port: Number(process.env.SQL_PORT) || 5432,
          user: process.env.SQL_USER,
          password: process.env.SQL_PASSWORD,
          database: process.env.SQL_DB_NAME,
          ssl: isSslRequired ? { rejectUnauthorized: false } : undefined,
          max: 10,
          connectionTimeoutMillis: 15000,
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
