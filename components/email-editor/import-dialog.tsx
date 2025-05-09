"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Import } from "lucide-react"
import { useEditor } from "./editor-context"
import { parseHtmlToComponents } from "./utils/html-parser"

export default function ImportDialog() {
  const { importTemplate } = useEditor()
  const [htmlContent, setHtmlContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const handleImport = () => {
    if (!htmlContent.trim()) {
      setError("Please enter HTML content to import")
      return
    }

    try {
      const components = parseHtmlToComponents(htmlContent)
      importTemplate(components)
      setHtmlContent("")
      setError(null)
      setIsOpen(false)
    } catch (err) {
      setError(`Error parsing HTML: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Import size={16} className="mr-2" />
          Import HTML
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import HTML</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <p className="text-sm text-gray-500">
            Paste your HTML content below. The editor will attempt to convert it into editable components.
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            placeholder="Paste your HTML here..."
            className="min-h-[300px] font-mono text-sm"
          />

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport}>Import</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
