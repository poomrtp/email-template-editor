"use client"

import { useState, useRef, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tag } from "lucide-react"
import { useEditor } from "./editor-context"

interface MergeTagSelectorProps {
  onSelect: (tag: string) => void
}

export default function MergeTagSelector({ onSelect }: MergeTagSelectorProps) {
  const { template } = useEditor()
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter tags based on search term
  const filteredTags = (template.mergeTags || []).filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.value.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Focus input when popover opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const handleSelect = (tagValue: string) => {
    onSelect(tagValue)
    setIsOpen(false)
    setSearchTerm("")
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Tag size={14} />
          <span>Merge Tags</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <Input
            ref={inputRef}
            placeholder="Search merge tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-60 overflow-y-auto py-1">
          {filteredTags.length > 0 ? (
            filteredTags.map((tag) => (
              <button
                key={tag.id}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                onClick={() => handleSelect(tag.value)}
              >
                <div className="font-medium text-sm">{tag.name}</div>
                <div className="text-xs text-gray-400 font-mono mt-1">{tag.value}</div>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">No merge tags found</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
