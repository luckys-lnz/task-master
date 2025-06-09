"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus } from "lucide-react"
import type { Subtask } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"

interface SubtaskListProps {
  subtasks: Subtask[]
  onToggle: (id: string, completed: boolean) => void
  onAdd: (subtask: Subtask) => void
  onDelete: (id: string) => void
}

export function SubtaskList({ subtasks, onToggle, onAdd, onDelete }: SubtaskListProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return

    onAdd({
      id: uuidv4(),
      title: newSubtaskTitle,
      completed: false,
    })

    setNewSubtaskTitle("")
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Subtasks</div>

      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-2">
            <Checkbox
              checked={subtask.completed}
              onCheckedChange={(checked) => onToggle(subtask.id, !!checked)}
              id={`subtask-${subtask.id}`}
            />
            <label
              htmlFor={`subtask-${subtask.id}`}
              className={`flex-1 text-sm ${subtask.completed ? "line-through text-muted-foreground" : ""}`}
            >
              {subtask.title}
            </label>
            <Button variant="ghost" size="sm" onClick={() => onDelete(subtask.id)} className="h-8 w-8 p-0">
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          placeholder="Add a subtask"
          className="text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAddSubtask()
            }
          }}
        />
        <Button type="button" size="sm" variant="outline" onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  )
}
