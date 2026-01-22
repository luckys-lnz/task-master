"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateTimePickerV2 } from "@/components/ui/date-time-picker-v2"
import { X, Plus } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import type { Task, Subtask } from "@/lib/types"

interface AddTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (task: Partial<Task>) => void
  initialData?: {
    title?: string
    description?: string
    priority?: Task["priority"]
    subtasks?: Task["subtasks"]
    duplicatedFromTaskId?: string
  }
}

export function AddTaskModal({ open, onOpenChange, onAdd, initialData }: AddTaskModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Task["priority"]>("MEDIUM")
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [dueTime, setDueTime] = useState("")
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")

  // Initialize form with initial data when modal opens or initialData changes
  useEffect(() => {
    if (open && initialData) {
      setTitle(initialData.title || "")
      setDescription(initialData.description || "")
      setPriority(initialData.priority || "MEDIUM")
      // Only include uncompleted subtasks and generate new IDs
      const uncompletedSubtasks = (initialData.subtasks || []).filter(st => !st.completed)
      setSubtasks(uncompletedSubtasks.map(st => ({
        id: uuidv4(), // Generate new IDs for duplicated subtasks
        title: st.title,
        completed: false, // Ensure all are uncompleted
      })))
    } else if (open && !initialData) {
      // Reset form when opening without initial data
      setTitle("")
      setDescription("")
      setPriority("MEDIUM")
      setDueDate(undefined)
      setDueTime("")
      setSubtasks([])
      setNewSubtaskTitle("")
    }
  }, [open, initialData])

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return
    setSubtasks([
      ...subtasks,
      {
        id: uuidv4(),
        title: newSubtaskTitle,
        completed: false,
      }
    ])
    setNewSubtaskTitle("")
  }

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id))
  }

  const handleSubmit = () => {
    if (!title.trim()) return

    const task: Partial<Task> = {
      title,
      description: description || "",
      priority,
      status: "PENDING",
      dueDate: dueDate?.toISOString(),
      dueTime: dueTime || undefined,
      subtasks: subtasks.length > 0 ? subtasks.map(st => ({ ...st, task_id: "" })) : undefined,
      category: "",
      tags: [],
      lockedAfterDue: false,
      notes: "",
      duplicatedFromTaskId: initialData?.duplicatedFromTaskId,
      createdAt: new Date().toISOString(),
    }

    onAdd(task)
    
    // Reset form
    setTitle("")
    setDescription("")
    setPriority("MEDIUM")
    setDueDate(undefined)
    setDueTime("")
    setSubtasks([])
    setNewSubtaskTitle("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {initialData ? "Duplicate Task" : "Add New Task"}
          </DialogTitle>
          <DialogDescription>
            {initialData 
              ? "Create a copy of this task with uncompleted subtasks. You can set a new due date and time."
              : "Create a new task with details below. Add subtasks, set priority, and schedule it."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className="h-11"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Priority and Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-semibold">
                Priority
              </Label>
              <Select value={priority} onValueChange={(value: Task["priority"]) => setPriority(value)}>
                <SelectTrigger id="priority" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Due Date</Label>
              <DateTimePickerV2
                date={dueDate}
                time={dueTime}
                onDateChange={setDueDate}
                onTimeChange={setDueTime}
                placeholder="Select date and time"
              />
            </div>
          </div>

          {/* Subtasks */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Subtasks</Label>
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <span className="flex-1 text-sm">{subtask.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSubtask(subtask.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a subtask"
                  className="h-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddSubtask()
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddSubtask}
                  variant="outline"
                  className="h-10 px-4"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="h-11 bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Add Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
