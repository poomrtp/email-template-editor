import { v4 as uuidv4 } from "uuid"
import type { EmailComponent } from "../types"

export function parseHtmlToComponents(html: string): EmailComponent[] {
  // Create a temporary DOM element to parse the HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")
  const body = doc.body

  // Start parsing from the body
  return parseElement(body)
}

function parseElement(element: Element): EmailComponent[] {
  const components: EmailComponent[] = []

  // Process each child node
  Array.from(element.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (text && text.length > 0) {
        // Create a text component for non-empty text nodes
        components.push(createTextComponent(text))
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      const tagName = el.tagName.toLowerCase()

      // Handle different HTML elements
      switch (tagName) {
        case "div":
        case "section":
          // Check if it might be a container
          if (el.children.length > 0 || hasBackgroundColor(el)) {
            components.push(createContainerComponent(el))
          } else {
            // Parse children and add them directly
            components.push(...parseElement(el))
          }
          break

        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          components.push(createHeaderComponent(el))
          break

        case "p":
          components.push(createTextComponent(el.innerHTML, getStylesFromElement(el)))
          break

        case "img":
          components.push(createImageComponent(el))
          break

        case "a":
          // Check if it looks like a button
          if (isButton(el)) {
            components.push(createButtonComponent(el))
          } else {
            components.push(createTextComponent(el.innerHTML, getStylesFromElement(el)))
          }
          break

        case "hr":
          components.push(createDividerComponent(el))
          break

        case "table":
          // Check if it might be a columns layout
          if (isColumnsTable(el)) {
            components.push(createColumnsComponent(el))
          } else {
            // Treat as a container
            components.push(createContainerComponent(el))
          }
          break

        case "ul":
        case "ol":
          // Handle lists as text components
          components.push(createTextComponent(el.outerHTML, getStylesFromElement(el)))
          break

        default:
          // For other elements, try to parse their children
          const childComponents = parseElement(el)
          if (childComponents.length > 0) {
            components.push(...childComponents)
          } else if (el.textContent?.trim()) {
            // If no structured components but has text, create a text component
            components.push(createTextComponent(el.innerHTML, getStylesFromElement(el)))
          }
      }
    }
  })

  return components
}

// Helper functions to create components

function createTextComponent(content: string, styles: Record<string, string> = {}): EmailComponent {
  return {
    id: uuidv4(),
    type: "text",
    props: {
      content: content,
      richContent: content,
      color: styles.color || "#0F172A",
      fontSize: Number.parseInt(styles.fontSize || "16", 10),
      textAlign: (styles.textAlign as any) || "left",
      padding: Number.parseInt(styles.padding || "10", 10),
      fontFamily: styles.fontFamily || "Arial, sans-serif",
      position: "static",
    },
  }
}

function createHeaderComponent(element: Element): EmailComponent {
  const level = Number.parseInt(element.tagName.substring(1), 10)
  const styles = getStylesFromElement(element)

  return {
    id: uuidv4(),
    type: "header",
    props: {
      content: element.textContent || "Header Text",
      richContent: element.innerHTML,
      color: styles.color || "#0F172A",
      fontSize: Number.parseInt(styles.fontSize || (24 - (level - 1) * 2).toString(), 10),
      textAlign: (styles.textAlign as any) || "left",
      padding: Number.parseInt(styles.padding || "10", 10),
      fontFamily: styles.fontFamily || "Arial, sans-serif",
      headerLevel: level,
      position: "static",
    },
  }
}

function createImageComponent(element: Element): EmailComponent {
  const img = element as HTMLImageElement

  return {
    id: uuidv4(),
    type: "image",
    props: {
      src: img.src || "/placeholder.svg?height=200&width=400",
      alt: img.alt || "Image",
      width: img.style.width || "100%",
      height: img.style.height || "auto",
      padding: 10,
      position: "static",
    },
  }
}

function createButtonComponent(element: Element): EmailComponent {
  const styles = getStylesFromElement(element)
  const link = element as HTMLAnchorElement

  return {
    id: uuidv4(),
    type: "button",
    props: {
      text: element.textContent || "Click Me",
      url: link.href || "#",
      backgroundColor: styles.backgroundColor || "#2563EB",
      color: styles.color || "#FFFFFF",
      padding: Number.parseInt(styles.padding || "10", 10),
      borderRadius: Number.parseInt(styles.borderRadius || "4", 10),
      textAlign: "center",
      position: "static",
    },
  }
}

