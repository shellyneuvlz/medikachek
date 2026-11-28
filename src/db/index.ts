import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema';

declare global {
  var _postgresPool: Pool | undefined;
  var _drizzleDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function cleanEnvValue(value?: string): string {
  return (value || '').trim().replace(/^['"]|['"]$/g, '');
}

export function getPgPoolConfig(options?: {
  useAdminCredentials?: boolean;
  ignoreConnectionString?: boolean;
}): PoolConfig {
  const connectionString = options?.ignoreConnectionString
    ? ''
    : cleanEnvValue(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL);
  const rawHost = cleanEnvValue(process.env.SQL_HOST);
  const sqlHost = rawHost.startsWith('/')
    ? rawHost
    : rawHost.replace(/^https?:\/\//i, '').replace(/\/+$/, '').split(':')[0];
  const sqlPort = Number(cleanEnvValue(process.env.SQL_PORT)) || 5432;
  const sqlDbName = cleanEnvValue(process.env.SQL_DB_NAME);
  const sqlUser = cleanEnvValue(
    options?.useAdminCredentials
      ? process.env.SQL_ADMIN_USER || process.env.SQL_USER
      : process.env.SQL_USER
  );
  const sqlPassword = cleanEnvValue(
    options?.useAdminCredentials
      ? process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD
      : process.env.SQL_PASSWORD
  );

  const isLocalHost =
    sqlHost === 'localhost' ||
    sqlHost === '127.0.0.1' ||
    sqlHost === '::1' ||
    sqlHost.startsWith('/');
  const isNeon =
    connectionString.includes('neon.tech') ||
    connectionString.includes('neon.com') ||
    sqlHost.includes('neon.tech') ||
    sqlHost.includes('neon.com');

  const explicitSslDisabled = cleanEnvValue(process.env.DB_SSL) === 'false';
  const isSslRequired =
    connectionString.includes('sslmode=') ||
    isNeon ||
    process.env.DB_SSL === 'true' ||
    process.env.PGSSLMODE === 'require' ||
    (!explicitSslDisabled && Boolean(sqlHost) && !isLocalHost);

  const isServerless = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

  const sharedPoolSettings: Partial<PoolConfig> = {
    ssl: isSslRequired ? { rejectUnauthorized: false } : undefined,
    max: isServerless ? 5 : 10,
    idleTimeoutMillis: isServerless ? 10000 : 15000,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 5000,
    allowExitOnIdle: isServerless,
  };

  if (connectionString) {
    return {
      connectionString,
      ...sharedPoolSettings,
    };
  }

  return {
    host: sqlHost || 'localhost',
    port: sqlPort,
    user: sqlUser,
    password: sqlPassword,
    database: sqlDbName,
    ...sharedPoolSettings,
  };
}

export const createPool = (options?: { ignoreConnectionString?: boolean }) => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool(getPgPoolConfig(options));

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

export async function switchToFallbackSqlPool(): Promise<boolean> {
  const hasSqlFallback = Boolean(
    (process.env.SQL_HOST || '').trim() &&
      (process.env.SQL_USER || '').trim() &&
      (process.env.SQL_DB_NAME || '').trim()
  );
  if (!hasSqlFallback) return false;

  const oldPool = global._postgresPool;
  global._postgresPool = undefined;
  if (oldPool) {
    await oldPool.end().catch(() => {});
  }

  const fallbackPool = createPool({ ignoreConnectionString: true });
  global._drizzleDb = drizzle(fallbackPool, { schema });
  return true;
}

function getActiveDb() {
  if (!global._drizzleDb) {
    global._drizzleDb = drizzle(createPool(), { schema });
  }
  return global._drizzleDb;
}

export const db: ReturnType<typeof drizzle<typeof schema>> = new Proxy(
  {} as ReturnType<typeof drizzle<typeof schema>>,
  {
    get(_target, prop, receiver) {
      const target = getActiveDb() as any;
      const value = Reflect.get(target, prop, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  }
);

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
        code === '57P03' ||
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
