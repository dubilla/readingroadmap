import type { Express, Request, Response } from "express";
import { createServer } from "http";
import passport from "passport";
import { storage } from "./storage";
import { isAuthenticated, getCurrentUser, hashPassword } from "./auth";
import { insertBookSchema, insertLaneSchema, insertSwimlaneSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express) {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validate registration data
      const registerSchema = insertUserSchema.extend({
        password: z.string().min(8)
      });
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = result.error.errors[0]?.message || "Invalid registration data";
        return res.status(400).json({ error: errorMessage });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(result.data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }

      // Create user
      const user = await storage.createUser(result.data);
      
      // Remove password from response
      const { hashedPassword, ...safeUser } = user;
      
      // Log in user automatically
      req.login(safeUser, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({ error: "Failed to log in after registration" });
        }
        console.log("User logged in after registration:", safeUser);
        return res.status(201).json(safeUser);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: info.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(user);
  });

  // Protected API routes
  // Swimlane routes
  app.get("/api/swimlanes", isAuthenticated, async (req, res) => {
    const user = getCurrentUser(req);
    const swimlanes = await storage.getAllSwimlanes();
    // Filter for user's swimlanes
    const userSwimlanes = swimlanes.filter(s => !s.userId || s.userId === user.id);
    console.log('GET /api/swimlanes response:', userSwimlanes);
    res.json(userSwimlanes);
  });

  app.post("/api/swimlanes", isAuthenticated, async (req, res) => {
    const user = getCurrentUser(req);
    
    const result = insertSwimlaneSchema.safeParse({
      ...req.body,
      userId: user.id
    });
    
    if (!result.success) {
      return res.status(400).json({ error: "Invalid swimlane data" });
    }

    const swimlane = await storage.createSwimlane(result.data);
    res.json(swimlane);
  });

  // Lane routes
  app.get("/api/lanes", isAuthenticated, async (req, res) => {
    const lanes = await storage.getAllLanes();
    console.log('GET /api/lanes response:', lanes);
    res.json(lanes);
  });

  app.get("/api/swimlanes/:id/lanes", isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const lanes = await storage.getLanesForSwimlane(parseInt(id));
    res.json(lanes);
  });

  app.get("/api/lanes/completed", isAuthenticated, async (_req, res) => {
    const lane = await storage.getCompletedLane();
    res.json(lane);
  });

  app.post("/api/lanes", isAuthenticated, async (req, res) => {
    const result = insertLaneSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid lane data" });
    }

    const lane = await storage.createLane(result.data);
    res.json(lane);
  });

  app.patch("/api/lanes/:id", isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
      const lane = await storage.updateLane(parseInt(id), updates);
      res.json(lane);
    } catch (error) {
      res.status(404).json({ error: "Lane not found" });
    }
  });

  // Book routes
  app.get("/api/books", isAuthenticated, async (req, res) => {
    const user = getCurrentUser(req);
    const books = await storage.getBooksForUser(user.id);
    console.log('GET /api/books response:', books);
    res.json(books);
  });

  app.post("/api/books", isAuthenticated, async (req, res) => {
    const user = getCurrentUser(req);
    
    const result = insertBookSchema.safeParse({
      ...req.body,
      userId: user.id
    });
    
    if (!result.success) {
      return res.status(400).json({ error: "Invalid book data" });
    }

    const book = await storage.createBook(result.data);
    res.json(book);
  });

  app.patch("/api/books/:id/lane", isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { laneId } = req.body;

    if (typeof laneId !== "number") {
      return res.status(400).json({ error: "Invalid lane ID" });
    }

    try {
      const book = await storage.updateBookLane(parseInt(id), laneId);
      res.json(book);
    } catch (error) {
      res.status(404).json({ error: "Book or lane not found" });
    }
  });

  app.patch("/api/books/:id/progress", isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { progress } = req.body;

    if (typeof progress !== "number" || progress < 0 || progress > 100) {
      return res.status(400).json({ error: "Invalid progress" });
    }

    try {
      const book = await storage.updateReadingProgress(parseInt(id), progress);
      res.json(book);
    } catch (error) {
      res.status(404).json({ error: "Book not found" });
    }
  });

  app.get("/api/books/search", isAuthenticated, async (req, res) => {
    const { query } = req.query;
    console.log('Search query:', query);

    if (typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    try {
      const results = await storage.searchBooks(query);
      console.log('Search results:', results);
      res.json(results);
    } catch (error) {
      console.error('Error searching books:', error);
      res.status(500).json({ error: "Failed to search books" });
    }
  });

  return createServer(app);
}