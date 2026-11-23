import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

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
        ssl: false,
      },
  verbose: true,
});
