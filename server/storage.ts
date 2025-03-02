import { books, lanes, swimlanes, type Book, type InsertBook, type Lane, type InsertLane, type Swimlane, type InsertSwimlane } from "@shared/schema";
import { DEFAULT_SWIMLANE, DEFAULT_SWIMLANE_LANES, COMPLETED_LANE } from "@shared/schema";
import { READING_SPEEDS, AVG_WORDS_PER_PAGE } from "@shared/schema";
import { db } from "./db";
import { eq, isNull, and } from "drizzle-orm";

export interface IStorage {
  // Swimlane operations
  getAllSwimlanes(): Promise<Swimlane[]>;
  getSwimlane(id: number): Promise<Swimlane | undefined>;
  createSwimlane(swimlane: InsertSwimlane): Promise<Swimlane>;

  // Lane operations
  getAllLanes(): Promise<Lane[]>;
  getLanesForSwimlane(swimlaneId: number): Promise<Lane[]>;
  getCompletedLane(): Promise<Lane | undefined>;
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
  // Swimlane operations
  async getAllSwimlanes(): Promise<Swimlane[]> {
    try {
      return await db.select().from(swimlanes).orderBy(swimlanes.order);
    } catch (error) {
      console.error('Error fetching swimlanes:', error);
      return [];
    }
  }

  async getSwimlane(id: number): Promise<Swimlane | undefined> {
    try {
      const [swimlane] = await db.select().from(swimlanes).where(eq(swimlanes.id, id));
      return swimlane;
    } catch (error) {
      console.error(`Error fetching swimlane ${id}:`, error);
      return undefined;
    }
  }

  async createSwimlane(swimlane: InsertSwimlane): Promise<Swimlane> {
    const [newSwimlane] = await db.insert(swimlanes).values(swimlane).returning();
    return newSwimlane;
  }

  // Lane operations
  async getAllLanes(): Promise<Lane[]> {
    try {
      return await db.select().from(lanes).orderBy(lanes.order);
    } catch (error) {
      console.error('Error fetching lanes:', error);
      return [];
    }
  }

  async getLanesForSwimlane(swimlaneId: number): Promise<Lane[]> {
    try {
      return await db.select()
        .from(lanes)
        .where(eq(lanes.swimlaneId, swimlaneId))
        .orderBy(lanes.order);
    } catch (error) {
      console.error(`Error fetching lanes for swimlane ${swimlaneId}:`, error);
      return [];
    }
  }

  async getCompletedLane(): Promise<Lane | undefined> {
    try {
      const [completedLane] = await db.select()
        .from(lanes)
        .where(and(
          eq(lanes.type, "completed"),
          isNull(lanes.swimlaneId)
        ));
      return completedLane;
    } catch (error) {
      console.error('Error fetching completed lane:', error);
      return undefined;
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

  // Book operations
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
    const book = await this.getBook(id);
    if (!book) throw new Error(`Book ${id} not found`);

    // If book is completed, move it to the completed lane
    let updates: Partial<Book> = {
      readingProgress: progress,
      status: progress >= 100 ? "completed" : "reading"
    };

    if (progress >= 100) {
      const completedLane = await this.getCompletedLane();
      if (completedLane) {
        updates.laneId = completedLane.id;
      }
    }

    return this.updateBook(id, updates);
  }
}

// Initialize storage with database implementation
export const storage = new DatabaseStorage();

// Initialize default swimlane and lanes if they don't exist
async function initializeDefaultLanes() {
  try {
    console.log('Checking for existing swimlanes...');
    const existingSwimlanes = await storage.getAllSwimlanes();

    if (existingSwimlanes.length === 0) {
      console.log('Creating default swimlane...');
      const swimlane = await storage.createSwimlane(DEFAULT_SWIMLANE);

      console.log('Creating default lanes for swimlane...');
      for (const lane of DEFAULT_SWIMLANE_LANES) {
        await storage.createLane({
          ...lane,
          swimlaneId: swimlane.id
        });
      }

      console.log('Creating completed lane...');
      await storage.createLane(COMPLETED_LANE);
    } else {
      console.log(`Found ${existingSwimlanes.length} existing swimlanes`);
    }
  } catch (error) {
    console.error('Error initializing default lanes:', error);
  }
}

// Call initialization
initializeDefaultLanes().catch(console.error);