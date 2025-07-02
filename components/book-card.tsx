import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { formatReadingTime, formatProgress } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { Book } from "@shared/schema";

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const queryClient = useQueryClient();
  const readingProgress = book.readingProgress || 0;
  const [inputValue, setInputValue] = useState(String(readingProgress));

  useEffect(() => {
    setInputValue(String(readingProgress));
  }, [readingProgress]);

  const updateProgressMutation = useMutation({
    mutationFn: async (progress: number) => {
      await apiRequest("PATCH", `/api/books/${book.id}/progress`, { progress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      // No need to manually update inputValue here if useEffect handles it,
      // but if mutation is very fast, direct update might be desired.
      // For now, relying on useEffect.
    }
  });

  const handleProgressUpdate = () => {
    let value = parseInt(inputValue, 10);
    if (isNaN(value)) {
      value = 0;
    }
    if (value < 0) {
      value = 0;
    } else if (value > 100) {
      value = 100;
    }
    setInputValue(String(value)); // Update input field immediately with clamped value
    updateProgressMutation.mutate(value);
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-[3/4] relative">
        <img
          src={book.coverUrl}
          alt={book.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <CardContent className="p-4 space-y-4">
        <div>
          <h4 className="font-semibold leading-tight">{book.title}</h4>
          <p className="text-sm text-muted-foreground">{book.author}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Reading Time</span>
            <span className="text-muted-foreground">
              {formatReadingTime(book.estimatedMinutes)}
            </span>
          </div>

          {book.status === "reading" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="text-muted-foreground">
                  {formatProgress(readingProgress)}
                </span>
              </div>
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleProgressUpdate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission if any
                    handleProgressUpdate();
                  }
                }}
                // className="w-full" // Removed for testing
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}