import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '').trim();
const sqlHost = (process.env.SQL_HOST || '').trim();
const sqlDbName = (process.env.SQL_DB_NAME || '').trim();
const user = (process.env.SQL_ADMIN_USER || process.env.SQL_USER || '').trim();
const password = (process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || '').trim();
const isLocalHost =
  sqlHost === 'localhost' ||
  sqlHost === '127.0.0.1' ||
  sqlHost === '::1' ||
  sqlHost.startsWith('/');
const isSslRequired =
  process.env.DB_SSL === 'true' ||
  sqlHost.includes('neon.tech') ||
  sqlHost.includes('neon.com') ||
  (process.env.DB_SSL !== 'false' && Boolean(sqlHost) && !isLocalHost);

if (!connectionString && (!sqlHost || !sqlDbName || !user)) {
  console.warn("Database configuration not fully set. Set DATABASE_URL or SQL_* variables.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: connectionString
    ? {
        url: connectionString,
        ssl: true,
      }
    : {
        host: sqlHost || 'localhost',
        user: user || 'postgres',
        password: password || '',
        database: sqlDbName || 'postgres',
        ssl: isSslRequired ? { rejectUnauthorized: false } : false,
      },
  verbose: true,
});
