import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { formatReadingTime, formatProgress } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { Book } from "@shared/schema";

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
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
    </Card>
  );
}