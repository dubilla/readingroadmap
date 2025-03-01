import { books, type Book, type InsertBook } from "@shared/schema";
import { READING_SPEEDS, AVG_WORDS_PER_PAGE } from "@shared/schema";

export interface IStorage {
  getAllBooks(): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, updates: Partial<Book>): Promise<Book>;
  updateBookLane(id: number, lane: string): Promise<Book>;
  updateReadingProgress(id: number, progress: number): Promise<Book>;
}

export class MemStorage implements IStorage {
  private books: Map<number, Book>;
  private currentId: number;

  constructor() {
    this.books = new Map();
    this.currentId = 1;
  }

  async getAllBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }

  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = this.currentId++;
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

  async updateBookLane(id: number, lane: string): Promise<Book> {
    return this.updateBook(id, { lane });
  }

  async updateReadingProgress(id: number, progress: number): Promise<Book> {
    return this.updateBook(id, { 
      readingProgress: progress,
      status: progress >= 100 ? "completed" : "reading"
    });
  }
}

export const storage = new MemStorage();
