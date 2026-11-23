import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or generated UUID
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  name: text('name').notNull(),
  role: text('role').notNull().default('USER'), // 'ADMIN' or 'USER'
  isActive: boolean('is_active').notNull().default(true),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Health logs (CRUD Data Kesehatan)
export const healthLogs = pgTable('health_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  time: text('time').notNull(), // HH:mm
  energy: integer('energy').notNull(), // 1 - 10
  mood: text('mood').notNull(), // Sangat Baik, Baik, Netral, Buruk, Cemas, dll
  bodyCondition: text('body_condition').notNull(), // Segar, Lemas, Pegal, Nyeri
  stomachCondition: text('stomach_condition').notNull(), // Nyaman, Kembung, Mual, Begah, Perih
  stressLevel: integer('stress_level').notNull(), // 1 - 10
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Meals (CRUD Data Makanan)
export const meals = pgTable('meals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(), // Sarapan, Makan Siang, Makan Malam, Snack
  portion: text('portion').notNull(), // Kecil, Sedang, Besar, 1 Porsi
  date: text('date').notNull(), // YYYY-MM-DD
  time: text('time').notNull(), // HH:mm
  imageUrl: text('image_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Pre-meal conditions (CRUD Kondisi Sebelum Makan)
export const preMealLogs = pgTable('pre_meal_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  mealId: integer('meal_id').references(() => meals.id, { onDelete: 'set null' }),
  date: text('date').notNull(),
  time: text('time').notNull(),
  hungerLevel: integer('hunger_level').notNull(), // 1 - 10
  energy: integer('energy').notNull(), // 1 - 10
  mood: text('mood').notNull(),
  stomachCondition: text('stomach_condition').notNull(),
  bodyCondition: text('body_condition').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Post-meal conditions (CRUD Kondisi Setelah Makan)
export const postMealLogs = pgTable('post_meal_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  mealId: integer('meal_id').references(() => meals.id, { onDelete: 'set null' }),
  date: text('date').notNull(),
  time: text('time').notNull(),
  energy: integer('energy').notNull(), // 1 - 10
  mood: text('mood').notNull(),
  fullnessLevel: integer('fullness_level').notNull(), // 1 - 10
  stomachCondition: text('stomach_condition').notNull(),
  isSleepy: boolean('is_sleepy').default(false).notNull(),
  isNauseous: boolean('is_nauseous').default(false).notNull(),
  isBloated: boolean('is_bloated').default(false).notNull(),
  discomfortLevel: integer('discomfort_level').default(0).notNull(), // 0 - 10
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Symptoms (CRUD Data Gejala)
export const symptoms = pgTable('symptoms', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  intensity: integer('intensity').notNull(), // 1 - 10
  date: text('date').notNull(),
  time: text('time').notNull(),
  duration: text('duration').notNull(), // e.g. "30 Menit", "2 Jam"
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sleep logs (CRUD Data Tidur)
export const sleepLogs = pgTable('sleep_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  date: text('date').notNull(), // Tanggal bangun (YYYY-MM-DD)
  sleepTime: text('sleep_time').notNull(), // HH:mm
  wakeTime: text('wake_time').notNull(), // HH:mm
  durationHours: doublePrecision('duration_hours').notNull(),
  quality: integer('quality').notNull(), // 1 - 5 (Buruk -> Sangat Nyenyak)
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Activity logs (CRUD Data Aktivitas)
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  activityName: text('activity_name').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  intensity: text('intensity').notNull(), // Rendah, Sedang, Tinggi
  date: text('date').notNull(),
  time: text('time').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Hydration logs (CRUD Data Hidrasi)
export const hydrationLogs = pgTable('hydration_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  amountMl: integer('amount_ml').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Admin Food Database
export const foodDatabase = pgTable('food_database', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  calories: integer('calories').default(0).notNull(),
  protein: doublePrecision('protein').default(0).notNull(),
  carbs: doublePrecision('carbs').default(0).notNull(),
  fat: doublePrecision('fat').default(0).notNull(),
  standardPortion: text('standard_portion').default('1 Porsi').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Admin Education Articles
export const educationArticles = pgTable('education_articles', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  summary: text('summary').notNull(),
  content: text('content').notNull(),
  author: text('author').default('Tim Dokter MedikaCheck').notNull(),
  readTime: text('read_time').default('4 min read').notNull(),
  isPublished: boolean('is_published').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Admin Categories
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // MEAL, SYMPTOM, ACTIVITY, ARTICLE
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Admin Notifications / Announcements
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  targetRole: text('target_role').default('ALL').notNull(), // ALL, USER, ADMIN
  type: text('type').default('INFO').notNull(), // INFO, TIP, ALERT
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Password resets
export const passwordResets = pgTable('password_resets', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Health Examinations (Catatan Pemeriksaan Kesehatan Mandiri Terintegrasi)
export const healthExaminations = pgTable('health_examinations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  type: text('type').notNull(), // 'MENTAL' | 'PHYSICAL' | 'NUTRITION'
  title: text('title').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  time: text('time').notNull(), // HH:mm
  score: integer('score'), // Numeric score 0-100 (if applicable)
  status: text('status').notNull(), // e.g. "Selesai", "Kondisi Baik", "Lelah Ringan", dll
  category: text('category').notNull(),
  summary: text('summary').notNull(),
  answers: text('answers').notNull(), // JSON string
  results: text('results').notNull(), // JSON string
  recommendations: text('recommendations'), // JSON string of recommendations
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// System Activities (Audit log aktivitas nyata untuk Dashboard Admin)
export const systemActivities = pgTable('system_activities', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  userName: text('user_name').notNull(),
  userEmail: text('user_email').notNull(),
  action: text('action').notNull(), // 'REGISTER' | 'LOGIN' | 'EXAMINATION' | 'PROFILE_UPDATE'
  description: text('description').notNull(),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  healthLogs: many(healthLogs),
  meals: many(meals),
  preMealLogs: many(preMealLogs),
  postMealLogs: many(postMealLogs),
  symptoms: many(symptoms),
  sleepLogs: many(sleepLogs),
  activityLogs: many(activityLogs),
  hydrationLogs: many(hydrationLogs),
  healthExaminations: many(healthExaminations),
  systemActivities: many(systemActivities),
}));

export const mealsRelations = relations(meals, ({ one, many }) => ({
  user: one(users, {
    fields: [meals.userId],
    references: [users.id],
  }),
  preMeal: many(preMealLogs),
  postMeal: many(postMealLogs),
}));

export const healthExaminationsRelations = relations(healthExaminations, ({ one }) => ({
  user: one(users, {
    fields: [healthExaminations.userId],
    references: [users.id],
  }),
}));
