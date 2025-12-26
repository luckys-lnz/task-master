"use client"

import React from "react"
import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Plus, X, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/types"
import { TagInput } from "@/components/tag-input"
import { RichTextEditor } from "@/components/rich-text-editor"
import { v4 as uuidv4 } from 'uuid';

interface TaskEditorProps {
  task?: Task
  onSave: (task: Partial<Task>) => void
  onCancel: () => void
  isLoading?: boolean
}

export function TaskEditor({ task, onSave, onCancel, isLoading }: TaskEditorProps) {
  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [category, setCategory] = useState(task?.category || "")
  const [priority, setPriority] = useState(task?.priority || "MEDIUM")
  const [tags, setTags] = useState<string[]>(task?.tags || [])
  const [dueDate, setDueDate] = useState<Date | undefined>(task?.dueDate ? new Date(task.dueDate) : undefined)
  const [dueTime, setDueTime] = useState(task?.dueTime || "")
  const [notes, setNotes] = useState(task?.notes || "")
  const [subtasks, setSubtasks] = useState<Array<{
    id: string;
    title: string;
    completed: boolean;
  }>>([])
  const [attachments, setAttachments] = useState<File[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [errors, setErrors] = useState<{
    title?: string
    dueDate?: string
    dueTime?: string
  }>({})

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    // Validate title
    if (!title.trim()) {
      newErrors.title = "Title is required"
    } else if (title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters"
    } else if (title.trim().length > 200) {
      newErrors.title = "Title must be less than 200 characters"
    }

    // Validate date and time combination
    if (dueDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selectedDate = new Date(dueDate)
      selectedDate.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        newErrors.dueDate = "Cannot select a past date"
      } else if (selectedDate.getTime() === today.getTime() && dueTime) {
        const [hours, minutes] = dueTime.split(":").map(Number)
        const selectedDateTime = new Date(dueDate)
        selectedDateTime.setHours(hours, minutes, 0, 0)
        const now = new Date()

        if (selectedDateTime < now) {
          newErrors.dueTime = "Cannot select a time in the past"
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      setSubtasks([...subtasks, { id: uuidv4(), title: newSubtaskTitle.trim(), completed: false }])
      setNewSubtaskTitle("")
    }
  }

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    onSave({
      title,
      description,
      category,
      priority,
      tags,
      dueDate: dueDate?.toISOString(),
      dueTime,
      notes,
      subtasks: subtasks.map(st => ({
        id: st.id,
        title: st.title,
        completed: st.completed,
        task_id: task?.id ?? ""
      })),
      attachments: undefined
    })
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <TagInput tags={tags} setTags={setTags} />
          </div>

          <div className="space-y-2">
            <DateTimePicker
              date={dueDate}
              time={dueTime}
              onDateChange={(date) => {
                setDueDate(date)
                if (errors.dueDate) {
                  setErrors((prev) => {
                    const newErrors = { ...prev }
                    delete newErrors.dueDate
                    return newErrors
                  })
                }
              }}
              onTimeChange={(time) => {
                setDueTime(time)
                if (errors.dueTime) {
                  setErrors((prev) => {
                    const newErrors = { ...prev }
                    delete newErrors.dueTime
                    return newErrors
                  })
                }
              }}
              onClear={() => {
                setDueDate(undefined)
                setDueTime("")
                setErrors((prev) => {
                  const newErrors = { ...prev }
                  delete newErrors.dueDate
                  delete newErrors.dueTime
                  return newErrors
                })
              }}
              label="Due Date & Time"
            />
            {(errors.dueDate || errors.dueTime) && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <span>•</span>
                <span>{errors.dueDate || errors.dueTime}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Subtasks</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a subtask"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                />
                <Button type="button" onClick={handleAddSubtask} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2">
                    <Input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => {
                        const newSubtasks = [...subtasks]
                        const idx = newSubtasks.findIndex(st => st.id === subtask.id)
                        if (idx !== -1) {
                          newSubtasks[idx].completed = !newSubtasks[idx].completed
                          setSubtasks(newSubtasks)
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="flex-1">{subtask.title}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSubtask(subtask.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                onChange={handleFileChange}
                multiple
                className="flex-1"
                id="attachments"
              />
              <Label htmlFor="attachments" className="cursor-pointer">
                <Paperclip className="h-4 w-4" />
              </Label>
            </div>
            {attachments.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {attachments.length} file(s) selected
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <RichTextEditor value={notes} onChange={setNotes} />
          </div>
        </CardContent>

        <CardFooter className="px-4 py-3 bg-muted/50 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                {task ? "Updating..." : "Adding..."}
              </div>
            ) : (
              task ? "Update Task" : "Add Task"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
