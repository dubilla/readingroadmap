import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { formatReadingTime, formatProgress } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { Book } from "@shared/schema";

interface BookCardProps {
  book: Book;
  onTap?: (book: Book) => void;
}

export function BookCard({ book, onTap }: BookCardProps) {
  const queryClient = useQueryClient();

  const updateProgressMutation = useMutation({
    mutationFn: async (progress: number) => {
      await apiRequest("PATCH", `/api/books/${book.id}/progress`, { progress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    }
  });

  const readingProgress = book.readingProgress || 0;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on the slider
    if ((e.target as HTMLElement).closest('[role="slider"]')) {
      return;
    }
    onTap?.(book);
  };

  return (
    <Card
      className={`overflow-hidden ${onTap ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
      onClick={handleCardClick}
    >
      {/* Mobile: horizontal flex row; Desktop: vertical stack */}
      <div className="flex sm:flex-col">
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-16 h-24 object-cover rounded flex-shrink-0 m-3 sm:m-0 sm:w-full sm:h-auto sm:aspect-[3/4] sm:rounded-none"
        />
        <CardContent className="flex-1 min-w-0 flex flex-col justify-between p-3 pl-0 sm:p-4">
          <div>
            <h4 className="font-semibold leading-tight text-sm sm:text-base line-clamp-2">{book.title}</h4>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{book.author}</p>
          </div>
          <div className="space-y-1 sm:space-y-2 mt-1 sm:mt-2">
            <div className="sm:flex sm:justify-between text-xs sm:text-sm">
              <span className="hidden sm:inline">Reading Time</span>
              <span className="text-muted-foreground">
                {formatReadingTime(book.estimatedMinutes)}
              </span>
            </div>
            {book.status === "reading" && (
              <div className="space-y-1 sm:space-y-2">
                <div className="hidden sm:flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="text-muted-foreground">
                    {formatProgress(readingProgress)}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:block">
                  <Slider
                    value={[readingProgress]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([value]) => updateProgressMutation.mutate(value)}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-8 sm:hidden">
                    {formatProgress(readingProgress)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
