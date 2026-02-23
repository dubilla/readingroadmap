'use client'

import { useState } from "react";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from "@/components/ui/responsive-modal";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BookOpen, CheckCircle2, ListTodo, FolderOpen, Check, Trash2 } from "lucide-react";
import type { Book, UserLane } from "@shared/schema";

interface BookActionDrawerProps {
  book: Book | null;
  userLanes: UserLane[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (bookId: number, status: string) => void;
  onLaneChange: (bookId: number, laneId: number | null) => void;
  onDelete?: (bookId: number) => void;
}

const statusOptions = [
  { value: "to-read", label: "To Read", icon: ListTodo },
  { value: "reading", label: "Reading", icon: BookOpen },
  { value: "completed", label: "Completed", icon: CheckCircle2 },
] as const;

export function BookActionDrawer({
  book,
  userLanes,
  open,
  onOpenChange,
  onStatusChange,
  onLaneChange,
  onDelete,
}: BookActionDrawerProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  if (!book) return null;

  const handleStatusChange = (status: string) => {
    onStatusChange(book.id, status);
    onOpenChange(false);
  };

  const handleLaneChange = (laneId: number | null) => {
    onLaneChange(book.id, laneId);
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete?.(book.id);
    setConfirmDeleteOpen(false);
    onOpenChange(false);
  };

  const getLaneName = (laneId: number | null) => {
    if (laneId === null) return "Wild & Free";
    const lane = userLanes.find(l => l.id === laneId);
    return lane?.name || "Unknown";
  };

  return (
    <>
      <ResponsiveModal open={open} onOpenChange={onOpenChange}>
        <ResponsiveModalContent>
          <ResponsiveModalHeader className="text-left">
            <ResponsiveModalTitle className="line-clamp-1">{book.title}</ResponsiveModalTitle>
            <ResponsiveModalDescription className="line-clamp-1">
              {book.author}
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>

          <div className="p-4 space-y-4">
            {/* Status Section */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Move to Status</h4>
              <div className="grid grid-cols-3 gap-2">
                {statusOptions.map(({ value, label, icon: Icon }) => {
                  const isActive = book.status === value;
                  return (
                    <Button
                      key={value}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      className="flex flex-col h-auto py-3 gap-1 cursor-pointer"
                      onClick={() => handleStatusChange(value)}
                      disabled={isActive}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Lane Section */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Move to Lane</h4>
              <div className="space-y-1 max-h-[30vh] overflow-y-auto">
                {/* Default lane */}
                <Button
                  variant="ghost"
                  className="w-full justify-between h-auto py-3 cursor-pointer"
                  onClick={() => handleLaneChange(null)}
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span>Wild & Free</span>
                  </div>
                  {book.laneId === null && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </Button>

                {/* User lanes */}
                {userLanes.map((lane) => {
                  const isActive = book.laneId === lane.id;
                  return (
                    <Button
                      key={lane.id}
                      variant="ghost"
                      className="w-full justify-between h-auto py-3 cursor-pointer"
                      onClick={() => handleLaneChange(lane.id)}
                    >
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{lane.name}</span>
                      </div>
                      {isActive && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </Button>
                  );
                })}

                {userLanes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No custom lanes yet. Create one from the Reading Board.
                  </p>
                )}
              </div>
            </div>

            {/* Current location info */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Currently in: <span className="font-medium">{getLaneName(book.laneId)}</span>
              </p>
            </div>

            {/* Delete Section */}
            {onDelete && (
              <>
                <Separator />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Book
                </Button>
              </>
            )}
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &ldquo;{book.title}&rdquo; from your collection? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
              onClick={handleDelete}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
