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
      {/* Mobile: horizontal layout */}
      <div className="flex sm:hidden p-3 gap-3">
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-16 h-24 object-cover rounded flex-shrink-0"
        />
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h4 className="font-semibold leading-tight text-sm line-clamp-2">{book.title}</h4>
            <p className="text-xs text-muted-foreground truncate">{book.author}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {formatReadingTime(book.estimatedMinutes)}
            </p>
            {book.status === "reading" && (
              <div className="flex items-center gap-2">
                <Slider
                  value={[readingProgress]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([value]) => updateProgressMutation.mutate(value)}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-8">
                  {formatProgress(readingProgress)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: vertical layout */}
      <div className="hidden sm:block">
        <div className="aspect-[3/4] relative">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <CardContent className="p-4 space-y-4">
          <div>
            <h4 className="font-semibold leading-tight text-base">{book.title}</h4>
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
                <Slider
                  value={[readingProgress]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([value]) => updateProgressMutation.mutate(value)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}