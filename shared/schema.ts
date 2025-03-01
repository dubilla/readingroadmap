import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  pages: integer("pages").notNull(),
  coverUrl: text("cover_url").notNull(),
  status: text("status").notNull(), // "to-read", "reading", "completed"
  lane: text("lane").notNull(), // "backlog", "next-up", "in-progress", "completed"
  readingProgress: integer("reading_progress").default(0),
  goodreadsId: text("goodreads_id"),
  estimatedMinutes: integer("estimated_minutes").notNull(),
});

export const insertBookSchema = createInsertSchema(books).omit({ 
  id: true,
  readingProgress: true,
  estimatedMinutes: true 
}).extend({
  pages: z.number().min(1),
  status: z.enum(["to-read", "reading", "completed"]),
  lane: z.enum(["backlog", "next-up", "in-progress", "completed"])
});

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
