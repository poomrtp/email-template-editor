"use client"

import type React from "react"
import { useDrag } from "react-dnd"
import {
  Type,
  ImageIcon,
  Square,
  SeparatorHorizontal,
  Columns,
  ArrowUpDown,
  MousePointerSquareDashed,
  Share2,
  Heading,
  Mail,
} from "lucide-react"
import type { ComponentType } from "./types"

export default function ComponentPanel() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-[#0F172A]">Components</h2>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-500 mb-1">Layout</h3>
        <div className="grid grid-cols-2 gap-2">
          <DraggableComponent type="container" icon={<Square size={18} />} label="Container" />
          <DraggableComponent type="columns" icon={<Columns size={18} />} label="Columns" />
          <DraggableComponent type="spacer" icon={<ArrowUpDown size={18} />} label="Spacer" />
          <DraggableComponent type="divider" icon={<SeparatorHorizontal size={18} />} label="Divider" />
        </div>

        <h3 className="text-sm font-medium text-gray-500 mt-4 mb-1">Content</h3>
        <div className="grid grid-cols-2 gap-2">
          <DraggableComponent type="text" icon={<Type size={18} />} label="Text" />
          <DraggableComponent type="header" icon={<Heading size={18} />} label="Header" />
          <DraggableComponent type="image" icon={<ImageIcon size={18} />} label="Image" />
          <DraggableComponent type="button" icon={<MousePointerSquareDashed size={18} />} label="Button" />
          <DraggableComponent type="social" icon={<Share2 size={18} />} label="Social" />
          <DraggableComponent type="unsubscribe" icon={<Mail size={18} />} label="Unsubscribe" />
        </div>
      </div>
    </div>
  )
}

interface DraggableComponentProps {
  type: ComponentType
  icon: React.ReactNode
  label: string
}

function DraggableComponent({ type, icon, label }: DraggableComponentProps) {
  const [{ isDragging }, drag] = useDrag({
    type: "COMPONENT",
    item: { type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  })

  return (
    <div
      ref={drag}
      className={`flex flex-col items-center p-3 rounded-md border border-gray-200 cursor-move hover:bg-gray-50 transition-colors ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="text-[#64748B] mb-1">{icon}</div>
      <span className="text-xs font-medium text-[#0F172A] text-center">{label}</span>
    </div>
  )
}
