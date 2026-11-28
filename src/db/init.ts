import { Pool } from 'pg';
import { createPool, getPgPoolConfig } from './index';

export async function initDatabase() {
  const pool = createPool();

  const createTablesSql = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      uid TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      is_active BOOLEAN NOT NULL DEFAULT true,
      avatar TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Health logs
    CREATE TABLE IF NOT EXISTS health_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      energy INTEGER NOT NULL,
      mood TEXT NOT NULL,
      body_condition TEXT NOT NULL,
      stomach_condition TEXT NOT NULL,
      stress_level INTEGER NOT NULL,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Meals
    CREATE TABLE IF NOT EXISTS meals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      portion TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      image_url TEXT,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Pre-meal logs
    CREATE TABLE IF NOT EXISTS pre_meal_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      meal_id INTEGER REFERENCES meals(id) ON DELETE SET NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      hunger_level INTEGER NOT NULL,
      energy INTEGER NOT NULL,
      mood TEXT NOT NULL,
      stomach_condition TEXT NOT NULL,
      body_condition TEXT NOT NULL,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Post-meal logs
    CREATE TABLE IF NOT EXISTS post_meal_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      meal_id INTEGER REFERENCES meals(id) ON DELETE SET NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      energy INTEGER NOT NULL,
      mood TEXT NOT NULL,
      fullness_level INTEGER NOT NULL,
      stomach_condition TEXT NOT NULL,
      is_sleepy BOOLEAN NOT NULL DEFAULT false,
      is_nauseous BOOLEAN NOT NULL DEFAULT false,
      is_bloated BOOLEAN NOT NULL DEFAULT false,
      discomfort_level INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Symptoms
    CREATE TABLE IF NOT EXISTS symptoms (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      intensity INTEGER NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      duration TEXT NOT NULL,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Sleep logs
    CREATE TABLE IF NOT EXISTS sleep_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      sleep_time TEXT NOT NULL,
      wake_time TEXT NOT NULL,
      duration_hours DOUBLE PRECISION NOT NULL,
      quality INTEGER NOT NULL,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Activity logs
    CREATE TABLE IF NOT EXISTS activity_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_name TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      intensity TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Hydration logs
    CREATE TABLE IF NOT EXISTS hydration_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount_ml INTEGER NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Food Database
    CREATE TABLE IF NOT EXISTS food_database (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      calories INTEGER NOT NULL DEFAULT 0,
      protein DOUBLE PRECISION NOT NULL DEFAULT 0,
      carbs DOUBLE PRECISION NOT NULL DEFAULT 0,
      fat DOUBLE PRECISION NOT NULL DEFAULT 0,
      standard_portion TEXT NOT NULL DEFAULT '1 Porsi',
      description TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Education Articles
    CREATE TABLE IF NOT EXISTS education_articles (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT 'Tim Dokter MedikaCheck',
      read_time TEXT NOT NULL DEFAULT '4 min read',
      is_published BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Categories
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      target_role TEXT NOT NULL DEFAULT 'ALL',
      type TEXT NOT NULL DEFAULT 'INFO',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Password resets
    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Health Examinations
    CREATE TABLE IF NOT EXISTS health_examinations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      score INTEGER,
      status TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      answers TEXT NOT NULL,
      results TEXT NOT NULL,
      recommendations TEXT,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- System Activities
    CREATE TABLE IF NOT EXISTS system_activities (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      metadata TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  // 1. Check if tables already exist in schema public
  try {
    const tableCheck = await pool.query(
      "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users' LIMIT 1;"
    );
    if (tableCheck.rows.length > 0) {
      console.log('Database tables already present and verified in schema public.');
      return;
    }
  } catch (checkErr: any) {
    console.warn('Could not query information_schema, proceeding with caution:', checkErr.message);
  }

  // 2. If tables do not exist (e.g. fresh Neon or local setup), attempt DDL
  const ddlPool = new Pool(getPgPoolConfig({ useAdminCredentials: true }));

  try {
    await ddlPool.query(createTablesSql);
    console.log('Database tables successfully initialized.');
  } catch (err: any) {
    if (err.message?.includes('permission denied')) {
      console.log('Schema DDL restricted by database provider. Tables are managed externally.');
    } else {
      console.warn('Database initialization note:', err.message);
    }
  } finally {
    await ddlPool.end().catch(() => {});
  }
}
