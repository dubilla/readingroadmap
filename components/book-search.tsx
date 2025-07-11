'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { apiRequest } from "@/lib/queryClient";
import { searchBooks, getCoverImageUrl } from "@/lib/openLibrary";
import type { Book } from "@shared/schema";

interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
}

interface SearchResult {
  id?: number; // Local database ID if it exists
  title: string;
  author: string;
  pages: number;
  coverUrl: string;
  isLocal: boolean;
  openLibraryData?: OpenLibraryBook; // Original Open Library data if from external API
}

export function BookSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        setIsAuthenticated(response.ok);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const addBookMutation = useMutation({
    mutationFn: async (book: SearchResult) => {
      await apiRequest("POST", "/api/books", {
        title: book.title,
        author: book.author,
        pages: book.pages,
        coverUrl: book.coverUrl,
        status: "to-read",
        laneId: null // Default to null (default lane)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setOpen(false);
    }
  });

  // Search both local database and Open Library
  const handleSearch = async (value: string) => {
    if (!value) {
      setResults([]);
      return;
    }

    console.log('🔍 Starting search for:', value);
    setIsSearching(true);
    try {
      // Search local database
      console.log('📚 Searching local database...');
      const localResponse = await fetch(`/api/books/search?query=${encodeURIComponent(value)}`);
      let localBooks: Book[] = [];
      
      console.log('📊 Local search response status:', localResponse.status);
      
      if (localResponse.ok) {
        const localData = await localResponse.json();
        console.log('📊 Local search response data:', localData);
        // Ensure localData is an array
        localBooks = Array.isArray(localData) ? localData : [];
        console.log('📚 Local books found:', localBooks.length);
      } else {
        console.error('❌ Local search failed:', localResponse.status);
        localBooks = [];
      }

      // Search Open Library
      console.log('🌐 Searching Open Library...');
      let openLibraryBooks: OpenLibraryBook[] = [];
      try {
        openLibraryBooks = await searchBooks(value);
        // Ensure openLibraryBooks is an array
        openLibraryBooks = Array.isArray(openLibraryBooks) ? openLibraryBooks : [];
        console.log('🌐 Open Library books found:', openLibraryBooks.length);
      } catch (error) {
        console.error('❌ Open Library search failed:', error);
        openLibraryBooks = [];
      }

      // Combine and deduplicate results
      console.log('🔗 Combining results...');
      const combinedResults: SearchResult[] = [
        // Local books
        ...localBooks.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          pages: book.pages,
          coverUrl: book.coverUrl,
          isLocal: true
        })),
        // Open Library books (exclude if title+author already exists locally)
        ...openLibraryBooks
          .filter(olBook => !localBooks.some(
            localBook => 
              localBook.title.toLowerCase() === olBook.title.toLowerCase() &&
              localBook.author.toLowerCase() === (olBook.author_name?.[0] || "").toLowerCase()
          ))
          .map(book => ({
            title: book.title,
            author: book.author_name?.[0] || "Unknown Author",
            pages: book.number_of_pages_median || 200,
            coverUrl: getCoverImageUrl(book.cover_i),
            isLocal: false,
            openLibraryData: book
          }))
      ];

      console.log('✅ Final combined results:', combinedResults.length);
      setResults(combinedResults);
    } catch (error) {
      console.error("❌ Error searching books:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Update search when debounced query changes
  useEffect(() => {
    handleSearch(debouncedQuery);
  }, [debouncedQuery]);

  const handleAddBook = (book: SearchResult) => {
    if (!isAuthenticated) {
      // If not authenticated, redirect to sign-up with book data
      const bookData = encodeURIComponent(JSON.stringify({
        title: book.title,
        author: book.author,
        pages: book.pages,
        coverUrl: book.coverUrl,
        status: "to-read",
        laneId: null
      }));
      router.push(`/auth?book=${bookData}`);
      setOpen(false);
    } else {
      // If authenticated, add the book directly
      addBookMutation.mutate(book);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Book
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Books</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or author..."
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {isSearching ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : results.length > 0 ? (
              results.map((book, index) => (
                <Card key={`${book.title}-${index}`} className="overflow-hidden">
                  <CardContent className="p-4 flex gap-4">
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-16 h-24 object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{book.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {book.author}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {book.pages} pages
                      </p>
                      {book.isLocal && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Already in your library
                        </p>
                      )}
                    </div>
                    {!book.isLocal && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddBook(book)}
                        disabled={addBookMutation.isPending}
                      >
                        Add
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : query ? (
              <p className="text-center text-muted-foreground">No books found</p>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}