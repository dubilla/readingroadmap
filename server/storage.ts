import { books, lanes, type Book, type InsertBook, type Lane, type InsertLane, DEFAULT_LANES } from "@shared/schema";
import { READING_SPEEDS, AVG_WORDS_PER_PAGE } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private books: Map<number, Book>;
  private lanes: Map<number, Lane>;
  private bookId: number;
  private laneId: number;

  constructor() {
    this.books = new Map();
    this.lanes = new Map();
    this.bookId = 1;
    this.laneId = 1;

    // Initialize default lanes
    DEFAULT_LANES.forEach(lane => {
      const id = this.laneId++;
      this.lanes.set(id, { ...lane, id });
    });
  }

  async getAllLanes(): Promise<Lane[]> {
    return Array.from(this.lanes.values())
      .sort((a, b) => a.order - b.order);
  }

  async getLane(id: number): Promise<Lane | undefined> {
    return this.lanes.get(id);
  }

  async createLane(insertLane: InsertLane): Promise<Lane> {
    const id = this.laneId++;
    const lane: Lane = { ...insertLane, id };
    this.lanes.set(id, lane);
    return lane;
  }

  async updateLane(id: number, updates: Partial<Lane>): Promise<Lane> {
    const lane = await this.getLane(id);
    if (!lane) throw new Error(`Lane ${id} not found`);

    const updatedLane = { ...lane, ...updates };
    this.lanes.set(id, updatedLane);
    return updatedLane;
  }

  async getAllBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }

  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = this.bookId++;
    const estimatedMinutes = Math.round(
      (insertBook.pages * AVG_WORDS_PER_PAGE) / READING_SPEEDS.AVERAGE
    );

    const book: Book = {
      ...insertBook,
      id,
      readingProgress: 0,
      estimatedMinutes,
    };

    this.books.set(id, book);
    return book;
  }

  async updateBook(id: number, updates: Partial<Book>): Promise<Book> {
    const book = await this.getBook(id);
    if (!book) throw new Error(`Book ${id} not found`);

    const updatedBook = { ...book, ...updates };
    this.books.set(id, updatedBook);
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

export const storage = new MemStorage();