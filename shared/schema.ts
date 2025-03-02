import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const swimlanes = pgTable("swimlanes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
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
  laneId: integer("lane_id").notNull(),
  readingProgress: integer("reading_progress").default(0),
  goodreadsId: text("goodreads_id"),
  estimatedMinutes: integer("estimated_minutes").notNull(),
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
  estimatedMinutes: true 
}).extend({
  pages: z.number().min(1),
  status: z.enum(["to-read", "reading", "completed"])
});

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

// Default swimlane
export const DEFAULT_SWIMLANE = {
  name: "General Reading",
  description: "General books to read",
  order: 0,
} as const;

// Default lanes configuration for each swimlane
export const DEFAULT_SWIMLANE_LANES = [
  {
    name: "Backlog",
    description: "Books to read eventually",
    order: 0,
    type: "backlog" as const
  },
  {
    name: "Currently Reading",
    description: "Books in progress",
    order: 1,
    type: "in-progress" as const
  }
] as const;

// Completed lane configuration (single lane for all completed books)
export const COMPLETED_LANE = {
  name: "Read",
  description: "Finished books",
  order: 999, // Always at the end
  type: "completed" as const,
  swimlaneId: null // No swimlane for completed books
} as const;