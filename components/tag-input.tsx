"use client"

import React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface TagInputProps {
  tags: string[]
  setTags: (tags: string[]) => void
  disabled?: boolean
}

export function TagInput({ tags, setTags, disabled = false }: TagInputProps) {
  const [inputValue, setInputValue] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault()
      if (!tags.includes(inputValue.trim())) {
        setTags([...tags, inputValue.trim()])
      }
      setInputValue("")
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      setTags(tags.slice(0, -1))
    }
  }

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 border rounded-md">
      {tags.map((tag, index) => (
        <Badge key={index} variant="secondary" className="flex items-center gap-1">
          {tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            disabled={disabled}
            className="rounded-full hover:bg-muted-foreground/20 p-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {tag}</span>
          </button>
        </Badge>
      ))}
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        disabled={disabled}
        className="flex-1 min-w-[120px] border-0 p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
        placeholder={tags.length === 0 ? "Add tags..." : ""}
      />
    </div>
  )
}