function createContainerComponent(element: Element): EmailComponent {
  const styles = getStylesFromElement(element)
  const childComponents = parseElement(element)

  return {
    id: uuidv4(),
    type: "container",
    props: {
      backgroundColor: styles.backgroundColor || "#FFFFFF",
      padding: Number.parseInt(styles.padding || "10", 10),
      width: styles.width || "100%",
      position: "static",
    },
    children: childComponents,
  }
}

function createDividerComponent(element: Element): EmailComponent {
  const styles = getStylesFromElement(element)

  return {
    id: uuidv4(),
    type: "divider",
    props: {
      color: styles.borderColor || "#E2E8F0",
      thickness: Number.parseInt(styles.borderWidth || "1", 10),
      margin: 10,
      position: "static",
    },
  }
}

function createColumnsComponent(element: Element): EmailComponent {
  const rows = element.querySelectorAll("tr")
  const firstRow = rows[0]
  const columns = firstRow ? firstRow.querySelectorAll("td, th") : []
  const columnCount = columns.length

  // Create child components for each column
  const children: EmailComponent[] = []

  columns.forEach((column) => {
    // Parse the content of each column
    const columnComponents = parseElement(column)

    if (columnComponents.length > 0) {
      // If multiple components in a column, wrap them in a container
      if (columnComponents.length > 1) {
        children.push({
          id: uuidv4(),
          type: "container",
          props: {
            backgroundColor: "#FFFFFF",
            padding: 0,
            width: "100%",
            position: "static",
          },
          children: columnComponents,
        })
      } else {
        // Just add the single component
        children.push(columnComponents[0])
      }
    }
  })

  return {
    id: uuidv4(),
    type: "columns",
    props: {
      columns: columnCount || 2,
      columnGap: 20,
      backgroundColor: "#FFFFFF",
      padding: 10,
      verticalAlign: "flex-start",
      horizontalAlign: "flex-start",
      stackOnMobile: true,
      position: "static",
    },
    children,
  }
}

// Helper functions for style extraction and element analysis

function getStylesFromElement(element: Element): Record<string, string> {
  const styles: Record<string, string> = {}

  // Get inline styles
  const style = (element as HTMLElement).style
  for (let i = 0; i < style.length; i++) {
    const prop = style[i]
    styles[camelCase(prop)] = style.getPropertyValue(prop)
  }

  // Try to get computed styles if available
  if (typeof window !== "undefined") {
    const computedStyle = window.getComputedStyle(element)

    // Extract relevant styles if not already set inline
    const relevantStyles = [
      "color",
      "background-color",
      "font-size",
      "font-family",
      "text-align",
      "padding",
      "width",
      "height",
      "border-radius",
      "border-width",
      "border-color",
    ]

    relevantStyles.forEach((prop) => {
      const camelProp = camelCase(prop)
      if (!styles[camelProp]) {
        const value = computedStyle.getPropertyValue(prop)
        if (value && value !== "initial" && value !== "inherit") {
          styles[camelProp] = value
        }
      }
    })
  }

  return styles
}

function camelCase(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}

function hasBackgroundColor(element: Element): boolean {
  const style = (element as HTMLElement).style
  return !!style.backgroundColor || !!style.background
}

function isButton(element: Element): boolean {
  const el = element as HTMLElement

  // Check if it has button-like styling
  const hasButtonStyling =
    el.style.backgroundColor ||
    el.style.border ||
    el.style.borderRadius ||
    el.style.padding ||
    el.classList.contains("button") ||
    el.getAttribute("role") === "button"

  // Check if it's a short text link that might be a button
  const isShortLink = el.textContent && el.textContent.trim().length < 30

  return hasButtonStyling || isShortLink
}

function isColumnsTable(element: Element): boolean {
  // Check if the table has a simple structure that might represent columns
  const rows = element.querySelectorAll("tr")

  if (rows.length === 1) {
    const cells = rows[0].querySelectorAll("td, th")
    return cells.length > 1
  }

  return false
}
