"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Code, Undo, Redo } from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="bg-muted p-2 flex flex-wrap gap-1 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-muted-foreground/20" : ""}
        >
          <Bold className="h-4 w-4" />
          <span className="sr-only">Bold</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-muted-foreground/20" : ""}
        >
          <Italic className="h-4 w-4" />
          <span className="sr-only">Italic</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "bg-muted-foreground/20" : ""}
        >
          <Heading1 className="h-4 w-4" />
          <span className="sr-only">Heading 1</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-muted-foreground/20" : ""}
        >
          <Heading2 className="h-4 w-4" />
          <span className="sr-only">Heading 2</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-muted-foreground/20" : ""}
        >
          <List className="h-4 w-4" />
          <span className="sr-only">Bullet List</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-muted-foreground/20" : ""}
        >
          <ListOrdered className="h-4 w-4" />
          <span className="sr-only">Ordered List</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive("codeBlock") ? "bg-muted-foreground/20" : ""}
        >
          <Code className="h-4 w-4" />
          <span className="sr-only">Code Block</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="h-4 w-4" />
          <span className="sr-only">Undo</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="h-4 w-4" />
          <span className="sr-only">Redo</span>
        </Button>
      </div>
      <EditorContent editor={editor} className="p-3 min-h-[150px] prose prose-sm max-w-none" />
    </div>
  )
}
