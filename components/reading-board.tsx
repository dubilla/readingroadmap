'use client'

import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookCard } from "./book-card";
import { BookActionDrawer } from "./book-action-drawer";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "@/components/ui/responsive-modal";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import type { Book, UserLane } from "@shared/schema";
import { BookSearch } from "./book-search";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

interface ReadingBoardProps {
  books: Book[];
  userLanes: UserLane[];
}

export function ReadingBoard({ books, userLanes }: ReadingBoardProps) {
  const queryClient = useQueryClient();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createLaneOpen, setCreateLaneOpen] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const updateBookStatusMutation = useMutation({
    mutationFn: async ({ bookId, status }: { bookId: number; status: string }) => {
      await apiRequest("PATCH", `/api/books/${bookId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    }
  });

  const updateBookLaneMutation = useMutation({
    mutationFn: async ({ bookId, laneId }: { bookId: number; laneId: number | null }) => {
      await apiRequest("PATCH", `/api/books/${bookId}/lane`, { laneId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    }
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (bookId: number) => {
      await apiRequest("DELETE", `/api/books/${bookId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({ title: "Book removed" });
    }
  });

  const createLaneSchema = z.object({
    name: z.string().min(1),
    order: z.number(),
  });

  const createUserLaneForm = useForm({
    resolver: zodResolver(createLaneSchema),
    defaultValues: {
      name: "",
      order: userLanes.length
    }
  });

  const createUserLane = useMutation({
    mutationFn: async (data: { name: string; order: number }) => {
      await apiRequest("POST", "/api/lanes", data);
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/lanes"] });
      createUserLaneForm.reset();
      setCreateLaneOpen(false);
      toast({ title: "Lane created" });
    }
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const bookId = parseInt(result.draggableId);
    const destinationId = result.destination.droppableId;

    // Parse the destination - format is "lane-{laneId}-{status}"
    if (destinationId.startsWith('lane-')) {
      // Format: lane-{laneId}-{status}
      const parts = destinationId.split('-');
      const laneIdStr = parts[1];
      const status = parts.slice(2).join('-'); // Handle "to-read" with hyphen
      const laneId = laneIdStr === 'default' ? null : parseInt(laneIdStr);

      // Get current book to check if status changed
      const book = books.find(b => b.id === bookId);
      const currentStatus = book?.status;

      // Update lane
      updateBookLaneMutation.mutate({ bookId, laneId });

      // Update status if it changed
      if (currentStatus !== status) {
        updateBookStatusMutation.mutate({ bookId, status });
      }
    }
  };

  // Group books by status
  const toReadBooks = books.filter(book => book.status === "to-read");
  const inProgressBooks = books.filter(book => book.status === "reading");
  const completedBooks = books.filter(book => book.status === "completed");

  // Group books by lane within each status
  const getBooksByLane = (books: Book[]) => {
    const booksByLane = new Map<number | null, Book[]>();
    
    // Initialize with default lane (null)
    booksByLane.set(null, []);
    
    // Initialize with user lanes
    userLanes.forEach(lane => {
      booksByLane.set(lane.id, []);
    });
    
    // Distribute books to their lanes
    books.forEach(book => {
      const laneId = book.laneId;
      const laneBooks = booksByLane.get(laneId) || [];
      laneBooks.push(book);
      booksByLane.set(laneId, laneBooks);
    });
    
    return booksByLane;
  };

  const toReadByLane = getBooksByLane(toReadBooks);
  const inProgressByLane = getBooksByLane(inProgressBooks);
  const completedByLane = getBooksByLane(completedBooks);

  const getLaneName = (laneId: number | null) => {
    if (laneId === null) return "📚 Wild & Free";
    const lane = userLanes.find(l => l.id === laneId);
    return lane?.name || "Unknown Lane";
  };

  const renderLaneSection = (laneId: number | null, status: string, allBooks: Book[]) => {
    const laneBooks = allBooks.filter(book => book.laneId === laneId);
    const isEmpty = laneBooks.length === 0;

    return (
      <div key={`${status}-${laneId}`} className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          {getLaneName(laneId)}
        </h4>
        <Droppable droppableId={`lane-${laneId ?? 'default'}-${status}`}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-2 rounded-md border-2 border-dashed transition-colors ${
                snapshot.isDraggingOver
                  ? "border-primary bg-primary/5"
                  : "border-transparent"
              } ${isEmpty ? "min-h-[40px] p-2" : "min-h-[80px] p-2"}`}
            >
              {laneBooks.map((book, index) => (
                <Draggable key={book.id} draggableId={book.id.toString()} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <BookCard book={book} onTap={isMobile ? handleBookTap : undefined} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {isEmpty && (
                <p className="text-xs text-muted-foreground/50 text-center">
                  Drop books here
                </p>
              )}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  const handleCreateLane = (data: { name: string; order: number }) => {
    createUserLane.mutate(data);
  };

  const handleBookTap = (book: Book) => {
    setSelectedBook(book);
    setDrawerOpen(true);
  };

  const handleStatusChange = (bookId: number, status: string) => {
    updateBookStatusMutation.mutate({ bookId, status });
  };

  const handleLaneChange = (bookId: number, laneId: number | null) => {
    updateBookLaneMutation.mutate({ bookId, laneId });
  };

  const handleDelete = (bookId: number) => {
    deleteBookMutation.mutate(bookId);
  };

  return (
    <div className="space-y-6">
      {/* Create User Lane */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold">Reading Board</h2>
        <ResponsiveModal open={createLaneOpen} onOpenChange={setCreateLaneOpen}>
          <ResponsiveModalTrigger asChild>
            <Button variant="outline" size="sm" className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Create Lane
            </Button>
          </ResponsiveModalTrigger>
          <ResponsiveModalContent>
            <ResponsiveModalHeader>
              <ResponsiveModalTitle>Create New Lane</ResponsiveModalTitle>
            </ResponsiveModalHeader>
            <Form {...createUserLaneForm}>
              <form onSubmit={createUserLaneForm.handleSubmit(handleCreateLane)} className="space-y-4 px-4 sm:px-0 pb-4 sm:pb-0">
                <FormField
                  control={createUserLaneForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lane Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter lane name..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createUserLane.isPending} className="cursor-pointer">
                  Create Lane
                </Button>
              </form>
            </Form>
          </ResponsiveModalContent>
        </ResponsiveModal>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0">
          {/* To Read Column */}
          <div className="min-w-[280px] flex-shrink-0 snap-start space-y-3 sm:space-y-4 md:min-w-0 md:flex-shrink">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold">To Read</h3>
              <BookSearch />
            </div>
            <div className="space-y-3 sm:space-y-4 min-h-[200px] p-3 sm:p-4 bg-muted/20 rounded-lg">
              {Array.from(toReadByLane.entries()).map(([laneId]) =>
                renderLaneSection(laneId, "to-read", toReadBooks)
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="min-w-[280px] flex-shrink-0 snap-start space-y-3 sm:space-y-4 md:min-w-0 md:flex-shrink">
            <h3 className="text-base sm:text-lg font-semibold">In Progress</h3>
            <div className="space-y-3 sm:space-y-4 min-h-[200px] p-3 sm:p-4 bg-muted/20 rounded-lg">
              {Array.from(inProgressByLane.entries()).map(([laneId]) =>
                renderLaneSection(laneId, "reading", inProgressBooks)
              )}
            </div>
          </div>

          {/* Completed Column */}
          <div className="min-w-[280px] flex-shrink-0 snap-start space-y-3 sm:space-y-4 md:min-w-0 md:flex-shrink">
            <h3 className="text-base sm:text-lg font-semibold">Completed</h3>
            <div className="space-y-3 sm:space-y-4 min-h-[200px] p-3 sm:p-4 bg-muted/20 rounded-lg">
              {Array.from(completedByLane.entries()).map(([laneId]) =>
                renderLaneSection(laneId, "completed", completedBooks)
              )}
            </div>
          </div>
        </div>
      </DragDropContext>

      {/* Mobile Book Action Drawer */}
      <BookActionDrawer
        book={selectedBook}
        userLanes={userLanes}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onStatusChange={handleStatusChange}
        onLaneChange={handleLaneChange}
        onDelete={handleDelete}
      />
    </div>
  );
}