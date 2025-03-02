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
import type { Book, Lane, InsertLane, Swimlane, InsertSwimlane } from "@shared/schema";
import { insertLaneSchema, insertSwimlaneSchema } from "@shared/schema";

interface ReadingBoardProps {
  books: Book[];
}

export function ReadingBoard({ books }: ReadingBoardProps) {
  const queryClient = useQueryClient();

  const { data: swimlanes = [] } = useQuery<Swimlane[]>({
    queryKey: ["/api/swimlanes"],
  });

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

  const createSwimlaneForm = useForm({
    resolver: zodResolver(insertSwimlaneSchema),
    defaultValues: {
      name: "",
      description: "",
      order: swimlanes.length
    }
  });

  const createSwimlane = useMutation({
    mutationFn: async (swimlane: InsertSwimlane) => {
      const newSwimlane = await apiRequest("POST", "/api/swimlanes", swimlane);
      const swimlaneJson = await newSwimlane.json();

      // Create default lanes for the new swimlane
      await apiRequest("POST", "/api/lanes", {
        name: "Backlog",
        description: "Books to read eventually",
        order: 0,
        type: "backlog",
        swimlaneId: swimlaneJson.id
      });

      await apiRequest("POST", "/api/lanes", {
        name: "Currently Reading",
        description: "Books in progress",
        order: 1,
        type: "in-progress",
        swimlaneId: swimlaneJson.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swimlanes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lanes"] });
      createSwimlaneForm.reset();
    }
  });

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const bookId = parseInt(result.draggableId);
    const newLaneId = parseInt(result.destination.droppableId);

    updateLaneMutation.mutate({ bookId, laneId: newLaneId });
  };

  const completedLane = lanes.find(lane => lane.type === "completed" && !lane.swimlaneId);
  const swimlaneLanes = lanes.filter(lane => lane.type !== "completed");

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Reading Queue</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Reading List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Reading List</DialogTitle>
            </DialogHeader>
            <Form {...createSwimlaneForm}>
              <form onSubmit={createSwimlaneForm.handleSubmit((data) => createSwimlane.mutate(data))} className="space-y-4">
                <FormField
                  control={createSwimlaneForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Technical Books" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={createSwimlaneForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Books about programming and technology" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit">Create Reading List</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="space-y-8">
          {swimlanes.map((swimlane) => {
            const swimlaneLanes = lanes.filter(lane => lane.swimlaneId === swimlane.id);

            return (
              <div key={swimlane.id} className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">{swimlane.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {swimlaneLanes.map((lane) => (
                    <div key={lane.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{lane.name}</h4>
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
              </div>
            );
          })}

          {completedLane && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Read</h3>
              <Droppable droppableId={completedLane.id.toString()}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"
                  >
                    {books
                      .filter((book) => book.laneId === completedLane.id)
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
          )}
        </div>
      </DragDropContext>
    </>
  );
}