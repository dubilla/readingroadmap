import { pgTable, serial, text, integer, timestamp, uuid, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core'

export const bookStatusEnum = pgEnum('book_status', ['to-read', 'reading', 'completed'])
export const goalTypeEnum = pgEnum('goal_type', ['books', 'pages'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
})

export const userLanes = pgTable('user_lanes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  order: integer('order').notNull(),
}, (table) => [
  index('user_lanes_user_id_idx').on(table.userId),
])

export const swimlanes = pgTable('swimlanes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  order: integer('order').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
})

export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  pages: integer('pages').notNull(),
  coverUrl: text('cover_url').notNull(),
  status: bookStatusEnum('status').default('to-read').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  laneId: integer('lane_id').references(() => userLanes.id, { onDelete: 'set null' }),
  readingProgress: integer('reading_progress').default(0).notNull(),
  goodreadsId: text('goodreads_id'),
  estimatedMinutes: integer('estimated_minutes').notNull(),
  addedAt: timestamp('added_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index('books_user_id_idx').on(table.userId),
  index('books_lane_id_idx').on(table.laneId),
  index('books_status_idx').on(table.status),
])

export const readingGoals = pgTable('reading_goals', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  goalType: goalTypeEnum('goal_type').notNull(),
  targetCount: integer('target_count').notNull(),
  year: integer('year').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('reading_goals_user_goal_year_idx').on(table.userId, table.goalType, table.year),
  index('reading_goals_user_id_idx').on(table.userId),
])
