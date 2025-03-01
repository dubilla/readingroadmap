import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookCard } from "./book-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import type { Book, Lane, InsertLane } from "@shared/schema";
import { insertLaneSchema } from "@shared/schema";

interface ReadingBoardProps {
  books: Book[];
}

export function ReadingBoard({ books }: ReadingBoardProps) {
  const queryClient = useQueryClient();

  const { data: lanes = [] } = useQuery<Lane[]>({
    queryKey: ["/api/lanes"],
  });

  const updateLaneMutation = useMutation({
    mutationFn: async ({ bookId, laneId }: { bookId: number; laneId: number }) => {
      await apiRequest("PATCH", `/api/books/${bookId}/lane`, { laneId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    }
  });

  const createLaneMutation = useMutation({
    mutationFn: async (lane: InsertLane) => {
      await apiRequest("POST", "/api/lanes", lane);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lanes"] });
    }
  });

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const bookId = parseInt(result.draggableId);
    const newLaneId = parseInt(result.destination.droppableId);

    updateLaneMutation.mutate({ bookId, laneId: newLaneId });
  };

  const form = useForm({
    resolver: zodResolver(insertLaneSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "in-progress" as const,
      order: lanes.length
    }
  });

  const onSubmit = form.handleSubmit((data) => {
    createLaneMutation.mutate(data);
    form.reset();
  });

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Reading Lanes</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Lane
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Lane</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit">Create Lane</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {lanes.map((lane) => (
            <div key={lane.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{lane.name}</h3>
                <span className="text-sm text-muted-foreground">
                  {books.filter((b) => b.laneId === lane.id).length} books
                </span>
              </div>

              <Droppable droppableId={lane.id.toString()}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-4 min-h-[200px]"
                  >
                    {books
                      .filter((book) => book.laneId === lane.id)
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
    </>
  );
}