import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const lanes = pgTable("lanes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  type: text("type").notNull(), // "backlog", "next-up", "in-progress", "completed"
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  pages: integer("pages").notNull(),
  coverUrl: text("cover_url").notNull(),
  status: text("status").notNull(), // "to-read", "reading", "completed"
  laneId: integer("lane_id").notNull(),
  readingProgress: integer("reading_progress").default(0),
  goodreadsId: text("goodreads_id"),
  estimatedMinutes: integer("estimated_minutes").notNull(),
});

export const insertLaneSchema = createInsertSchema(lanes).omit({
  id: true,
}).extend({
  type: z.enum(["backlog", "next-up", "in-progress", "completed"])
});

export const insertBookSchema = createInsertSchema(books).omit({ 
  id: true,
  readingProgress: true,
  estimatedMinutes: true 
}).extend({
  pages: z.number().min(1),
  status: z.enum(["to-read", "reading", "completed"])
});

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

// Default lanes configuration
export const DEFAULT_LANES = [
  {
    name: "Backlog",
    description: "Books to read eventually",
    order: 0,
    type: "backlog"
  },
  {
    name: "Next Up",
    description: "Books to read soon",
    order: 1,
    type: "next-up"
  },
  {
    name: "Currently Reading",
    description: "Books in progress",
    order: 2,
    type: "in-progress"
  },
  {
    name: "Finished",
    description: "Completed books",
    order: 3,
    type: "completed"
  }
] as const;