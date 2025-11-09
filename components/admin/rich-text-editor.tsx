"use client"

import { useEffect, useRef } from "react"
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Heading1, Heading2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const COMMANDS = [
  { icon: Bold, label: "Negrito", command: "bold" },
  { icon: Italic, label: "Itálico", command: "italic" },
  { icon: Underline, label: "Sublinhado", command: "underline" },
  { icon: Heading1, label: "Título 1", command: "formatBlock", argument: "h1" },
  { icon: Heading2, label: "Título 2", command: "formatBlock", argument: "h2" },
  { icon: List, label: "Lista", command: "insertUnorderedList" },
  { icon: ListOrdered, label: "Lista numerada", command: "insertOrderedList" },
]

interface RichTextEditorProps {
  value?: string | null
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  name?: string
}

export function RichTextEditor({ value, onChange, placeholder, className, name }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && typeof value === "string" && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || ""
    }
  }, [value])

  const handleInput = () => {
    if (!editorRef.current) return
    onChange?.(editorRef.current.innerHTML)
  }

  const runCommand = (command: string, argument?: string) => {
    if (command === "createLink") {
      const url = prompt("Insira o URL")
      if (!url) return
      document.execCommand("createLink", false, url)
    } else if (command === "formatBlock" && argument) {
      document.execCommand("formatBlock", false, argument)
    } else {
      document.execCommand(command, false, argument ?? "")
    }
    handleInput()
  }

  return (
    <div className={cn("rounded-lg border bg-background", className)}>
      <div className="flex flex-wrap gap-1 border-b bg-muted/40 px-2 py-1.5">
        {COMMANDS.map((item) => (
          <Button
            key={item.label}
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title={item.label}
            onClick={(event) => {
              event.preventDefault()
              runCommand(item.command, item.argument)
            }}
          >
            <item.icon className="h-3.5 w-3.5" />
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Inserir link"
          onClick={(event) => {
            event.preventDefault()
            runCommand("createLink")
          }}
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div
        ref={editorRef}
        className={cn(
          "min-h-[160px] resize-y overflow-auto px-4 py-3 text-sm focus:outline-none",
          "[&:empty::before]:pointer-events-none [&:empty::before]:text-sm [&:empty::before]:text-muted-foreground [&:empty::before]:content-[attr(data-placeholder)]",
        )}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder ?? ""}
        onInput={handleInput}
      />
      {name && <textarea name={name} className="sr-only" value={value ?? ""} readOnly aria-hidden />}
    </div>
  )
}
