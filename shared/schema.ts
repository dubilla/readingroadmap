// Supabase Database Schema
// This project uses Supabase for database, authentication, and API.
// For local development, use: supabase start && supabase db reset
// For production, use Supabase Cloud.

import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Reading speed constants
export const READING_SPEEDS = {
  slow: 150, // words per minute
  average: 250,
  fast: 350,
} as const;

export const AVG_WORDS_PER_PAGE = 250;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  hashedPassword: text("hashed_password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userLanes = pgTable("user_lanes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  pages: integer("pages").notNull(),
  coverUrl: text("cover_url").notNull(),
  status: text("status").notNull(), // "to-read", "reading", "completed"
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  laneId: integer("lane_id").references(() => userLanes.id, { onDelete: "set null" }), // null = default lane
  readingProgress: integer("reading_progress").default(0),
  goodreadsId: text("goodreads_id"),
  estimatedMinutes: integer("estimated_minutes").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertUserLaneSchema = createInsertSchema(userLanes).omit({
  id: true,
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  addedAt: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertUserLane = z.infer<typeof insertUserLaneSchema>;
export type UserLane = typeof userLanes.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;