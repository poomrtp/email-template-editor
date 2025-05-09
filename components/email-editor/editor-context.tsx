"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"
import type {
  ComponentType,
  EmailTemplate,
  ComponentProps,
  EmailComponent,
  SocialLink,
  SocialPlatform,
  MergeTag,
} from "./types"

interface EditorContextType {
  template: EmailTemplate
  selectedComponentId: string | null
  selectComponent: (id: string | null) => void
  addComponent: (type: ComponentType, parentId?: string) => string
  updateComponent: (id: string, props: Partial<ComponentProps>) => void
  moveComponent: (id: string, toIndex: number, parentId?: string) => void
  removeComponent: (id: string) => void
  duplicateComponent: (id: string) => void
  exportHtml: () => string
  findComponentById: (id: string) => EmailComponent | null
  importTemplate: (components: EmailComponent[]) => void
  addMergeTag: (tag: MergeTag) => void
  removeMergeTag: (id: string) => void
  updateMergeTag: (id: string, tag: Partial<MergeTag>) => void
}

const EditorContext = createContext<EditorContextType | undefined>(undefined)

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [template, setTemplate] = useState<EmailTemplate>({
    components: [],
    styles: {
      fontFamily: "Inter, sans-serif",
      backgroundColor: "#FFFFFF",
      width: "600px",
    },
    mergeTags: [
      { id: uuidv4(), name: "First Name", value: "{{firstName}}" },
      { id: uuidv4(), name: "Last Name", value: "{{lastName}}" },
      { id: uuidv4(), name: "Email", value: "{{email}}" },
      { id: uuidv4(), name: "Company", value: "{{company}}" },
    ],
  })
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)

  const selectComponent = useCallback((id: string | null) => {
    setSelectedComponentId(id)
  }, [])

  const findComponentById = useCallback(
    (id: string): EmailComponent | null => {
      const findInComponents = (components: EmailComponent[]): EmailComponent | null => {
        for (const component of components) {
          if (component.id === id) {
            return component
          }
          if (component.children && component.children.length > 0) {
            const found = findInComponents(component.children)
            if (found) return found
          }
        }
        return null
      }
      return findInComponents(template.components)
    },
    [template.components],
  )

  const addComponent = useCallback((type: ComponentType, parentId?: string): string => {
    const newComponent = {
      id: uuidv4(),
      type,
      props: getDefaultProps(type),
      children: ["container", "columns"].includes(type) ? [] : undefined,
    }

    setTemplate((prev) => {
      const newTemplate = { ...prev }

      if (parentId) {
        // Add to a specific parent
        const addToParent = (components: EmailComponent[]): EmailComponent[] => {
          return components.map((component) => {
            if (component.id === parentId) {
              return {
                ...component,
                children: [...(component.children || []), newComponent],
              }
            }
            if (component.children) {
              return {
                ...component,
                children: addToParent(component.children),
              }
            }
            return component
          })
        }

        newTemplate.components = addToParent(newTemplate.components)
      } else {
        // Add to root level
        newTemplate.components = [...newTemplate.components, newComponent]
      }

      return newTemplate
    })

    return newComponent.id
  }, [])

  const updateComponent = useCallback((id: string, props: Partial<ComponentProps>) => {
    setTemplate((prev) => {
      const updateProps = (components: EmailComponent[]): EmailComponent[] => {
        return components.map((component) => {
          if (component.id === id) {
            return {
              ...component,
              props: { ...component.props, ...props },
            }
          }
          if (component.children) {
            return {
              ...component,
              children: updateProps(component.children),
            }
          }
          return component
        })
      }

      return {
        ...prev,
        components: updateProps(prev.components),
      }
    })
  }, [])

  const moveComponent = useCallback((id: string, toIndex: number, parentId?: string) => {
    setTemplate((prev) => {
      const newTemplate = { ...prev }
      let componentToMove: EmailComponent | null = null
      let sourceParentId: string | undefined = undefined

      // Find the component and its parent
      const findComponent = (
        components: EmailComponent[],
        currentParentId?: string,
      ): [EmailComponent[], string | undefined] => {
        const newComponents = [...components]

        // Check if the component is at this level
        const index = newComponents.findIndex((c) => c.id === id)
        if (index !== -1) {
          componentToMove = newComponents[index]
          sourceParentId = currentParentId
          newComponents.splice(index, 1)
          return [newComponents, sourceParentId]
        }

        // Look in children
        for (let i = 0; i < newComponents.length; i++) {
          if (newComponents[i].children) {
            const [updatedChildren, foundParentId] = findComponent(newComponents[i].children!, newComponents[i].id)
            if (componentToMove) {
              newComponents[i] = {
                ...newComponents[i],
                children: updatedChildren,
              }
              return [newComponents, foundParentId]
            }
          }
        }

        return [newComponents, undefined]
      }

      // Insert the component at the new position
      const insertComponent = (components: EmailComponent[], targetParentId?: string): EmailComponent[] => {
        if (!componentToMove) return components

        if (!targetParentId) {
          // Insert at root level
          const result = [...components]
          result.splice(toIndex, 0, componentToMove)
          return result
        }

        return components.map((component) => {
          if (component.id === targetParentId) {
            const newChildren = [...(component.children || [])]
            newChildren.splice(toIndex, 0, componentToMove)
            return {
              ...component,
              children: newChildren,
            }
          }

          if (component.children) {
            return {
              ...component,
              children: insertComponent(component.children, targetParentId),
            }
          }

          return component
        })
      }

      // First find and remove the component
      const [updatedComponents, foundParentId] = findComponent(newTemplate.components)
      newTemplate.components = updatedComponents

      // Then insert it at the new position
      if (componentToMove) {
        newTemplate.components = insertComponent(newTemplate.components, parentId)
      }

      return newTemplate
    })
  }, [])

  const removeComponent = useCallback(
    (id: string) => {
      setTemplate((prev) => {
        const removeFromComponents = (components: EmailComponent[]): EmailComponent[] => {
          return components
            .filter((component) => component.id !== id)
            .map((component) => {
              if (component.children) {
                return {
                  ...component,
                  children: removeFromComponents(component.children),
                }
              }
              return component
            })
        }

        return {
          ...prev,
          components: removeFromComponents(prev.components),
        }
      })

      if (selectedComponentId === id) {
        setSelectedComponentId(null)
      }
    },
    [selectedComponentId],
  )

  const duplicateComponent = useCallback(
    (id: string) => {
      const component = findComponentById(id)
      if (!component) return

      // Find parent of the component
      let parentId: string | undefined = undefined
      const findParent = (components: EmailComponent[], parent?: string): string | undefined => {
        for (const comp of components) {
          if (comp.id === id) return parent
          if (comp.children) {
            const found = findParent(comp.children, comp.id)
            if (found) return found
          }
        }
        return undefined
      }

      parentId = findParent(template.components)

      // Create a deep copy of the component with new IDs
      const deepCopy = (component: EmailComponent): EmailComponent => {
        const newId = uuidv4()
        return {
          ...component,
          id: newId,
          children: component.children ? component.children.map(deepCopy) : undefined,
        }
      }

      const duplicatedComponent = deepCopy(component)

      setTemplate((prev) => {
        const newTemplate = { ...prev }

        if (parentId) {
          // Add to a specific parent
          const addToParent = (components: EmailComponent[]): EmailComponent[] => {
            return components.map((component) => {
              if (component.id === parentId) {
                // Find the index of the original component
                const index = component.children?.findIndex((c) => c.id === id) ?? -1
                if (index !== -1 && component.children) {
                  const newChildren = [...component.children]
                  newChildren.splice(index + 1, 0, duplicatedComponent)
                  return {
                    ...component,
                    children: newChildren,
                  }
                }
                return component
              }
              if (component.children) {
                return {
                  ...component,
                  children: addToParent(component.children),
                }
              }
              return component
            })
          }

          newTemplate.components = addToParent(newTemplate.components)
        } else {
          // Add to root level
          const index = newTemplate.components.findIndex((c) => c.id === id)
          if (index !== -1) {
            const newComponents = [...newTemplate.components]
            newComponents.splice(index + 1, 0, duplicatedComponent)
            newTemplate.components = newComponents
          }
        }

        return newTemplate
      })
    },
    [findComponentById, template.components],
  )

  // New function to import a template
  const importTemplate = useCallback((components: EmailComponent[]) => {
    setTemplate((prev) => ({
      ...prev,
      components,
    }))
    setSelectedComponentId(null)
  }, [])

  // Merge tag functions
  const addMergeTag = useCallback((tag: MergeTag) => {
    setTemplate((prev) => ({
      ...prev,
      mergeTags: [...(prev.mergeTags || []), tag],
    }))
  }, [])

  const removeMergeTag = useCallback((id: string) => {
    setTemplate((prev) => ({
      ...prev,
      mergeTags: (prev.mergeTags || []).filter((tag) => tag.id !== id),
    }))
  }, [])

  const updateMergeTag = useCallback((id: string, tag: Partial<MergeTag>) => {
    setTemplate((prev) => ({
      ...prev,
      mergeTags: (prev.mergeTags || []).map((t) => (t.id === id ? { ...t, ...tag } : t)),
    }))
  }, [])

  const exportHtml = useCallback(() => {
    // Enhanced HTML export implementation
    const generateComponentHtml = (component: EmailComponent): string => {
      const { type, props, children } = component

      // Process merge tags in content
      const processMergeTags = (content: string): string => {
        if (!template.mergeTags || !content) return content

        let processedContent = content
        template.mergeTags.forEach((tag) => {
          processedContent = processedContent.replace(new RegExp(tag.name, "g"), tag.value)
        })
        return processedContent
      }

      switch (type) {
        case "text":
          // Use richContent if available, otherwise use regular content
          const textContent =
            props.richContent ||
            `<div style="color: ${props.color}; font-size: ${props.fontSize}px; text-align: ${props.textAlign};">${props.content}</div>`
          return `<div style="padding: ${props.padding}px; ${props.position ? `position: ${props.position};` : ""} ${props.top ? `top: ${props.top};` : ""} ${props.left ? `left: ${props.left};` : ""} ${props.right ? `right: ${props.right};` : ""} ${props.bottom ? `bottom: ${props.bottom};` : ""} ${props.zIndex ? `z-index: ${props.zIndex};` : ""}">${processMergeTags(textContent)}</div>`

        case "header":
          const headerLevel = props.headerLevel || 2
          const headerContent = props.richContent || props.content || "Header Text"
          return `<h${headerLevel} style="color: ${props.color}; font-size: ${props.fontSize}px; text-align: ${props.textAlign}; padding: ${props.padding}px; margin: 0; ${props.position ? `position: ${props.position};` : ""} ${props.top ? `top: ${props.top};` : ""} ${props.left ? `left: ${props.left};` : ""} ${props.right ? `right: ${props.right};` : ""} ${props.bottom ? `bottom: ${props.bottom};` : ""} ${props.zIndex ? `z-index: ${props.zIndex};` : ""}">${processMergeTags(headerContent)}</h${headerLevel}>`

        case "image":
          return `<img src="${props.src}" alt="${props.alt}" style="width: ${props.width}; height: ${props.height}; padding: ${props.padding}px; ${props.position ? `position: ${props.position};` : ""} ${props.top ? `top: ${props.top};` : ""} ${props.left ? `left: ${props.left};` : ""} ${props.right ? `right: ${props.right};` : ""} ${props.bottom ? `bottom: ${props.bottom};` : ""} ${props.zIndex ? `z-index: ${props.zIndex};` : ""}" />`

        case "button":
          const buttonText = processMergeTags(props.text || "Click Me")
          return `<a href="${props.url}" style="display: inline-block; background-color: ${props.backgroundColor}; color: ${props.color}; padding: ${props.padding}px; text-decoration: none; border-radius: ${props.borderRadius}px; text-align: center; ${props.position ? `position: ${props.position};` : ""} ${props.top ? `top: ${props.top};` : ""} ${props.left ? `left: ${props.left};` : ""} ${props.right ? `right: ${props.right};` : ""} ${props.bottom ? `bottom: ${props.bottom};` : ""} ${props.zIndex ? `z-index: ${props.zIndex};` : ""}">${buttonText}</a>`

        case "container":
          const containerChildrenHtml = children?.map(generateComponentHtml).join("") || ""
          return `<div style="background-color: ${props.backgroundColor}; padding: ${props.padding}px; width: ${props.width}; ${props.height ? `height: ${props.height};` : ""} ${props.position ? `position: ${props.position};` : ""} ${props.top ? `top: ${props.top};` : ""} ${props.left ? `left: ${props.left};` : ""} ${props.right ? `right: ${props.right};` : ""} ${props.bottom ? `bottom: ${props.bottom};` : ""} ${props.zIndex ? `z-index: ${props.zIndex};` : ""}">${containerChildrenHtml}</div>`

        case "divider":
          return `<hr style="border: ${props.thickness}px solid ${props.color}; margin: ${props.margin}px 0; ${props.position ? `position: ${props.position};` : ""} ${props.top ? `top: ${props.top};` : ""} ${props.left ? `left: ${props.left};` : ""} ${props.right ? `right: ${props.right};` : ""} ${props.bottom ? `bottom: ${props.bottom};` : ""} ${props.zIndex ? `z-index: ${props.zIndex};` : ""}" />`

        case "columns":
          const columnsChildrenHtml = children?.map(generateComponentHtml).join("") || ""
          return `<table cellpadding="0" cellspacing="0" border="0" width="100%" ${props.stackOnMobile ? 'class="responsive-table"' : ""} style="${props.position ? `position: ${props.position};` : ""} ${props.top ? `top: ${props.top};` : ""} ${props.left ? `left: ${props.left};` : ""} ${props.right ? `right: ${props.right};` : ""} ${props.bottom ? `bottom: ${props.bottom};` : ""} ${props.zIndex ? `z-index: ${props.zIndex};` : ""}">
            <tr>
              <td style="padding: ${props.padding}px; background-color: ${props.backgroundColor};">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr valign="top" style="vertical-align: ${mapFlexToVerticalAlign(props.verticalAlign)};">
                    ${generateColumnsHtml(props.columns || 2, props.columnGap || 20, children || [], props.stackOnMobile)}
                  </tr>
                </table>
              </td>
            </tr>
          </table>`

        case "spacer":
          return `<div style="height: ${props.height}px; ${props.position ? `position: ${props.position};` : ""} ${props.top ? `top: ${props.top};` : ""} ${props.left ? `left: ${props.left};` : ""} ${props.right ? `right: ${props.right};` : ""} ${props.bottom ? `bottom: ${props.bottom};` : ""} ${props.zIndex ? `z-index: ${props.zIndex};` : ""}"></div>`

        case "social":
          return generateSocialHtml(props)

        case "unsubscribe":
          const unsubscribeText = processMergeTags(props.unsubscribeText || "Unsubscribe")
          return `<div style="text-align: ${props.textAlign || "center"}; padding: ${props.padding}px; ${props.position ? `position: ${props.position};` : ""} ${props.top ? `top: ${props.top};` : ""} ${props.left ? `left: ${props.left};` : ""} ${props.right ? `right: ${props.right};` : ""} ${props.bottom ? `bottom: ${props.bottom};` : ""} ${props.zIndex ? `z-index: ${props.zIndex};` : ""}">
            <a href="${props.unsubscribeUrl || "{{unsubscribeUrl}}"}" style="color: ${props.color || "#6B7280"}; font-size: ${props.fontSize || 12}px; text-decoration: underline;">
              ${unsubscribeText}
            </a>
          </div>`

        default:
          return ""
      }
    }

    const mapFlexToVerticalAlign = (align?: string): string => {
      switch (align) {
        case "flex-start":
          return "top"
        case "center":
          return "middle"
        case "flex-end":
          return "bottom"
        default:
          return "top"
      }
    }

    const generateColumnsHtml = (
      columnCount: number,
      gap: number,
      children: EmailComponent[],
      stackOnMobile?: boolean,
    ): string => {
      // Calculate column width factoring in the gap
      const totalGapPercentage = (((columnCount - 1) * gap) / 600) * 100 // Convert gap pixels to percentage of 600px width
      const availableWidthPercentage = 100 - totalGapPercentage
      const columnWidth = availableWidthPercentage / columnCount

      let columnsHtml = ""

      for (let i = 0; i < columnCount; i++) {
        const child = children[i] || null
        const hasRightMargin = i < columnCount - 1

        columnsHtml += `<td width="${columnWidth.toFixed(2)}%" ${
          stackOnMobile ? 'class="responsive-column"' : ""
        } style="${hasRightMargin ? `padding-right: ${gap}px;` : ""} word-break: break-word; overflow-wrap: break-word;">
          ${child ? generateComponentHtml(child) : ""}
        </td>`
      }

      return columnsHtml
    }

    const generateSocialHtml = (props: ComponentProps): string => {
      const {
        socialLinks = [],
        socialSize = 32,
        socialSpacing = 10,
        socialColor = "#FFFFFF",
        socialBackgroundColor = "#2563EB",
        socialShape = "circle",
      } = props

      let socialHtml = `<div style="text-align: ${props.textAlign || "center"}; padding: ${props.padding}px; ${props.position ? `position: ${props.position};` : ""} ${props.top ? `top: ${props.top};` : ""} ${props.left ? `left: ${props.left};` : ""} ${props.right ? `right: ${props.right};` : ""} ${props.bottom ? `bottom: ${props.bottom};` : ""} ${props.zIndex ? `z-index: ${props.zIndex};` : ""}">`

      socialLinks.forEach((link: SocialLink) => {
        if (link.enabled) {
          const borderRadius = socialShape === "circle" ? "50%" : socialShape === "rounded" ? "8px" : "0"

          socialHtml += `
            <a href="${link.url}" target="_blank" style="display: inline-block; margin: 0 ${socialSpacing}px; text-decoration: none;">
              <div style="background-color: ${socialBackgroundColor}; width: ${socialSize}px; height: ${socialSize}px; border-radius: ${borderRadius}; display: flex; align-items: center; justify-content: center;">
                ${getSocialIcon(link.platform, socialColor, Math.floor(socialSize * 0.6))}
              </div>
            </a>
          `
        }
      })

      socialHtml += `</div>`
      return socialHtml
    }

    const getSocialIcon = (platform: SocialPlatform, color: string, size: number): string => {
      // Simple SVG icons for each platform
      const icons: Record<SocialPlatform, string> = {
        facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>`,
        twitter: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>`,
        instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`,
        linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>`,
        youtube: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>`,
        pinterest: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 12h8"></path><path d="M12 8v8"></path><circle cx="12" cy="12" r="10"></circle></svg>`,
        github: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`,
      }

      return icons[platform] || ""
    }

    const bodyContent = template.components.map(generateComponentHtml).join("")

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Template</title>
        <style>
          body {
            font-family: ${template.styles.fontFamily};
            margin: 0;
            padding: 0;
            background-color: ${template.styles.backgroundColor};
          }
          .email-container {
            max-width: ${template.styles.width};
            margin: 0 auto;
            background-color: #ffffff;
            overflow: hidden;
            position: relative;
          }
          table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
            width: 100%;
          }
          img {
            -ms-interpolation-mode: bicubic;
            max-width: 100%;
          }
          td {
            word-break: break-word;
            overflow-wrap: break-word;
          }
          @media only screen and (max-width: 600px) {
            .email-container {
              width: 100% !important;
            }
            .responsive-table {
              width: 100% !important;
              display: table !important;
            }
            .responsive-table tr {
              display: table-row !important;
            }
            .responsive-column {
              display: block !important;
              width: 100% !important;
              padding-right: 0 !important;
              padding-left: 0 !important;
              margin-bottom: 20px !important;
              box-sizing: border-box !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          ${bodyContent}
        </div>
      </body>
      </html>
    `
  }, [template])

  return (
    <EditorContext.Provider
      value={{
        template,
        selectedComponentId,
        selectComponent,
        addComponent,
        updateComponent,
        moveComponent,
        removeComponent,
        duplicateComponent,
        exportHtml,
        findComponentById,
        importTemplate,
        addMergeTag,
        removeMergeTag,
        updateMergeTag,
      }}
    >
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  const context = useContext(EditorContext)
  if (context === undefined) {
    throw new Error("useEditor must be used within an EditorProvider")
  }
  return context
}

// Helper function to get default props for each component type
function getDefaultProps(type: ComponentType): ComponentProps {
  switch (type) {
    case "text":
      return {
        content: "Add your text here",
        richContent: "<p>Add your text here</p>",
        color: "#0F172A",
        fontSize: 16,
        textAlign: "left",
        padding: 10,
        fontFamily: "Arial, sans-serif",
        position: "static",
      }
    case "header":
      return {
        content: "Header Text",
        richContent: "<h2>Header Text</h2>",
        color: "#0F172A",
        fontSize: 24,
        textAlign: "left",
        padding: 10,
        fontFamily: "Arial, sans-serif",
        headerLevel: 2,
        position: "static",
      }
    case "image":
      return {
        src: "/placeholder.svg?height=200&width=400",
        alt: "Image description",
        width: "100%",
        height: "auto",
        padding: 10,
        position: "static",
      }
    case "button":
      return {
        text: "Click Me",
        url: "#",
        backgroundColor: "#2563EB",
        color: "#FFFFFF",
        padding: 10,
        borderRadius: 4,
        textAlign: "center",
        position: "static",
      }
    case "container":
      return {
        backgroundColor: "#FFFFFF",
        padding: 10,
        width: "100%",
        position: "static",
      }
    case "divider":
      return {
        color: "#E2E8F0",
        thickness: 1,
        margin: 10,
        position: "static",
      }
    case "columns":
      return {
        columns: 2,
        columnGap: 20,
        backgroundColor: "#FFFFFF",
        padding: 10,
        verticalAlign: "flex-start",
        horizontalAlign: "flex-start",
        stackOnMobile: true,
        position: "static",
      }
    case "spacer":
      return {
        height: 20,
        position: "static",
      }
    case "social":
      return {
        socialLinks: [
          { platform: "facebook", url: "https://facebook.com", enabled: true },
          { platform: "twitter", url: "https://twitter.com", enabled: true },
          { platform: "instagram", url: "https://instagram.com", enabled: true },
          { platform: "linkedin", url: "https://linkedin.com", enabled: true },
          { platform: "youtube", url: "https://youtube.com", enabled: false },
          { platform: "pinterest", url: "https://pinterest.com", enabled: false },
          { platform: "github", url: "https://github.com", enabled: false },
        ],
        socialSize: 32,
        socialSpacing: 10,
        socialColor: "#FFFFFF",
        socialBackgroundColor: "#2563EB",
        socialShape: "circle",
        textAlign: "center",
        padding: 10,
        position: "static",
      }
    case "unsubscribe":
      return {
        unsubscribeText: "Unsubscribe from this list",
        unsubscribeUrl: "{{unsubscribeUrl}}",
        color: "#6B7280",
        fontSize: 12,
        textAlign: "center",
        padding: 10,
        position: "static",
      }
    default:
      return {}
  }
}
