"use client"

import { useEffect, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Color } from "@tiptap/extension-color"
import TextStyle from "@tiptap/extension-text-style"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import FontFamily from "@tiptap/extension-font-family"
import Underline from "@tiptap/extension-underline"
import {
  Bold,
  Italic,
  UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  LinkIcon,
  Unlink,
  Type,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  textColor: string
  fontSize: number
  textAlign: string
  fontFamily?: string
}

const fontFamilies = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Helvetica, sans-serif", label: "Helvetica" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "Courier New, monospace", label: "Courier New" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "Tahoma, sans-serif", label: "Tahoma" },
  { value: "Trebuchet MS, sans-serif", label: "Trebuchet MS" },
]

const fontSizes = [
  { value: 8, label: "8px" },
  { value: 10, label: "10px" },
  { value: 12, label: "12px" },
  { value: 14, label: "14px" },
  { value: 16, label: "16px" },
  { value: 18, label: "18px" },
  { value: 20, label: "20px" },
  { value: 24, label: "24px" },
  { value: 30, label: "30px" },
  { value: 36, label: "36px" },
  { value: 48, label: "48px" },
  { value: 60, label: "60px" },
  { value: 72, label: "72px" },
]

export default function RichTextEditor({
  content,
  onChange,
  textColor,
  fontSize,
  textAlign,
  fontFamily = "Arial, sans-serif",
}: RichTextEditorProps) {
  const [editorContent, setEditorContent] = useState(content)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: editorContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setEditorContent(html)
      onChange(html)
    },
  })

  // Update editor when props change
  useEffect(() => {
    if (editor) {
      // Only update if the content is different to avoid cursor jumping
      if (content !== editorContent && !editor.isFocused) {
        editor.commands.setContent(content)
        setEditorContent(content)
      }

      // Only apply global styles if there's no selection
      if (editor.state.selection.empty) {
        editor.chain().focus().setTextAlign(textAlign).run()
        editor.chain().focus().setColor(textColor).run()
        editor.chain().focus().setFontFamily(fontFamily).run()

        // Instead of using setFontSize, we'll use TextStyle with inline style
        editor
          .chain()
          .focus()
          .setMark("textStyle", { fontSize: `${fontSize}px` })
          .run()
      }
    }
  }, [editor, content, textColor, textAlign, fontFamily, fontSize, editorContent])

  if (!editor) {
    return null
  }

  // Apply style to selected text only
  const applyStyleToSelection = (style: string, value: string) => {
    if (!editor.state.selection.empty) {
      switch (style) {
        case "color":
          editor.chain().focus().setColor(value).run()
          break
        case "fontFamily":
          editor.chain().focus().setFontFamily(value).run()
          break
        case "fontSize":
          // Use TextStyle mark with inline style for font size
          editor.chain().focus().setMark("textStyle", { fontSize: value }).run()
          break
      }
      // Trigger onChange to update the content
      onChange(editor.getHTML())
    }
  }

  return (
    <div className="rich-text-editor">
      <div className="border border-gray-200 rounded-md mb-2">
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded hover:bg-gray-200 ${editor.isActive("bold") ? "bg-gray-200" : ""}`}
            title="Bold"
            type="button"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded hover:bg-gray-200 ${editor.isActive("italic") ? "bg-gray-200" : ""}`}
            title="Italic"
            type="button"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1 rounded hover:bg-gray-200 ${editor.isActive("underline") ? "bg-gray-200" : ""}`}
            title="Underline"
            type="button"
          >
            <UnderlineIcon size={16} />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          <button
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-1 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: "left" }) ? "bg-gray-200" : ""}`}
            title="Align left"
            type="button"
          >
            <AlignLeft size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-1 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: "center" }) ? "bg-gray-200" : ""}`}
            title="Align center"
            type="button"
          >
            <AlignCenter size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-1 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: "right" }) ? "bg-gray-200" : ""}`}
            title="Align right"
            type="button"
          >
            <AlignRight size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className={`p-1 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: "justify" }) ? "bg-gray-200" : ""
            }`}
            title="Justify"
            type="button"
          >
            <AlignJustify size={16} />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          <button
            onClick={() => {
              const url = window.prompt("URL")
              if (url) {
                editor.chain().focus().setLink({ href: url }).run()
              }
            }}
            className={`p-1 rounded hover:bg-gray-200 ${editor.isActive("link") ? "bg-gray-200" : ""}`}
            title="Add link"
            type="button"
          >
            <LinkIcon size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().unsetLink().run()}
            className={`p-1 rounded hover:bg-gray-200`}
            title="Remove link"
            disabled={!editor.isActive("link")}
            type="button"
          >
            <Unlink size={16} />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          <div className="flex items-center">
            <Type size={16} className="mr-1 text-gray-500" />
            <Select
              value={fontFamily}
              onValueChange={(value) => {
                if (!editor.state.selection.empty) {
                  // Apply to selection only
                  applyStyleToSelection("fontFamily", value)
                } else {
                  // Apply to all content
                  editor.chain().focus().setFontFamily(value).run()
                  onChange(editor.getHTML())
                }
              }}
            >
              <SelectTrigger className="h-8 w-32">
                <SelectValue placeholder="Font" />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center ml-2">
            <Select
              value={fontSize.toString()}
              onValueChange={(value) => {
                const size = Number.parseInt(value)
                if (!editor.state.selection.empty) {
                  // Apply to selection only
                  applyStyleToSelection("fontSize", `${size}px`)
                } else {
                  // Apply to all content
                  editor
                    .chain()
                    .focus()
                    .setMark("textStyle", { fontSize: `${size}px` })
                    .run()
                  onChange(editor.getHTML())
                }
              }}
            >
              <SelectTrigger className="h-8 w-20">
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                {fontSizes.map((size) => (
                  <SelectItem key={size.value} value={size.value.toString()}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center ml-2">
            <input
              type="color"
              value={textColor}
              onChange={(e) => {
                const color = e.target.value
                if (!editor.state.selection.empty) {
                  // Apply to selection only
                  applyStyleToSelection("color", color)
                } else {
                  // Apply to all content
                  editor.chain().focus().setColor(color).run()
                  onChange(editor.getHTML())
                }
              }}
              className="w-8 h-8 p-1 border rounded"
            />
          </div>
        </div>

        <div className="p-3 min-h-[100px] prose prose-sm max-w-none">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
