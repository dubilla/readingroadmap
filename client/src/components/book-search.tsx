import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { searchBooks, getCoverImageUrl, type OpenLibraryBook } from "@/lib/openLibrary";
import { apiRequest } from "@/lib/queryClient";

interface BookSearchProps {
  laneId: number;
}

export function BookSearch({ laneId }: BookSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<OpenLibraryBook[]>([]);
  const debouncedQuery = useDebounce(query, 300);
  const queryClient = useQueryClient();

  const addBookMutation = useMutation({
    mutationFn: async (book: OpenLibraryBook) => {
      await apiRequest("POST", "/api/books", {
        title: book.title,
        author: book.author_name?.[0] || "Unknown Author",
        pages: book.number_of_pages_median || 200,
        coverUrl: getCoverImageUrl(book.cover_i),
        status: "to-read",
        laneId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setOpen(false);
    }
  });

  // Search when query changes
  const handleSearch = async (value: string) => {
    if (!value) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const books = await searchBooks(value);
    setResults(books);
    setIsSearching(false);
  };

  // Update search when debounced query changes
  useState(() => {
    handleSearch(debouncedQuery);
  }, [debouncedQuery]);

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
              results.map((book) => (
                <Card key={book.key} className="overflow-hidden">
                  <CardContent className="p-4 flex gap-4">
                    <img
                      src={getCoverImageUrl(book.cover_i)}
                      alt={book.title}
                      className="w-16 h-24 object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{book.title}</h4>
                      {book.author_name && (
                        <p className="text-sm text-muted-foreground">
                          {book.author_name[0]}
                        </p>
                      )}
                      {book.number_of_pages_median && (
                        <p className="text-sm text-muted-foreground">
                          {book.number_of_pages_median} pages
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBookMutation.mutate(book)}
                      disabled={addBookMutation.isPending}
                    >
                      Add
                    </Button>
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
