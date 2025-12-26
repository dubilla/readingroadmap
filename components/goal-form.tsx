'use client'

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import type { ReadingGoal, GoalType } from "@shared/schema";

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGoal?: ReadingGoal | null;
}

export function GoalForm({ open, onOpenChange, editingGoal }: GoalFormProps) {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const [goalType, setGoalType] = useState<GoalType>('books');
  const [targetCount, setTargetCount] = useState('');
  const [year, setYear] = useState(currentYear.toString());

  useEffect(() => {
    if (editingGoal) {
      setGoalType(editingGoal.goalType);
      setTargetCount(editingGoal.targetCount.toString());
      setYear(editingGoal.year.toString());
    } else {
      setGoalType('books');
      setTargetCount('');
      setYear(currentYear.toString());
    }
  }, [editingGoal, currentYear]);

  const createMutation = useMutation({
    mutationFn: async (data: { goalType: GoalType; targetCount: number; year: number }) => {
      const response = await apiRequest("POST", "/api/goals", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      onOpenChange(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { goalType?: GoalType; targetCount?: number; year?: number }) => {
      const response = await apiRequest("PATCH", `/api/goals/${editingGoal!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      onOpenChange(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setGoalType('books');
    setTargetCount('');
    setYear(currentYear.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const count = parseInt(targetCount);
    const goalYear = parseInt(year);

    if (isNaN(count) || count < 1) {
      return;
    }

    if (editingGoal) {
      updateMutation.mutate({
        goalType,
        targetCount: count,
        year: goalYear,
      });
    } else {
      createMutation.mutate({
        goalType,
        targetCount: count,
        year: goalYear,
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  const yearOptions = [];
  for (let y = currentYear - 1; y <= currentYear + 1; y++) {
    yearOptions.push(y);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingGoal ? 'Edit Reading Goal' : 'Set a Reading Goal'}</DialogTitle>
          <DialogDescription>
            {editingGoal
              ? 'Update your reading goal for the year.'
              : 'Create a new reading goal to track your progress.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goalType">Goal Type</Label>
            <Select value={goalType} onValueChange={(value: GoalType) => setGoalType(value)}>
              <SelectTrigger id="goalType" className="cursor-pointer">
                <SelectValue placeholder="Select goal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="books" className="cursor-pointer">Number of Books</SelectItem>
                <SelectItem value="pages" className="cursor-pointer">Number of Pages</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetCount">
              Target {goalType === 'books' ? 'Books' : 'Pages'}
            </Label>
            <Input
              id="targetCount"
              type="number"
              min="1"
              placeholder={goalType === 'books' ? 'e.g., 50' : 'e.g., 10000'}
              value={targetCount}
              onChange={(e) => setTargetCount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger id="year" className="cursor-pointer">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y.toString()} className="cursor-pointer">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
              {isSubmitting ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
