"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Facebook,
  Github,
  Instagram,
  Linkedin,
  Plus,
  Tag,
  Trash2,
  Twitter,
  Youtube,
} from "lucide-react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useEditor } from "./editor-context";
import MergeTagSelector from "./merge-tag-selector";
import RichTextEditor from "./rich-text-editor";
import type {
  ComponentType,
  MergeTag,
  SocialLink,
  SocialPlatform,
} from "./types";

export default function PropertiesPanel() {
  const {
    template,
    selectedComponentId,
    updateComponent,
    findComponentById,
    addMergeTag,
    removeMergeTag,
    updateMergeTag,
  } = useEditor();
  const [newTagName, setNewTagName] = useState("");
  const [newTagValue, setNewTagValue] = useState("");

  // Find the selected component
  const selectedComponent = selectedComponentId
    ? findComponentById(selectedComponentId)
    : null;

  if (!selectedComponent) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-[#0F172A]">
          Properties
        </h2>
        <p className="text-sm text-gray-500">
          Select a component to edit its properties
        </p>

        <div className="mt-8">
          <h3 className="text-md font-semibold mb-2 text-[#0F172A]">
            Merge Tags
          </h3>
          <div className="space-y-2">
            {template.mergeTags?.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <div className="flex items-center">
                  <Tag size={14} className="mr-2 text-gray-500" />
                  <span className="text-sm">{tag.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    value={tag.value}
                    onChange={(e) =>
                      updateMergeTag(tag.id, { value: e.target.value })
                    }
                    className="w-32 h-8 text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMergeTag(tag.id)}
                    className="h-6 w-6"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex items-center space-x-2 mt-4">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (newTagName && newTagValue) {
                    addMergeTag({
                      id: uuidv4(),
                      name: newTagName,
                      value: newTagValue,
                    });
                    setNewTagName("");
                    setNewTagValue("");
                  }
                }}
                disabled={!newTagName || !newTagValue}
              >
                <Plus size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (key: string, value: any) => {
    updateComponent(selectedComponentId!, { [key]: value });
  };

  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-[#0F172A]">Properties</h2>

      {renderPropertiesForm(
        selectedComponent.type,
        selectedComponent.props,
        handleChange,
        template.mergeTags
      )}
    </div>
  );
}

