import { useState, useEffect } from "react";
import { format } from "date-fns";
import type { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icons";

interface TaskCardProps {
  task: Task;
  onUpdate: (taskId: string, data: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (task.dueDate && !task.completed) {
      const dueDate = new Date(task.dueDate);
      if (task.dueTime) {
        const [hours, minutes] = task.dueTime.split(":").map(Number);
        dueDate.setHours(hours, minutes, 0, 0);
      } else {
        dueDate.setHours(23, 59, 59, 999);
      }
      const now = new Date();
      setIsOverdue(dueDate < now);
      setIsExpiringSoon(!isOverdue && dueDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000);
    } else {
      setIsOverdue(false);
      setIsExpiringSoon(false);
    }
  }, [task]);

  const handleStatusChange = async (checked: boolean) => {
    setIsLoading(true);
    try {
      await onUpdate(task.id, {
        completed: checked
      });
    } catch (error) {
      console.error("Error updating task status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(task.id);
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start space-x-2">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleStatusChange}
            disabled={isLoading}
          />
          <CardTitle className={task.completed ? "line-through text-muted-foreground" : ""}>
            {task.title}
          </CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={task.priority === "HIGH" ? "destructive" : task.priority === "LOW" ? "secondary" : "default"}>
            {task.priority}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <Icons.spinner className="h-4 w-4 animate-spin" />
            ) : (
              <Icons.trash className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {task.description && (
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground">{task.description}</p>
        </CardContent>
      )}
      <CardFooter className="pt-0">
        <div className={`flex items-center space-x-2 text-sm text-muted-foreground ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : isExpiringSoon ? 'text-yellow-600 dark:text-yellow-400 font-semibold' : ''}`}>
          <Icons.calendar className="h-4 w-4" />
          <span>
            {task.dueDate ? format(new Date(task.dueDate), "PPP") : "No due date"}
          </span>
          {task.dueTime && (
            <>
              <Icons.clock className="h-4 w-4 ml-2" />
              <span>{task.dueTime}</span>
            </>
          )}
          {isOverdue && <span className="ml-2">(Overdue)</span>}
          {!isOverdue && isExpiringSoon && <span className="ml-2">(Expiring soon)</span>}
        </div>
      </CardFooter>
    </Card>
  );
} 