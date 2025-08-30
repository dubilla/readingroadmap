import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
  const initialProgress = book.readingProgress || 0;
  // Ensure inputValue is always a string for the input element
  const [inputValue, setInputValue] = useState<string>(initialProgress.toString());

  useEffect(() => {
    setInputValue(initialProgress.toString());
  }, [initialProgress]);

  const updateProgressMutation = useMutation({
    mutationFn: async (progress: number) => {
      await apiRequest("PATCH", `/api/books/${book.id}/progress`, { progress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      // Potentially refetch or update inputValue if the mutation leads to a new `book.readingProgress`
      // However, the useEffect above should handle syncing when `book.readingProgress` (via `initialProgress`) changes.
    }
  });

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    if (rawValue === "") {
      setInputValue("");
      // Do not mutate on empty string, user might be clearing to type a new number
      return;
    }

    const numericValue = parseInt(rawValue, 10);

    if (isNaN(numericValue)) {
      // If it's not a number and not empty (e.g. "abc"), display what user typed.
      setInputValue(rawValue);
      return;
    }

    let clampedValue = numericValue;
    if (clampedValue < 0) {
      clampedValue = 0;
    } else if (clampedValue > 100) {
      clampedValue = 100;
    }

    setInputValue(clampedValue.toString()); // Update input display with clamped value as string

    // Only mutate if the clamped value is a valid number and different from the original progress
    if (clampedValue !== initialProgress) {
      updateProgressMutation.mutate(clampedValue);
    }
  };

  const readingProgress = book.readingProgress || 0;

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
                onChange={handleProgressChange}
                onBlur={() => {
                  if (inputValue === "") {
                    setInputValue(initialProgress.toString());
                    return;
                  }
                  const currentNumericValue = parseInt(inputValue, 10); // inputValue is already string
                  if (isNaN(currentNumericValue)) {
                    setInputValue(initialProgress.toString()); // Reset to original progress on blur if invalid
                  } else {
                    // Ensure a clean string representation of the number (e.g. "05" -> "5")
                    // This also handles if currentNumericValue was clamped from something invalid user typed.
                    setInputValue(currentNumericValue.toString());

                    // If the value on blur (which is now clean and numeric)
                    // is different from initialProgress and hasn't been mutated yet,
                    // one might consider mutating. However, onChange should have caught most cases.
                    // This primarily ensures the display is clean.
                    // For instance, if user types "50", then "50   " (spaces),
                    // parseInt gives 50. Then setInputValue("50") cleans it up.
                  }
                }}
                min={0}
                max={100}
                className="w-full"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}