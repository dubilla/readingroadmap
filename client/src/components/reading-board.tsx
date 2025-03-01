import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LANES } from "@/lib/constants";
import { BookCard } from "./book-card";
import { apiRequest } from "@/lib/queryClient";
import type { Book } from "@shared/schema";

interface ReadingBoardProps {
  books: Book[];
}

export function ReadingBoard({ books }: ReadingBoardProps) {
  const queryClient = useQueryClient();
  
  const updateLaneMutation = useMutation({
    mutationFn: async ({ bookId, lane }: { bookId: number; lane: string }) => {
      await apiRequest("PATCH", `/api/books/${bookId}/lane`, { lane });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    }
  });

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const bookId = parseInt(result.draggableId);
    const newLane = result.destination.droppableId;
    
    updateLaneMutation.mutate({ bookId, lane: newLane });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.values(LANES).map((lane) => (
          <div key={lane.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{lane.title}</h3>
              <span className="text-sm text-muted-foreground">
                {books.filter((b) => b.lane === lane.id).length} books
              </span>
            </div>

            <Droppable droppableId={lane.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-4 min-h-[200px]"
                >
                  {books
                    .filter((book) => book.lane === lane.id)
                    .map((book, index) => (
                      <Draggable
                        key={book.id}
                        draggableId={book.id.toString()}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <BookCard book={book} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
