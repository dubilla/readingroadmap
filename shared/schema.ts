// Supabase Database Schema
// This project uses Supabase for database, authentication, and API.
// For local development, use: supabase start && supabase db reset
// For production, use Supabase Cloud.

import { z } from "zod";

// Reading speed constants
export const READING_SPEEDS = {
  slow: 150, // words per minute
  average: 250,
  fast: 350,
} as const;

export const AVG_WORDS_PER_PAGE = 250;

// Frontend types (camelCase)
export interface Book {
  id: number;
  title: string;
  author: string;
  pages: number;
  coverUrl: string;
  status: 'to-read' | 'reading' | 'completed';
  userId: string;
  laneId: number | null;
  readingProgress: number;
  goodreadsId?: string;
  estimatedMinutes: number;
  addedAt: string;
}

export interface UserLane {
  id: number;
  name: string;
  userId: string;
  order: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  hashedPassword: string;
  createdAt: string;
}

export type GoalType = 'books' | 'pages';

export interface ReadingGoal {
  id: number;
  userId: string;
  goalType: GoalType;
  targetCount: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingGoalWithProgress extends ReadingGoal {
  currentCount: number;
  progressPercentage: number;
}

// Zod schemas for validation (API layer - camelCase)
export const insertUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  hashedPassword: z.string().min(1),
});

export const insertUserLaneSchema = z.object({
  name: z.string().min(1),
  userId: z.string().uuid(),
  order: z.number(),
});

export const insertBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  pages: z.number().min(1),
  coverUrl: z.string().url(),
  status: z.enum(['to-read', 'reading', 'completed']),
  userId: z.string().uuid(),
  laneId: z.number().nullable().optional(),
  readingProgress: z.number().default(0),
  goodreadsId: z.string().optional(),
  estimatedMinutes: z.number(),
});

export const insertReadingGoalSchema = z.object({
  goalType: z.enum(['books', 'pages']),
  targetCount: z.number().min(1),
  year: z.number().min(2000).max(2100),
});

export const updateReadingGoalSchema = z.object({
  goalType: z.enum(['books', 'pages']).optional(),
  targetCount: z.number().min(1).optional(),
  year: z.number().min(2000).max(2100).optional(),
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertUserLane = z.infer<typeof insertUserLaneSchema>;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type InsertReadingGoal = z.infer<typeof insertReadingGoalSchema>;
export type UpdateReadingGoal = z.infer<typeof updateReadingGoalSchema>;