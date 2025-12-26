'use client'

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Target } from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import type { ReadingGoal } from "@shared/schema";

interface GoalProgress {
  goalId: number;
  goalType: 'books' | 'pages';
  targetCount: number;
  currentCount: number;
  progressPercentage: number;
  year: number;
}

interface GoalCardProps {
  goal: ReadingGoal;
  onEdit?: (goal: ReadingGoal) => void;
}

export function GoalCard({ goal, onEdit }: GoalCardProps) {
  const queryClient = useQueryClient();

  const { data: progress, isLoading: progressLoading } = useQuery<GoalProgress>({
    queryKey: [`/api/goals/${goal.id}/progress`],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/goals/${goal.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this goal?')) {
      deleteMutation.mutate();
    }
  };

  const currentCount = progress?.currentCount ?? 0;
  const progressPercentage = progress?.progressPercentage ?? 0;
  const unitLabel = goal.goalType === 'books' ? 'books' : 'pages';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {goal.year} Reading Goal
            </CardTitle>
          </div>
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => onEdit(goal)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive cursor-pointer"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {progressLoading ? '...' : `${currentCount} / ${goal.targetCount} ${unitLabel}`}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-xs text-muted-foreground text-right">
            {progressPercentage}% complete
          </p>
        </div>

        {!progressLoading && progressPercentage < 100 && (
          <p className="text-sm text-muted-foreground">
            {goal.targetCount - currentCount} {unitLabel} to go!
          </p>
        )}

        {!progressLoading && progressPercentage >= 100 && (
          <p className="text-sm text-green-600 font-medium">
            Goal achieved!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