function renderPropertiesForm(
  type: ComponentType,
  props: any,
  onChange: (key: string, value: any) => void,
  mergeTags?: MergeTag[]
) {
  // Common position controls for all components
  const positionControls = (
    <Tabs defaultValue="position" className="mt-4">
      <TabsList className="w-full mb-4">
        <TabsTrigger value="position" className="flex-1">
          Position
        </TabsTrigger>
      </TabsList>

      <TabsContent value="position" className="space-y-4">
        <div>
          <Label htmlFor="position">Position</Label>
          <Select
            value={props.position || "static"}
            onValueChange={(value) => onChange("position", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="static">Static</SelectItem>
              <SelectItem value="relative">Relative</SelectItem>
              <SelectItem value="absolute">Absolute</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {props.position !== "static" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="top">Top</Label>
                <Input
                  id="top"
                  type="text"
                  value={props.top || ""}
                  onChange={(e) => onChange("top", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="left">Left</Label>
                <Input
                  id="left"
                  type="text"
                  value={props.left || ""}
                  onChange={(e) => onChange("left", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="right">Right</Label>
                <Input
                  id="right"
                  type="text"
                  value={props.right || ""}
                  onChange={(e) => onChange("right", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bottom">Bottom</Label>
                <Input
                  id="bottom"
                  type="text"
                  value={props.bottom || ""}
                  onChange={(e) => onChange("bottom", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="zIndex">Z-Index</Label>
              <Input
                id="zIndex"
                type="number"
                value={props.zIndex || 0}
                onChange={(e) => onChange("zIndex", Number(e.target.value))}
              />
            </div>
          </>
        )}
      </TabsContent>
    </Tabs>
  );

  // Merge tag selector for text-based components
  const mergeTagSelector =
    mergeTags && mergeTags.length > 0 ? (
      <div className="mb-4">
        <Label>Insert Merge Tag</Label>
        <MergeTagSelector
          onSelect={(tagValue) => {
            // Insert the tag name into the content
            if (type === "text" || type === "header") {
              const currentContent = props.content || "";
              onChange("content", `${currentContent} ${tagValue} `);

              // Also update rich content if available
              if (props.richContent) {
                const richContent = props.richContent;
                // Simple insertion at the end for now
                onChange(
                  "richContent",
                  richContent.replace(/<\/p>$/, ` ${tagValue} </p>`)
                );
              }
            } else if (type === "button") {
              const currentText = props.text || "";
              onChange("text", `${currentText} ${tagValue} `);
            } else if (type === "unsubscribe") {
              const currentText = props.unsubscribeText || "";
              onChange("unsubscribeText", `${currentText} ${tagValue} `);
            }
          }}
        />
      </div>
    ) : null;

  switch (type) {
    case "text":
      return (
        <div className="space-y-4">
          {mergeTagSelector}

          <div>
            <Label htmlFor="richContent">Content</Label>
            <RichTextEditor
              content={props.richContent || "<p>Add your text here</p>"}
              onChange={(html) => onChange("richContent", html)}
              textColor={props.color}
              fontSize={props.fontSize}
              textAlign={props.textAlign}
              fontFamily={props.fontFamily || "Arial, sans-serif"}
            />
          </div>

          <div>
            <Label htmlFor="fontFamily">Font Family</Label>
            <Select
              value={props.fontFamily || "Arial, sans-serif"}
              onValueChange={(value) => onChange("fontFamily", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select font family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                <SelectItem value="Georgia, serif">Georgia</SelectItem>
                <SelectItem value="Times New Roman, serif">
                  Times New Roman
                </SelectItem>
                <SelectItem value="Courier New, monospace">
                  Courier New
                </SelectItem>
                <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                <SelectItem value="Tahoma, sans-serif">Tahoma</SelectItem>
                <SelectItem value="Trebuchet MS, sans-serif">
                  Trebuchet MS
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="color">Text Color</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="color"
                type="color"
                className="w-10 h-10 p-1"
                value={props.color}
                onChange={(e) => onChange("color", e.target.value)}
              />
              <Input
                type="text"
                value={props.color}
                onChange={(e) => onChange("color", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="fontSize">Font Size ({props.fontSize}px)</Label>
            <Slider
              id="fontSize"
              value={[props.fontSize]}
              min={8}
              max={72}
              step={1}
              onValueChange={(value) => onChange("fontSize", value[0])}
              className="py-4"
            />
          </div>

          <div>
            <Label htmlFor="textAlign">Text Align</Label>
            <Select
              value={props.textAlign}
              onValueChange={(value) => onChange("textAlign", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select alignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="justify">Justify</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="padding">Padding ({props.padding}px)</Label>
            <Slider
              id="padding"
              value={[props.padding]}
              min={0}
              max={50}
              step={1}
              onValueChange={(value) => onChange("padding", value[0])}
              className="py-4"
            />
          </div>

          {positionControls}
        </div>
      );

    case "header":
      return (
        <div className="space-y-4">
          {mergeTagSelector}

          <div>
            <Label htmlFor="richContent">Header Text</Label>
            <RichTextEditor
              content={
                props.richContent ||
                `<h${props.headerLevel || 2}>Header Text</h${
                  props.headerLevel || 2
                }>`
              }
              onChange={(html) => onChange("richContent", html)}
              textColor={props.color}
              fontSize={props.fontSize}
              textAlign={props.textAlign}
              fontFamily={props.fontFamily || "Arial, sans-serif"}
            />
          </div>

          <div>
            <Label htmlFor="headerLevel">Header Level</Label>
            <Select
              value={(props.headerLevel || 2).toString()}
              onValueChange={(value) => onChange("headerLevel", Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select header level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">H1</SelectItem>
                <SelectItem value="2">H2</SelectItem>
                <SelectItem value="3">H3</SelectItem>
                <SelectItem value="4">H4</SelectItem>
                <SelectItem value="5">H5</SelectItem>
                <SelectItem value="6">H6</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fontFamily">Font Family</Label>
            <Select
              value={props.fontFamily || "Arial, sans-serif"}
              onValueChange={(value) => onChange("fontFamily", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select font family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                <SelectItem value="Georgia, serif">Georgia</SelectItem>
                <SelectItem value="Times New Roman, serif">
                  Times New Roman
                </SelectItem>
                <SelectItem value="Courier New, monospace">
                  Courier New
                </SelectItem>
                <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                <SelectItem value="Tahoma, sans-serif">Tahoma</SelectItem>
                <SelectItem value="Trebuchet MS, sans-serif">
                  Trebuchet MS
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="color">Text Color</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="color"
                type="color"
                className="w-10 h-10 p-1"
                value={props.color}
                onChange={(e) => onChange("color", e.target.value)}
              />
              <Input
                type="text"
                value={props.color}
                onChange={(e) => onChange("color", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="fontSize">Font Size ({props.fontSize}px)</Label>
            <Slider
              id="fontSize"
              value={[props.fontSize]}
              min={16}
              max={72}
              step={1}
              onValueChange={(value) => onChange("fontSize", value[0])}
              className="py-4"
            />
          </div>

          <div>
            <Label htmlFor="textAlign">Text Align</Label>
            <Select
              value={props.textAlign}
              onValueChange={(value) => onChange("textAlign", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select alignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="padding">Padding ({props.padding}px)</Label>
            <Slider
              id="padding"
              value={[props.padding]}
              min={0}
              max={50}
              step={1}
              onValueChange={(value) => onChange("padding", value[0])}
              className="py-4"
            />
          </div>

          {positionControls}
        </div>
      );

    case "image":
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="src">Image URL</Label>
            <Input
              id="src"
              type="text"
              value={props.src}
              onChange={(e) => onChange("src", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="alt">Alt Text</Label>
            <Input
              id="alt"
              type="text"
              value={props.alt}
              onChange={(e) => onChange("alt", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="width">Width</Label>
            <Input
              id="width"
              type="text"
              value={props.width}
              onChange={(e) => onChange("width", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="height">Height</Label>
            <Input
              id="height"
              type="text"
              value={props.height}
              onChange={(e) => onChange("height", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="padding">Padding ({props.padding}px)</Label>
            <Slider
              id="padding"
              value={[props.padding]}
              min={0}
              max={50}
              step={1}
              onValueChange={(value) => onChange("padding", value[0])}
              className="py-4"
            />
          </div>

          {positionControls}
        </div>
      );

    case "button":
      return (
        <Tabs defaultValue="content">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="content" className="flex-1">
              Content
            </TabsTrigger>
            <TabsTrigger value="style" className="flex-1">
              Style
            </TabsTrigger>
            <TabsTrigger value="position" className="flex-1">
              Position
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            {mergeTagSelector}

            <div>
              <Label htmlFor="text">Button Text</Label>
              <Input
                id="text"
                type="text"
                value={props.text}
                onChange={(e) => onChange("text", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="text"
                value={props.url}
                onChange={(e) => onChange("url", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="textAlign">Alignment</Label>
              <Select
                value={props.textAlign || "center"}
                onValueChange={(value) => onChange("textAlign", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4">
            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  className="w-10 h-10 p-1"
                  value={props.backgroundColor}
                  onChange={(e) => onChange("backgroundColor", e.target.value)}
                />
                <Input
                  type="text"
                  value={props.backgroundColor}
                  onChange={(e) => onChange("backgroundColor", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="color">Text Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="color"
                  type="color"
                  className="w-10 h-10 p-1"
                  value={props.color}
                  onChange={(e) => onChange("color", e.target.value)}
                />
                <Input
                  type="text"
                  value={props.color}
                  onChange={(e) => onChange("color", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="padding">Padding ({props.padding}px)</Label>
              <Slider
                id="padding"
                value={[props.padding]}
                min={0}
                max={50}
                step={1}
                onValueChange={(value) => onChange("padding", value[0])}
                className="py-4"
              />
            </div>

            <div>
              <Label htmlFor="borderRadius">
                Border Radius ({props.borderRadius}px)
              </Label>
              <Slider
                id="borderRadius"
                value={[props.borderRadius]}
                min={0}
                max={20}
                step={1}
                onValueChange={(value) => onChange("borderRadius", value[0])}
                className="py-4"
              />
            </div>
          </TabsContent>

          <TabsContent value="position" className="space-y-4">
            <div>
              <Label htmlFor="position">Position</Label>
              <Select
                value={props.position || "static"}
                onValueChange={(value) => onChange("position", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Static</SelectItem>
                  <SelectItem value="relative">Relative</SelectItem>
                  <SelectItem value="absolute">Absolute</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {props.position !== "static" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="top">Top</Label>
                    <Input
                      id="top"
                      type="text"
                      value={props.top || ""}
                      onChange={(e) => onChange("top", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="left">Left</Label>
                    <Input
                      id="left"
                      type="text"
                      value={props.left || ""}
                      onChange={(e) => onChange("left", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="right">Right</Label>
                    <Input
                      id="right"
                      type="text"
                      value={props.right || ""}
                      onChange={(e) => onChange("right", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bottom">Bottom</Label>
                    <Input
                      id="bottom"
                      type="text"
                      value={props.bottom || ""}
                      onChange={(e) => onChange("bottom", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="zIndex">Z-Index</Label>
                  <Input
                    id="zIndex"
                    type="number"
                    value={props.zIndex || 0}
                    onChange={(e) => onChange("zIndex", Number(e.target.value))}
                  />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      );

    case "container":
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="backgroundColor">Background Color</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="backgroundColor"
                type="color"
                className="w-10 h-10 p-1"
                value={props.backgroundColor}
                onChange={(e) => onChange("backgroundColor", e.target.value)}
              />
              <Input
                type="text"
                value={props.backgroundColor}
                onChange={(e) => onChange("backgroundColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="padding">Padding ({props.padding}px)</Label>
            <Slider
              id="padding"
              value={[props.padding]}
              min={0}
              max={50}
              step={1}
              onValueChange={(value) => onChange("padding", value[0])}
              className="py-4"
            />
          </div>

          <div>
            <Label htmlFor="width">Width</Label>
            <Input
              id="width"
              type="text"
              value={props.width}
              onChange={(e) => onChange("width", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="height">Height (optional)</Label>
            <Input
              id="height"
              type="text"
              value={props.height || ""}
              onChange={(e) => onChange("height", e.target.value)}
              placeholder="auto"
            />
          </div>

          {positionControls}
        </div>
      );

    case "divider":
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="color"
                type="color"
                className="w-10 h-10 p-1"
                value={props.color}
                onChange={(e) => onChange("color", e.target.value)}
              />
              <Input
                type="text"
                value={props.color}
                onChange={(e) => onChange("color", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="thickness">Thickness ({props.thickness}px)</Label>
            <Slider
              id="thickness"
              value={[props.thickness]}
              min={1}
              max={10}
              step={1}
              onValueChange={(value) => onChange("thickness", value[0])}
              className="py-4"
            />
          </div>

          <div>
            <Label htmlFor="margin">Margin ({props.margin}px)</Label>
            <Slider
              id="margin"
              value={[props.margin]}
              min={0}
              max={50}
              step={1}
              onValueChange={(value) => onChange("margin", value[0])}
              className="py-4"
            />
          </div>

          {positionControls}
        </div>
      );

    case "columns":
      return (
        <Tabs defaultValue="layout">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="layout" className="flex-1">
              Layout
            </TabsTrigger>
            <TabsTrigger value="style" className="flex-1">
              Style
            </TabsTrigger>
            <TabsTrigger value="responsive" className="flex-1">
              Responsive
            </TabsTrigger>
          </TabsList>

          <TabsContent value="layout" className="space-y-4">
            <div>
              <Label htmlFor="columns">Number of Columns</Label>
              <Select
                value={props.columns.toString()}
                onValueChange={(value) =>
                  onChange("columns", Number.parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select columns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Column</SelectItem>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="columnGap">
                Column Gap ({props.columnGap}px)
              </Label>
              <Slider
                id="columnGap"
                value={[props.columnGap]}
                min={0}
                max={50}
                step={1}
                onValueChange={(value) => onChange("columnGap", value[0])}
                className="py-4"
              />
            </div>

            <div>
              <Label htmlFor="verticalAlign">Vertical Alignment</Label>
              <Select
                value={props.verticalAlign || "flex-start"}
                onValueChange={(value) => onChange("verticalAlign", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flex-start">Top</SelectItem>
                  <SelectItem value="center">Middle</SelectItem>
                  <SelectItem value="flex-end">Bottom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="horizontalAlign">Horizontal Alignment</Label>
              <Select
                value={props.horizontalAlign || "flex-start"}
                onValueChange={(value) => onChange("horizontalAlign", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flex-start">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="flex-end">Right</SelectItem>
                  <SelectItem value="space-between">Space Between</SelectItem>
                  <SelectItem value="space-around">Space Around</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4">
            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  className="w-10 h-10 p-1"
                  value={props.backgroundColor}
                  onChange={(e) => onChange("backgroundColor", e.target.value)}
                />
                <Input
                  type="text"
                  value={props.backgroundColor}
                  onChange={(e) => onChange("backgroundColor", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="padding">Padding ({props.padding}px)</Label>
              <Slider
                id="padding"
                value={[props.padding]}
                min={0}
                max={50}
                step={1}
                onValueChange={(value) => onChange("padding", value[0])}
                className="py-4"
              />
            </div>
          </TabsContent>

          <TabsContent value="responsive" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="stackOnMobile"
                checked={props.stackOnMobile}
                onCheckedChange={(checked) =>
                  onChange("stackOnMobile", checked)
                }
              />
              <Label htmlFor="stackOnMobile">Stack columns on mobile</Label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              When enabled, columns will stack vertically on mobile devices for
              better readability.
            </p>
          </TabsContent>
        </Tabs>
      );

    case "spacer":
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="height">Height ({props.height}px)</Label>
            <Slider
              id="height"
              value={[props.height]}
              min={5}
              max={100}
              step={1}
              onValueChange={(value) => onChange("height", value[0])}
              className="py-4"
            />
          </div>

          {positionControls}
        </div>
      );

    case "social":
      return (
        <Tabs defaultValue="platforms">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="platforms" className="flex-1">
              Platforms
            </TabsTrigger>
            <TabsTrigger value="style" className="flex-1">
              Style
            </TabsTrigger>
            <TabsTrigger value="position" className="flex-1">
              Position
            </TabsTrigger>
          </TabsList>

          <TabsContent value="platforms" className="space-y-4">
            {props.socialLinks?.map((link: SocialLink, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <div className="flex items-center space-x-2">
                  {getSocialIcon(link.platform)}
                  <span className="text-sm">
                    {capitalizeFirstLetter(link.platform)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`social-${link.platform}`}
                    checked={link.enabled}
                    onCheckedChange={(checked) => {
                      const newLinks = [...props.socialLinks];
                      newLinks[index].enabled = checked;
                      onChange("socialLinks", newLinks);
                    }}
                  />
                  <Input
                    type="text"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...props.socialLinks];
                      newLinks[index].url = e.target.value;
                      onChange("socialLinks", newLinks);
                    }}
                    className="w-32 h-8 text-xs"
                    disabled={!link.enabled}
                  />
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="style" className="space-y-4">
            <div>
              <Label htmlFor="socialSize">
                Icon Size ({props.socialSize}px)
              </Label>
              <Slider
                id="socialSize"
                value={[props.socialSize]}
                min={16}
                max={64}
                step={1}
                onValueChange={(value) => onChange("socialSize", value[0])}
                className="py-4"
              />
            </div>

            <div>
              <Label htmlFor="socialSpacing">
                Icon Spacing ({props.socialSpacing}px)
              </Label>
              <Slider
                id="socialSpacing"
                value={[props.socialSpacing]}
                min={0}
                max={30}
                step={1}
                onValueChange={(value) => onChange("socialSpacing", value[0])}
                className="py-4"
              />
            </div>

            <div>
              <Label htmlFor="socialColor">Icon Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="socialColor"
                  type="color"
                  className="w-10 h-10 p-1"
                  value={props.socialColor}
                  onChange={(e) => onChange("socialColor", e.target.value)}
                />
                <Input
                  type="text"
                  value={props.socialColor}
                  onChange={(e) => onChange("socialColor", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="socialBackgroundColor">Background Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="socialBackgroundColor"
                  type="color"
                  className="w-10 h-10 p-1"
                  value={props.socialBackgroundColor}
                  onChange={(e) =>
                    onChange("socialBackgroundColor", e.target.value)
                  }
                />
                <Input
                  type="text"
                  value={props.socialBackgroundColor}
                  onChange={(e) =>
                    onChange("socialBackgroundColor", e.target.value)
                  }
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="socialShape">Icon Shape</Label>
              <Select
                value={props.socialShape}
                onValueChange={(value) => onChange("socialShape", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shape" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle">Circle</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="rounded">Rounded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="textAlign">Alignment</Label>
              <Select
                value={props.textAlign || "center"}
                onValueChange={(value) => onChange("textAlign", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="position" className="space-y-4">
            <div>
              <Label htmlFor="position">Position</Label>
              <Select
                value={props.position || "static"}
                onValueChange={(value) => onChange("position", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Static</SelectItem>
                  <SelectItem value="relative">Relative</SelectItem>
                  <SelectItem value="absolute">Absolute</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {props.position !== "static" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="top">Top</Label>
                    <Input
                      id="top"
                      type="text"
                      value={props.top || ""}
                      onChange={(e) => onChange("top", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="left">Left</Label>
                    <Input
                      id="left"
                      type="text"
                      value={props.left || ""}
                      onChange={(e) => onChange("left", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="right">Right</Label>
                    <Input
                      id="right"
                      type="text"
                      value={props.right || ""}
                      onChange={(e) => onChange("right", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bottom">Bottom</Label>
                    <Input
                      id="bottom"
                      type="text"
                      value={props.bottom || ""}
                      onChange={(e) => onChange("bottom", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="zIndex">Z-Index</Label>
                  <Input
                    id="zIndex"
                    type="number"
                    value={props.zIndex || 0}
                    onChange={(e) => onChange("zIndex", Number(e.target.value))}
                  />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      );

    case "unsubscribe":
      return (
        <div className="space-y-4">
          {mergeTagSelector}

          <div>
            <Label htmlFor="unsubscribeText">Unsubscribe Text</Label>
            <Input
              id="unsubscribeText"
              type="text"
              value={props.unsubscribeText}
              onChange={(e) => onChange("unsubscribeText", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="unsubscribeUrl">Unsubscribe URL</Label>
            <Input
              id="unsubscribeUrl"
              type="text"
              value={props.unsubscribeUrl}
              onChange={(e) => onChange("unsubscribeUrl", e.target.value)}
              placeholder="{{unsubscribeUrl}}"
            />
          </div>

          <div>
            <Label htmlFor="color">Text Color</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="color"
                type="color"
                className="w-10 h-10 p-1"
                value={props.color}
                onChange={(e) => onChange("color", e.target.value)}
              />
              <Input
                type="text"
                value={props.color}
                onChange={(e) => onChange("color", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="fontSize">Font Size ({props.fontSize}px)</Label>
            <Slider
              id="fontSize"
              value={[props.fontSize]}
              min={8}
              max={24}
              step={1}
              onValueChange={(value) => onChange("fontSize", value[0])}
              className="py-4"
            />
          </div>

          <div>
            <Label htmlFor="textAlign">Text Align</Label>
            <Select
              value={props.textAlign}
              onValueChange={(value) => onChange("textAlign", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select alignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="padding">Padding ({props.padding}px)</Label>
            <Slider
              id="padding"
              value={[props.padding]}
              min={0}
              max={50}
              step={1}
              onValueChange={(value) => onChange("padding", value[0])}
              className="py-4"
            />
          </div>

          {positionControls}
        </div>
      );

    default:
      return null;
  }
}

function getSocialIcon(platform: SocialPlatform) {
  switch (platform) {
    case "facebook":
      return <Facebook size={16} />;
    case "twitter":
      return <Twitter size={16} />;
    case "instagram":
      return <Instagram size={16} />;
    case "linkedin":
      return <Linkedin size={16} />;
    case "youtube":
      return <Youtube size={16} />;
    case "github":
      return <Github size={16} />;
    default:
      return null;
  }
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
