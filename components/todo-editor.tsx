"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Todo } from "@/lib/types"
import { TagInput } from "@/components/tag-input"
import { RichTextEditor } from "@/components/rich-text-editor"

interface TodoEditorProps {
  todo?: Todo
  onSave: (todo: Partial<Todo>) => void
  onCancel: () => void
}

export function TodoEditor({ todo, onSave, onCancel }: TodoEditorProps) {
  const [title, setTitle] = useState(todo?.title || "")
  const [description, setDescription] = useState(todo?.description || "")
  const [category, setCategory] = useState(todo?.category || "")
  const [priority, setPriority] = useState(todo?.priority || "medium")
  const [tags, setTags] = useState<string[]>(todo?.tags || [])
  const [dueDate, setDueDate] = useState<Date | undefined>(todo?.dueDate ? new Date(todo.dueDate) : undefined)
  const [dueTime, setDueTime] = useState(todo?.dueTime || "")
  const [notes, setNotes] = useState(todo?.notes || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    onSave({
      title,
      description,
      category,
      priority,
      tags,
      dueDate: dueDate?.toISOString(),
      dueTime,
      notes,
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
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <TagInput tags={tags} setTags={setTags} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueTime">Due Time</Label>
              <div className="flex">
                <Clock className="mr-2 h-4 w-4 mt-3" />
                <Input id="dueTime" type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <RichTextEditor value={notes} onChange={setNotes} />
          </div>
        </CardContent>

        <CardFooter className="px-4 py-3 bg-muted/50 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{todo ? "Update Task" : "Add Task"}</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
