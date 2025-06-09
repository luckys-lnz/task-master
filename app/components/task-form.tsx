"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DayPicker } from "react-day-picker";
import { TaskPriority, TaskPriorityType } from "@/lib/db/schema";

export function TaskForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriorityType>("LOW");
  const [status, setStatus] = useState("todo");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error("You must be signed in to create a task");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            (session?.user as { accessToken?: string })?.accessToken ?? ""
          }`,
        },
        body: JSON.stringify({
          title,
          description,
          priority,
          status,
          substasks: [],
          dueDate: dueDate?.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      toast.success("Task created successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to create task");
      console.error("Error creating task:", error);
    } finally {
      setIsSubmitting(false);
      // Reset form
      setTitle("");
      setDescription("");
      setPriority("LOW");
      setStatus("todo");
      setDueDate(undefined);
      router.refresh();
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="priority" className="block text-sm font-medium">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriorityType)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            {Object.entries(TaskPriority).map(([key, value]) => (
              <option key={key} value={value}>
                {key.charAt(0) + key.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Due Date</label>
        <div className="border rounded-md p-2 dark:border-gray-700">
          <DayPicker
            mode="single"
            selected={dueDate}
            onSelect={setDueDate}
            className="dark:bg-gray-800 dark:text-white"
            classNames={{
              day_selected: "bg-blue-500 text-white hover:bg-blue-600",
              day_today: "bg-gray-100 dark:bg-gray-700",
              day_disabled: "text-gray-400 dark:text-gray-600",
              day_outside: "text-gray-400 dark:text-gray-600",
              day_range_middle: "bg-blue-100 dark:bg-blue-900",
              day_range_end: "bg-blue-500 text-white",
              day_range_start: "bg-blue-500 text-white",
              day_hidden: "invisible",
              caption: "flex justify-center py-2 mb-2 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "flex items-center",
              nav_button:
                "h-7 w-7 bg-transparent hover:bg-blue-100 p-1 rounded-md transition-colors",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell:
                "text-gray-500 rounded-md w-9 font-normal text-[0.8rem] dark:text-gray-400",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-blue-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 dark:[&:has([aria-selected])]:bg-blue-900",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
            }}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? "Creating..." : "Create Task"}
      </Button>
    </form>
  );
}
