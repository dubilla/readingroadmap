import { books, lanes, type Book, type InsertBook, type Lane, type InsertLane, DEFAULT_LANES } from "@shared/schema";
import { READING_SPEEDS, AVG_WORDS_PER_PAGE } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Lane operations
  getAllLanes(): Promise<Lane[]>;
  getLane(id: number): Promise<Lane | undefined>;
  createLane(lane: InsertLane): Promise<Lane>;
  updateLane(id: number, updates: Partial<Lane>): Promise<Lane>;

  // Book operations
  getAllBooks(): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, updates: Partial<Book>): Promise<Book>;
  updateBookLane(id: number, laneId: number): Promise<Book>;
  updateReadingProgress(id: number, progress: number): Promise<Book>;
}

export class DatabaseStorage implements IStorage {
  async getAllLanes(): Promise<Lane[]> {
    try {
      return await db.select().from(lanes).orderBy(lanes.order);
    } catch (error) {
      console.error('Error fetching lanes:', error);
      return [];
    }
  }

  async getLane(id: number): Promise<Lane | undefined> {
    try {
      const [lane] = await db.select().from(lanes).where(eq(lanes.id, id));
      return lane;
    } catch (error) {
      console.error(`Error fetching lane ${id}:`, error);
      return undefined;
    }
  }

  async createLane(lane: InsertLane): Promise<Lane> {
    const [newLane] = await db.insert(lanes).values(lane).returning();
    return newLane;
  }

  async updateLane(id: number, updates: Partial<Lane>): Promise<Lane> {
    const [updatedLane] = await db
      .update(lanes)
      .set(updates)
      .where(eq(lanes.id, id))
      .returning();

    if (!updatedLane) throw new Error(`Lane ${id} not found`);
    return updatedLane;
  }

  async getAllBooks(): Promise<Book[]> {
    try {
      return await db.select().from(books);
    } catch (error) {
      console.error('Error fetching books:', error);
      return [];
    }
  }

  async getBook(id: number): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book;
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const estimatedMinutes = Math.round(
      (insertBook.pages * AVG_WORDS_PER_PAGE) / READING_SPEEDS.AVERAGE
    );

    const [book] = await db
      .insert(books)
      .values({
        ...insertBook,
        readingProgress: 0,
        estimatedMinutes,
      })
      .returning();

    return book;
  }

  async updateBook(id: number, updates: Partial<Book>): Promise<Book> {
    const [updatedBook] = await db
      .update(books)
      .set(updates)
      .where(eq(books.id, id))
      .returning();

    if (!updatedBook) throw new Error(`Book ${id} not found`);
    return updatedBook;
  }

  async updateBookLane(id: number, laneId: number): Promise<Book> {
    const lane = await this.getLane(laneId);
    if (!lane) throw new Error(`Lane ${laneId} not found`);

    return this.updateBook(id, { laneId });
  }

  async updateReadingProgress(id: number, progress: number): Promise<Book> {
    return this.updateBook(id, {
      readingProgress: progress,
      status: progress >= 100 ? "completed" : "reading"
    });
  }
}

// Initialize storage with database implementation
export const storage = new DatabaseStorage();

// Initialize default lanes if they don't exist
async function initializeDefaultLanes() {
  try {
    console.log('Checking for existing lanes...');
    const existingLanes = await storage.getAllLanes();

    if (existingLanes.length === 0) {
      console.log('No lanes found, creating default lanes...');
      for (const lane of DEFAULT_LANES) {
        await storage.createLane(lane);
      }
      console.log('Default lanes created successfully');
    } else {
      console.log(`Found ${existingLanes.length} existing lanes`);
    }
  } catch (error) {
    console.error('Error initializing default lanes:', error);
  }
}

// Call initialization
initializeDefaultLanes().catch(console.error);