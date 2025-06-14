import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  hashedPassword: text("hashed_password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const swimlanes = pgTable("swimlanes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  userId: integer("user_id"), // Made optional for default swimlanes
});

export const lanes = pgTable("lanes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  type: text("type").notNull(), // "backlog", "in-progress", "completed"
  swimlaneId: integer("swimlane_id"), // null for completed lane
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  pages: integer("pages").notNull(),
  coverUrl: text("cover_url").notNull(),
  status: text("status").notNull(), // "to-read", "reading", "completed"
  userId: integer("user_id").notNull(), // Added user relationship
  laneId: integer("lane_id"), // Now optional - null means it's in the user's general backlog
  readingProgress: integer("reading_progress").default(0),
  goodreadsId: text("goodreads_id"),
  estimatedMinutes: integer("estimated_minutes").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  hashedPassword: true,
  createdAt: true,
});

export const insertSwimlaneSchema = createInsertSchema(swimlanes).omit({
  id: true,
});

export const insertLaneSchema = createInsertSchema(lanes).omit({
  id: true,
}).extend({
  type: z.enum(["backlog", "in-progress", "completed"])
});

export const insertBookSchema = createInsertSchema(books).omit({ 
  id: true,
  readingProgress: true,
  estimatedMinutes: true,
  addedAt: true
}).extend({
  pages: z.number().min(1),
  status: z.enum(["to-read", "reading", "completed"])
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSwimlane = z.infer<typeof insertSwimlaneSchema>;
export type Swimlane = typeof swimlanes.$inferSelect;

export type InsertLane = z.infer<typeof insertLaneSchema>;
export type Lane = typeof lanes.$inferSelect;

export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;

// Reading speed - average words per minute
export const READING_SPEEDS = {
  SLOW: 150,
  AVERAGE: 250,
  FAST: 400
};

// Average words per page for books
export const AVG_WORDS_PER_PAGE = 250;