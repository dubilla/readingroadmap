import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertBookSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  app.get("/api/books", async (_req, res) => {
    const books = await storage.getAllBooks();
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
    const { lane } = req.body;

    if (!lane || typeof lane !== "string") {
      return res.status(400).json({ error: "Invalid lane" });
    }

    try {
      const book = await storage.updateBookLane(parseInt(id), lane);
      res.json(book);
    } catch (error) {
      res.status(404).json({ error: "Book not found" });
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
