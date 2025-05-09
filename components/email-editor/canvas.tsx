"use client";

import { useMobile } from "@/hooks/use-mobile";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  Trash2,
} from "lucide-react";
import type React from "react";
import { JSX, useEffect, useRef, useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { useEditor } from "./editor-context";
import type { EmailComponent, SocialLink } from "./types";
import { getSocialIcon } from "./utils/social-icons";

export default function Canvas() {
  const { template, addComponent, selectComponent, findComponentById } =
    useEditor();
  const [canvasHeight, setCanvasHeight] = useState<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobile();

  // Add click handler for canvas
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only clear selection if clicking directly on the canvas
    if (e.target === canvasRef.current) {
      selectComponent(null);
    }
  };

  const [{ isOver }, drop] = useDrop({
    accept: ["COMPONENT", "REORDER_COMPONENT"],
    drop: (item: any, monitor) => {
      // Only add component if it's dropped directly on the canvas
      // and it's a new component (not a reordering)
      if (monitor.isOver({ shallow: true }) && item.type) {
        addComponent(item.type);
        return { handled: true };
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver({ shallow: true }),
    }),
  });

  // Combine refs
  const setRefs = (element: HTMLDivElement | null) => {
    canvasRef.current = element;
    drop(element);
  };

  // Update canvas height based on content
  useEffect(() => {
    const updateCanvasHeight = () => {
      if (contentRef.current) {
        const contentHeight = contentRef.current.scrollHeight;
        setCanvasHeight(Math.max(contentHeight, 400));
      }
    };

    // Initial update
    updateCanvasHeight();

    // Set up resize observer to detect content changes
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasHeight();
    });

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    // Set up mutation observer to detect DOM changes
    const mutationObserver = new MutationObserver(() => {
      updateCanvasHeight();
    });

    if (contentRef.current) {
      mutationObserver.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    }

    // Clean up
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [template.components]);

  // Calculate canvas width based on screen size
  const getCanvasWidth = () => {
    if (isMobile) {
      return "100%";
    } else {
      return "600px"; // Default email width
    }
  };

  return (
    <div className="flex-1 p-2 sm:p-6 overflow-y-auto bg-gray-100 flex justify-center">
      <div
        ref={(el) => {
          setRefs(el);
          canvasRef.current = el;
        }}
        className={`bg-white shadow-md transition-all duration-300 overflow-hidden ${
          isOver ? "ring-2 ring-[#3B82F6]" : ""
        }`}
        style={{
          width: getCanvasWidth(),
          height: canvasHeight ? `${canvasHeight}px` : "auto",
          minHeight: "400px",
          maxWidth: "100%",
          position: "relative", // Added for absolute positioning of children
        }}
        onClick={handleCanvasClick}
      >
        {template.components.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-md">
            <div className="text-center p-6">
              <p className="mb-2">Drag and drop components here</p>
              <p className="text-sm">
                or click on a component in the left panel
              </p>
            </div>
          </div>
        ) : (
          <div ref={contentRef} className="p-4">
            {template.components.map((component, index) => (
              <ComponentRenderer
                key={component.id}
                component={component}
                index={index}
                parentId={undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ComponentRendererProps {
  component: EmailComponent;
  index: number;
  parentId?: string;
}

// Add type guard for EmailComponent
function isEmailComponent(value: any): value is EmailComponent {
  return value && typeof value === "object" && "id" in value && "type" in value;
}

function ComponentRenderer({
  component,
  index,
  parentId,
}: ComponentRendererProps) {
  const {
    selectedComponentId,
    selectComponent,
    removeComponent,
    moveComponent,
    addComponent,
    duplicateComponent,
    template,
    findComponentById,
  } = useEditor();
  const [showControls, setShowControls] = useState(false);

  const isSelected = selectedComponentId === component.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling to canvas
    selectComponent(component.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeComponent(component.id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateComponent(component.id);
  };

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (index > 0) {
      moveComponent(component.id, index - 1, parentId);
    }
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    // We don't know the total number of siblings here, so we move to the current index + 1
    // The context will handle boundary checks
    moveComponent(component.id, index + 1, parentId);
  };

  // For drag and drop reordering
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: "REORDER_COMPONENT",
    item: { id: component.id, index, parentId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ["COMPONENT", "REORDER_COMPONENT"],
    hover(item: any, monitor) {
      if (!ref.current) return;

      // Don't replace items with themselves
      if (item.id === component.id) return;

      // Always allow reordering among siblings
      if (
        item.type === undefined &&
        item.id &&
        item.parentId === parentId &&
        item.index !== index
      ) {
        moveComponent(item.id, index, parentId);
        item.index = index;
        return;
      }

      // Existing logic for reordering among siblings
      if (item.type === undefined && item.id) {
        if (item.parentId === parentId) {
          const dragIndex = item.index;
          const hoverIndex = index;
          if (dragIndex === hoverIndex) return;
          moveComponent(item.id, hoverIndex, parentId);
          item.index = hoverIndex;
        } else if (["container", "columns"].includes(component.type)) {
          moveComponent(item.id, component.children?.length ?? 0, component.id);
          item.parentId = component.id;
          item.index = (component.children?.length ?? 1) - 1;
        }
      }
    },
    drop: (item: any, monitor) => {
      // Only handle if it's dropped directly on this component
      if (!monitor.didDrop()) {
        // This is a new component being added
        if (item.type) {
          if (["container", "columns"].includes(component.type)) {
            addComponent(item.type, component.id);
            return { handled: true };
          }
        } else if (item.id && item.parentId !== parentId) {
          // This is a component being moved from another parent
          // If this component is a container/columns, move as last child
          if (["container", "columns"].includes(component.type)) {
            moveComponent(
              item.id,
              component.children?.length ?? 0,
              component.id
            );
            return { handled: true };
          } else {
            // Move to this index in the current parent
            moveComponent(item.id, index, parentId);
            return { handled: true };
          }
        }
      }
    },
    canDrop: (item: any) => {
      // Allow dropping new components only in containers or columns
      if (item.type) {
        return ["container", "columns"].includes(component.type);
      }
      // Allow dropping existing components anywhere
      return true;
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver({ shallow: true }),
      canDrop: !!monitor.canDrop(),
    }),
  });

  // Connect the drag preview to the component
  preview(drop(ref));

  // Determine if the component has absolute positioning
  const isAbsolutePositioned = component.props.position === "absolute";

  // Render the component based on its type
  const renderComponent = () => {
    const { type, props, children } = component;

    switch (type) {
      case "text":
        return (
          <div
            style={{
              padding: `${props.padding}px`,
              position: props.position || "static",
              top: props.top,
              left: props.left,
              right: props.right,
              bottom: props.bottom,
              zIndex: props.zIndex,
            }}
          >
            {/* Use dangerouslySetInnerHTML to render rich content */}
            {props.richContent ? (
              <div
                dangerouslySetInnerHTML={{ __html: props.richContent }}
                style={{
                  color: props.color,
                  fontSize: `${props.fontSize}px`,
                  textAlign: props.textAlign as any,
                  fontFamily: props.fontFamily || "Arial, sans-serif",
                }}
              />
            ) : (
              <div
                style={{
                  color: props.color,
                  fontSize: `${props.fontSize}px`,
                  textAlign: props.textAlign as any,
                  fontFamily: props.fontFamily || "Arial, sans-serif",
                }}
              >
                {props.content}
              </div>
            )}
          </div>
        );

      case "header":
        const HeaderTag = `h${
          props.headerLevel || 2
        }` as keyof JSX.IntrinsicElements;
        return (
          <div
            style={{
              padding: `${props.padding}px`,
              position: props.position || "static",
              top: props.top,
              left: props.left,
              right: props.right,
              bottom: props.bottom,
              zIndex: props.zIndex,
            }}
          >
            {props.richContent ? (
              <div
                dangerouslySetInnerHTML={{ __html: props.richContent }}
                style={{
                  color: props.color,
                  fontSize: `${props.fontSize}px`,
                  textAlign: props.textAlign as any,
                  fontFamily: props.fontFamily || "Arial, sans-serif",
                  margin: 0,
                }}
              />
            ) : (
              <HeaderTag
                style={{
                  color: props.color,
                  fontSize: `${props.fontSize}px`,
                  textAlign: props.textAlign as any,
                  fontFamily: props.fontFamily || "Arial, sans-serif",
                  margin: 0,
                }}
              >
                {props.content || "Header Text"}
              </HeaderTag>
            )}
          </div>
        );

      case "image":
        return (
          <div
            style={{
              padding: `${props.padding}px`,
              position: props.position || "static",
              top: props.top,
              left: props.left,
              right: props.right,
              bottom: props.bottom,
              zIndex: props.zIndex,
            }}
          >
            <img
              src={props.src || "/placeholder.svg?height=200&width=400"}
              alt={props.alt || ""}
              style={{
                width: props.width,
                height: props.height,
                maxWidth: "100%",
              }}
            />
          </div>
        );

      case "button":
        return (
          <div
            style={{
              padding: `${props.padding}px`,
              textAlign: (props.textAlign as any) || "center",
              position: props.position || "static",
              top: props.top,
              left: props.left,
              right: props.right,
              bottom: props.bottom,
              zIndex: props.zIndex,
            }}
          >
            <button
              style={{
                backgroundColor: props.backgroundColor,
                color: props.color,
                padding: `${props.padding}px`,
                borderRadius: `${props.borderRadius}px`,
                border: "none",
                cursor: "pointer",
                display: "inline-block",
              }}
            >
              {props.text}
            </button>
          </div>
        );

      case "container":
        return (
          <div
            ref={(node) => {
              drop(node);
            }}
            style={{
              backgroundColor: props.backgroundColor,
              padding: `${props.padding}px`,
              width: props.width,
              minHeight: children?.length === 0 ? "50px" : "auto",
              position: props.position || "static",
              top: props.top,
              left: props.left,
              right: props.right,
              bottom: props.bottom,
              zIndex: props.zIndex,
            }}
            className={`${
              canDrop && isOver ? "bg-opacity-50 ring-2 ring-green-400" : ""
            }`}
          >
            {children?.map((child, childIndex) => {
              if (!isEmailComponent(child)) return null;
              return (
                <ComponentRenderer
                  key={child.id}
                  component={child}
                  index={childIndex}
                  parentId={component.id}
                />
              );
            })}

            {children?.length === 0 && (
              <div className="h-20 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-md">
                <p className="text-sm">Drop components here</p>
              </div>
            )}
          </div>
        );

      case "divider":
        return (
          <hr
            style={{
              border: `${props.thickness}px solid ${props.color}`,
              margin: `${props.margin}px 0`,
              position: props.position || "static",
              top: props.top,
              left: props.left,
              right: props.right,
              bottom: props.bottom,
              zIndex: props.zIndex,
            }}
          />
        );

      case "columns":
        // Calculate the actual width for each column, taking into account the gap
        const columns = props.columns || 2; // Default to 2 columns if undefined
        const totalGap = (props.columnGap || 0) * (columns - 1);
        const availableWidth = 100 - totalGap / columns;
        const columnWidth = availableWidth / columns;

        // Create appropriate class for columns container based on stackOnMobile
        const columnsContainerClass = props.stackOnMobile
          ? "flex flex-col sm:flex-row sm:flex-nowrap" // Stack on mobile, row on larger screens
          : "flex flex-row flex-nowrap"; // Always row (never wrap)

        return (
          <div
            ref={(node) => {
              drop(node);
            }}
            style={{
              backgroundColor: props.backgroundColor,
              padding: `${props.padding}px`,
              position: props.position || "static",
              top: props.top,
              left: props.left,
              right: props.right,
              bottom: props.bottom,
              zIndex: props.zIndex,
            }}
            className={`${
              canDrop && isOver ? "bg-opacity-50 ring-2 ring-green-400" : ""
            }`}
          >
            <div
              className={columnsContainerClass}
              style={{
                alignItems: props.verticalAlign as any,
                justifyContent: props.horizontalAlign as any,
                width: "100%",
              }}
            >
              {Array.from({ length: columns }).map((_, colIndex) => {
                const columnChild = children?.find((_, i) => i === colIndex);

                // Calculate the correct percentage width
                const colWidth = `${columnWidth}%`;

                return (
                  <div
                    key={colIndex}
                    className={`${
                      props.stackOnMobile ? "w-full sm:w-auto" : ""
                    } overflow-hidden`}
                    style={{
                      flex: props.stackOnMobile
                        ? "1 1 100%"
                        : `0 0 ${colWidth}`,
                      maxWidth: props.stackOnMobile ? "100%" : colWidth,
                      minWidth: 0, // Prevent overflow
                      ...(colIndex < columns - 1 && {
                        marginRight: `${props.columnGap}px`,
                      }), // Add gap as margin-right except for last column
                    }}
                  >
                    {columnChild && isEmailComponent(columnChild) ? (
                      <ComponentRenderer
                        component={columnChild}
                        index={colIndex}
                        parentId={component.id}
                      />
                    ) : (
                      <div className="h-full min-h-[50px] flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-md">
                        <p className="text-sm">Drop component here</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "spacer":
        return (
          <div
            style={{
              height: `${props.height}px`,
              position: props.position || "static",
              top: props.top,
              left: props.left,
              right: props.right,
              bottom: props.bottom,
              zIndex: props.zIndex,
            }}
          />
        );

      case "social":
        return (
          <div
            style={{
              padding: `${props.padding}px`,
              textAlign: (props.textAlign as any) || "center",
              position: props.position || "static",
              top: props.top,
              left: props.left,
              right: props.right,
              bottom: props.bottom,
              zIndex: props.zIndex,
            }}
          >
            <div className="flex flex-wrap justify-center gap-2">
              {props.socialLinks?.map(
                (link: SocialLink, i: number) =>
                  link.enabled && (
                    <div
                      key={i}
                      style={{
                        backgroundColor: props.socialBackgroundColor,
                        width: `${props.socialSize || 32}px`,
                        height: `${props.socialSize || 32}px`,
                        borderRadius:
                          props.socialShape === "circle"
                            ? "50%"
                            : props.socialShape === "rounded"
                            ? "8px"
                            : "0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: `0 ${props.socialSpacing}px`,
                      }}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: getSocialIcon(
                            link.platform,
                            props.socialColor || "#000000",
                            Math.floor((props.socialSize || 32) * 0.6)
                          ),
                        }}
                      />
                    </div>
                  )
              )}
            </div>
          </div>
        );

      case "unsubscribe":
        return (
          <div
            style={{
              padding: `${props.padding}px`,
              textAlign: (props.textAlign as any) || "center",
              position: props.position || "static",
              top: props.top,
              left: props.left,
              right: props.right,
              bottom: props.bottom,
              zIndex: props.zIndex,
            }}
          >
            <a
              href={props.unsubscribeUrl || "#"}
              style={{
                color: props.color || "#6B7280",
                fontSize: `${props.fontSize || 12}px`,
                textDecoration: "underline",
              }}
            >
              {props.unsubscribeText || "Unsubscribe from this list"}
            </a>
          </div>
        );

      default:
        return <div>Unknown component type: {type}</div>;
    }
  };

  // Calculate control position based on component position
  const getControlsPosition = () => {
    if (isAbsolutePositioned) {
      return {
        position: "absolute",
        top: "-24px",
        right: "0",
        zIndex: 10,
      } as React.CSSProperties;
    }
    return {
      position: "absolute",
      top: "-3px",
      right: "-3px",
      zIndex: 10,
    } as React.CSSProperties;
  };

  const getDragHandlePosition = () => {
    if (isAbsolutePositioned) {
      return {
        position: "absolute",
        left: "0",
        top: "-24px",
        transform: "none",
        zIndex: 100,
      } as React.CSSProperties;
    }
    return {
      position: "absolute",
      left: "-3px",
      top: "50%",
      transform: "translateY(-50%)",
    } as React.CSSProperties;
  };

  return (
    <div
      ref={ref}
      className={`relative mb-2 ${isSelected ? "ring-2 ring-[#3B82F6]" : ""} ${
        showControls && !isSelected ? "ring-1 ring-gray-300" : ""
      } ${isDragging ? "opacity-50" : ""} ${
        isOver && canDrop ? "ring-2 ring-green-400" : ""
      }`}
      onClick={handleClick}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      style={{
        position: isAbsolutePositioned ? "static" : "relative",
      }}
    >
      {(isSelected || showControls) && (
        <div className="flex space-x-1 z-10" style={getControlsPosition()}>
          <button
            className="bg-gray-100 text-gray-700 p-1 rounded-full hover:bg-gray-200"
            onClick={handleMoveUp}
            title="Move up"
          >
            <ChevronUp size={14} />
          </button>
          <button
            className="bg-gray-100 text-gray-700 p-1 rounded-full hover:bg-gray-200"
            onClick={handleMoveDown}
            title="Move down"
          >
            <ChevronDown size={14} />
          </button>
          <button
            className="bg-gray-100 text-gray-700 p-1 rounded-full hover:bg-gray-200"
            onClick={handleDuplicate}
            title="Duplicate"
          >
            <Copy size={14} />
          </button>
          <button
            className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
            onClick={handleDelete}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div
        ref={(node) => {
          if (node) {
            drag(node);
            if (ref) {
              (ref as React.RefObject<HTMLDivElement | null>).current = node;
            }
          }
        }}
        className={`cursor-move ${
          isSelected || showControls ? "visible" : "invisible"
        }`}
        style={getDragHandlePosition()}
      >
        <GripVertical size={16} className="text-gray-400" />
      </div>

      {renderComponent()}
    </div>
  );
}
