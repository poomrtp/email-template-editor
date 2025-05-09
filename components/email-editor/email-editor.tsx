"use client"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import ComponentPanel from "./component-panel"
import Canvas from "./canvas"
import PropertiesPanel from "./properties-panel"
import Toolbar from "./toolbar"
import { EditorProvider } from "./editor-context"

export default function EmailEditor() {
  return (
    <DndProvider backend={HTML5Backend}>
      <EditorProvider>
        <div className="flex flex-col h-screen">
          <Toolbar />
          <div className="flex flex-1 overflow-hidden">
            <ComponentPanel />
            <Canvas />
            <PropertiesPanel />
          </div>
        </div>
      </EditorProvider>
    </DndProvider>
  )
}
