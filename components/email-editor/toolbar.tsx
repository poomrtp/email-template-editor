"use client"

import { useEditor } from "./editor-context"
import { Button } from "@/components/ui/button"
import { Download, Eye, Smartphone, Monitor, Code, Tag } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { v4 as uuidv4 } from "uuid"
import ImportDialog from "./import-dialog"
import type { MergeTag } from "./types"

export default function Toolbar() {
  const { exportHtml, template, addMergeTag, removeMergeTag, updateMergeTag } = useEditor()
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleExport = () => {
    const html = exportHtml()
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "email-template.html"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      <div>
        <h1 className="text-xl font-semibold text-[#0F172A]">Email Template Editor</h1>
      </div>

      <div className="flex items-center space-x-2">
        <MergeTagsDialog
          mergeTags={template.mergeTags || []}
          onAdd={addMergeTag}
          onRemove={removeMergeTag}
          onUpdate={updateMergeTag}
        />
        <ImportDialog />
        <PreviewDialog />
        <HtmlViewDialog />

        <Button variant="default" onClick={handleExport} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
          <Download size={16} className="mr-2" />
          Export HTML
        </Button>
      </div>
    </div>
  )
}

interface MergeTagsDialogProps {
  mergeTags: MergeTag[]
  onAdd: (tag: MergeTag) => void
  onRemove: (id: string) => void
  onUpdate: (id: string, tag: Partial<MergeTag>) => void
}

function MergeTagsDialog({ mergeTags, onAdd, onRemove, onUpdate }: MergeTagsDialogProps) {
  const [newTagName, setNewTagName] = useState("")
  const [newTagValue, setNewTagValue] = useState("")

  const handleAddTag = () => {
    if (newTagName && newTagValue) {
      onAdd({
        id: uuidv4(),
        name: newTagName,
        value: newTagValue,
      })
      setNewTagName("")
      setNewTagValue("")
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Tag size={16} className="mr-2" />
          Merge Tags
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Merge Tags</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            {mergeTags.map((tag) => (
              <div key={tag.id} className="flex items-center space-x-2 p-2 border rounded-md">
                <Input
                  value={tag.name}
                  onChange={(e) => onUpdate(tag.id, { name: e.target.value })}
                  className="flex-1"
                  placeholder="Tag name"
                />
                <Input
                  value={tag.value}
                  onChange={(e) => onUpdate(tag.id, { value: e.target.value })}
                  className="flex-1"
                  placeholder="{{value}}"
                />
                <Button variant="ghost" size="sm" onClick={() => onRemove(tag.id)}>
                  &times;
                </Button>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <Label>Add New Merge Tag</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Input
                placeholder="Tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="{{value}}"
                value={newTagValue}
                onChange={(e) => setNewTagValue(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddTag} disabled={!newTagName || !newTagValue}>
                Add
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PreviewDialog() {
  const { exportHtml } = useEditor()
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop")

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Eye size={16} className="mr-2" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center mb-4">
          <div className="bg-gray-100 rounded-lg p-1 inline-flex">
            <button
              className={`p-2 rounded ${viewMode === "desktop" ? "bg-white shadow" : ""}`}
              onClick={() => setViewMode("desktop")}
            >
              <Monitor size={16} />
            </button>
            <button
              className={`p-2 rounded ${viewMode === "mobile" ? "bg-white shadow" : ""}`}
              onClick={() => setViewMode("mobile")}
            >
              <Smartphone size={16} />
            </button>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <div
            className={`border border-gray-200 rounded-md ${
              viewMode === "mobile" ? "w-[375px]" : "w-full"
            } transition-all duration-300`}
          >
            <iframe srcDoc={exportHtml()} title="Email Preview" className="w-full h-[600px] rounded-md" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function HtmlViewDialog() {
  const { exportHtml } = useEditor()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Code size={16} className="mr-2" />
          View HTML
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>HTML Code</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{exportHtml()}</pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
