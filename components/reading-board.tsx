import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookCard } from "./book-card";
import { BookActionDrawer } from "./book-action-drawer";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import type { Book, UserLane, InsertUserLane } from "@shared/schema";
import { insertUserLaneSchema } from "@shared/schema";
import { BookSearch } from "./book-search";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ReadingBoardProps {
  books: Book[];
  userLanes: UserLane[];
}

export function ReadingBoard({ books, userLanes }: ReadingBoardProps) {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

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

  const createUserLaneForm = useForm({
    resolver: zodResolver(insertUserLaneSchema),
    defaultValues: {
      name: "",
      order: userLanes.length
    }
  });

  const createUserLane = useMutation({
    mutationFn: async (userLane: InsertUserLane) => {
      await apiRequest("POST", "/api/lanes", userLane);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lanes"] });
      createUserLaneForm.reset();
    }
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const bookId = parseInt(result.draggableId);
    const destinationId = result.destination.droppableId;
    
    // Parse the destination to determine if it's a status or lane
    if (destinationId.startsWith('status-')) {
      const status = destinationId.replace('status-', '');
      updateBookStatusMutation.mutate({ bookId, status });
    } else if (destinationId.startsWith('lane-')) {
      const laneId = parseInt(destinationId.replace('lane-', ''));
      updateBookLaneMutation.mutate({ bookId, laneId });
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

  const renderLaneSection = (books: Book[], laneId: number | null, status: string) => {
    const laneBooks = books.filter(book => book.laneId === laneId);
    if (laneBooks.length === 0) return null;

    return (
      <div key={`${status}-${laneId}`} className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          {getLaneName(laneId)}
        </h4>
        <div className="space-y-2">
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
        </div>
      </div>
    );
  };

  const handleCreateLane = (data: { name: string; order: number }) => {
    if (!currentUser) return;

    createUserLane.mutate({
      name: data.name,
      userId: currentUser.id,
      order: data.order
    });
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

  return (
    <div className="space-y-6">
      {/* Create User Lane */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reading Board</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Lane
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Lane</DialogTitle>
            </DialogHeader>
            <Form {...createUserLaneForm}>
              <form onSubmit={createUserLaneForm.handleSubmit(handleCreateLane)} className="space-y-4">
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
                <Button type="submit" disabled={createUserLane.isPending}>
                  Create Lane
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* To Read Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">To Read</h3>
              <BookSearch />
            </div>
            <Droppable droppableId="status-to-read">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-4 min-h-[200px] p-4 bg-muted/20 rounded-lg"
                >
                  {Array.from(toReadByLane.entries()).map(([laneId, books]) => 
                    renderLaneSection(books, laneId, "to-read")
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* In Progress Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">In Progress</h3>
            <Droppable droppableId="status-reading">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-4 min-h-[200px] p-4 bg-muted/20 rounded-lg"
                >
                  {Array.from(inProgressByLane.entries()).map(([laneId, books]) => 
                    renderLaneSection(books, laneId, "reading")
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Completed Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Completed</h3>
            <Droppable droppableId="status-completed">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-4 min-h-[200px] p-4 bg-muted/20 rounded-lg"
                >
                  {Array.from(completedByLane.entries()).map(([laneId, books]) =>
                    renderLaneSection(books, laneId, "completed")
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
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
      />
    </div>
  );
}