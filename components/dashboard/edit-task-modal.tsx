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
import { DateTimeRangePicker } from "@/components/ui/date-time-range-picker"
import { Switch } from "@/components/ui/switch"
import { X, Plus, Bell } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import type { Task, Subtask } from "@/lib/types"

interface EditTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  onUpdate: (id: string, updates: Partial<Task>, successMessage?: string) => void
}

export function EditTaskModal({ open, onOpenChange, task, onUpdate }: EditTaskModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Task["priority"]>("MEDIUM")
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [endTime, setEndTime] = useState("")
  const [notifyOnStart, setNotifyOnStart] = useState(true)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])

  // Initialize form when task changes or modal opens
  useEffect(() => {
    if (task && open) {
      setTitle(task.title || "")
      setDescription(task.description || "")
      setPriority(task.priority || "MEDIUM")
      
      // Initialize start and end times - prefer existing values, fallback to due date or current date
      let start: Date | undefined
      let end: Date | undefined
      
      if (task.startTime) {
        start = new Date(task.startTime)
        setStartDate(start)
        setStartTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`)
      } else if (task.dueDate) {
        // Fallback to due date if start time not set
        start = new Date(task.dueDate)
        start.setHours(9, 0, 0, 0) // Default to 9 AM
        setStartDate(start)
        setStartTime("09:00")
      } else {
        // Fallback to current date
        start = new Date()
        start.setHours(9, 0, 0, 0)
        setStartDate(start)
        setStartTime("09:00")
      }
      
      if (task.endTime) {
        end = new Date(task.endTime)
        setEndDate(end)
        setEndTime(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`)
      } else if (task.dueDate) {
        // Fallback to due date if end time not set
        end = new Date(task.dueDate)
        if (task.dueTime) {
          const [hours, minutes] = task.dueTime.split(":").map(Number)
          end.setHours(hours || 17, minutes || 0, 0, 0)
          setEndTime(task.dueTime)
        } else {
          end.setHours(17, 0, 0, 0) // Default to 5 PM
          setEndTime("17:00")
        }
        setEndDate(end)
      } else {
        // Fallback to current date + 1 hour from start
        end = new Date(start || new Date())
        end.setHours((start?.getHours() || 9) + 1, start?.getMinutes() || 0, 0, 0)
        setEndDate(end)
        setEndTime(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`)
      }
      
      setSubtasks(task.subtasks || [])
      setNewSubtaskTitle("")
    }
  }, [task, open])

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim() || !task) return
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
    if (!title.trim() || !task) return
    if (!startDate || !startTime) {
      // Show error - start time is required
      return
    }
    if (!endDate || !endTime) {
      // Show error - end time is required
      return
    }

    // Calculate start and end times
    const startDateTime = new Date(startDate)
    const [sh, sm] = startTime.split(":").map(Number)
    startDateTime.setHours(sh, sm, 0, 0)
    
    const endDateTime = new Date(endDate)
    const [eh, em] = endTime.split(":").map(Number)
    endDateTime.setHours(eh, em, 0, 0)
    
    // Due date = end time
    const dueDateTime = new Date(endDateTime)

    const updates: Partial<Task> = {
      title: title.trim(),
      description: description || "",
      priority,
      dueDate: dueDateTime.toISOString(),
      dueTime: endTime,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      notifyOnStart: notifyOnStart,
    }

    // Only include subtasks if there are any
    if (subtasks.length > 0) {
      updates.subtasks = subtasks.map(st => ({ 
        id: st.id,
        title: st.title,
        completed: st.completed,
        task_id: task.id 
      }))
    } else {
      updates.subtasks = []
    }

    onUpdate(task.id, updates, "Task updated successfully")
    onOpenChange(false)
  }

  const handleCancel = () => {
    // Reset form to original task values (same logic as initialization)
    if (task) {
      setTitle(task.title || "")
      setDescription(task.description || "")
      setPriority(task.priority || "MEDIUM")
      
      let start: Date | undefined
      let end: Date | undefined
      
      if (task.startTime) {
        start = new Date(task.startTime)
        setStartDate(start)
        setStartTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`)
      } else if (task.dueDate) {
        start = new Date(task.dueDate)
        start.setHours(9, 0, 0, 0)
        setStartDate(start)
        setStartTime("09:00")
      } else {
        start = new Date()
        start.setHours(9, 0, 0, 0)
        setStartDate(start)
        setStartTime("09:00")
      }
      
      if (task.endTime) {
        end = new Date(task.endTime)
        setEndDate(end)
        setEndTime(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`)
      } else if (task.dueDate) {
        end = new Date(task.dueDate)
        if (task.dueTime) {
          const [hours, minutes] = task.dueTime.split(":").map(Number)
          end.setHours(hours || 17, minutes || 0, 0, 0)
          setEndTime(task.dueTime)
        } else {
          end.setHours(17, 0, 0, 0)
          setEndTime("17:00")
        }
        setEndDate(end)
      } else {
        end = new Date(start || new Date())
        end.setHours((start?.getHours() || 9) + 1, start?.getMinutes() || 0, 0, 0)
        setEndDate(end)
        setEndTime(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`)
      }
      
      setSubtasks(task.subtasks || [])
      setNewSubtaskTitle("")
    }
    onOpenChange(false)
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95vw] !max-w-[95vw] sm:!w-full sm:!max-w-2xl !max-h-[95vh] sm:!max-h-[90vh] overflow-y-auto !p-3 sm:!p-4 md:!p-6 !top-[2.5%] sm:!top-[50%] !translate-y-0 sm:!translate-y-[-50%] !m-0 sm:!m-4 rounded-lg sm:rounded-lg">
        <DialogHeader className="space-y-1.5 sm:space-y-2 md:space-y-3 pb-2 sm:pb-3 md:pb-4 pr-6 sm:pr-0">
          <DialogTitle className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold leading-tight">
            Edit Task
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
            Update your task details below. Start and end time are required - due date will be set automatically from end time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 md:space-y-5 py-1 sm:py-2 md:py-4">
          {/* Title */}
          <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
            <Label htmlFor="edit-title" className="text-xs sm:text-sm font-semibold">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className="h-10 sm:h-11 text-sm sm:text-base w-full"
            />
          </div>

          {/* Description */}
          <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
            <Label htmlFor="edit-description" className="text-xs sm:text-sm font-semibold">
              Description
            </Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="min-h-[70px] sm:min-h-[80px] md:min-h-[100px] resize-none text-sm sm:text-base w-full"
            />
          </div>

          {/* Priority */}
          <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
            <Label htmlFor="edit-priority" className="text-xs sm:text-sm font-semibold">
              Priority
            </Label>
            <Select value={priority} onValueChange={(value: Task["priority"]) => setPriority(value)}>
              <SelectTrigger id="edit-priority" className="h-10 sm:h-11 text-sm sm:text-base w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-[var(--radix-select-trigger-width)]">
                <SelectItem value="LOW" className="text-sm sm:text-base">Low</SelectItem>
                <SelectItem value="MEDIUM" className="text-sm sm:text-base">Medium</SelectItem>
                <SelectItem value="HIGH" className="text-sm sm:text-base">High</SelectItem>
                <SelectItem value="URGENT" className="text-sm sm:text-base">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start and End Time - Required */}
          <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
            <Label className="text-xs sm:text-sm font-semibold">
              Task Duration <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mb-1 sm:mb-2 leading-relaxed">
              Due date will be automatically set to the end time
            </p>
            <DateTimeRangePicker
              startDate={startDate}
              startTime={startTime}
              endDate={endDate}
              endTime={endTime}
              onStartDateChange={setStartDate}
              onStartTimeChange={setStartTime}
              onEndDateChange={setEndDate}
              onEndTimeChange={setEndTime}
              placeholder="Select start and end time"
            />
            {(!startDate || !startTime || !endDate || !endTime) && (
              <p className="text-xs text-red-500 mt-1">
                Start and end time are required
              </p>
            )}
          </div>

          {/* Start Notification Toggle */}
          <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Label htmlFor="edit-notify-on-start" className="text-xs sm:text-sm font-semibold cursor-pointer">
                  Notify when task starts
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get notified 5 minutes before task start time
                </p>
              </div>
            </div>
            <Switch
              id="edit-notify-on-start"
              checked={notifyOnStart}
              onCheckedChange={setNotifyOnStart}
              className="flex-shrink-0"
            />
          </div>

          {/* Subtasks */}
          <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
            <Label className="text-xs sm:text-sm font-semibold">Subtasks</Label>
            <div className="space-y-1.5 sm:space-y-2">
              {subtasks.map((subtask) => (
                <div 
                  key={subtask.id} 
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 md:p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                >
                  <span className="flex-1 text-xs sm:text-sm break-words min-w-0">{subtask.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSubtask(subtask.id)}
                    className="h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive transition-colors touch-manipulation"
                    aria-label="Remove subtask"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2 sm:gap-3">
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a subtask"
                  className="h-10 sm:h-11 text-sm sm:text-base flex-1 min-w-0"
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
                  className="h-10 sm:h-11 px-3 sm:px-4 flex-shrink-0 hover:bg-accent hover:text-accent-foreground transition-colors touch-manipulation"
                  aria-label="Add subtask"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions - Mobile First: Stack on mobile, side-by-side on larger screens */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 md:pt-5 border-t mt-3 sm:mt-4 md:mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="h-11 sm:h-12 w-full sm:w-auto text-sm sm:text-base font-medium order-2 sm:order-1 touch-manipulation"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !startDate || !startTime || !endDate || !endTime}
            className="h-11 sm:h-12 w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground text-sm sm:text-base font-semibold shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2 touch-manipulation"
          >
            Update Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
