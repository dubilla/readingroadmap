import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertBookSchema, insertLaneSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  // Lane routes
  app.get("/api/lanes", async (_req, res) => {
    const lanes = await storage.getAllLanes();
    console.log('GET /api/lanes response:', lanes);
    res.json(lanes);
  });

  app.post("/api/lanes", async (req, res) => {
    const result = insertLaneSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid lane data" });
    }

    const lane = await storage.createLane(result.data);
    res.json(lane);
  });

  app.patch("/api/lanes/:id", async (req, res) => {
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
  app.get("/api/books", async (_req, res) => {
    const books = await storage.getAllBooks();
    console.log('GET /api/books response:', books);
    res.json(books);
  });

  app.post("/api/books", async (req, res) => {
    const result = insertBookSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid book data" });
    }

    const book = await storage.createBook(result.data);
    res.json(book);
  });

  app.patch("/api/books/:id/lane", async (req, res) => {
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

  app.patch("/api/books/:id/progress", async (req, res) => {
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

  return createServer(app);
}