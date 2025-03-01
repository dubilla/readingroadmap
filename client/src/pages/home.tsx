import { useQuery } from "@tanstack/react-query";
import { ReadingBoard } from "@/components/reading-board";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MOCK_BOOKS } from "@/lib/constants";
import type { Book } from "@shared/schema";

export default function Home() {
  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
    initialData: MOCK_BOOKS
  });

  if (isLoading) {
    return <Skeleton className="w-full h-screen" />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Reading Queue</h1>
          <p className="text-muted-foreground">
            Organize and track your reading progress
          </p>
        </header>

        <Card>
          <CardContent className="p-6">
            <ReadingBoard books={books} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
