export type ComponentType =
  | "text"
  | "image"
  | "button"
  | "container"
  | "divider"
  | "columns"
  | "spacer"
  | "social"
  | "header"
  | "unsubscribe"

export type TextAlignment = "left" | "center" | "right" | "justify"
export type FlexAlignment = "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly"
export type SocialPlatform = "facebook" | "twitter" | "instagram" | "linkedin" | "youtube" | "pinterest" | "github"

export interface SocialLink {
  platform: SocialPlatform
  url: string
  enabled: boolean
}

export interface MergeTag {
  id: string
  name: string
  value: string
  description?: string
}

export interface ComponentProps {
  [key: string]: any
  content?: string
  richContent?: string
  color?: string
  fontSize?: number
  textAlign?: TextAlignment
  src?: string
  alt?: string
  width?: string
  height?: string
  text?: string
  url?: string
  backgroundColor?: string
  borderRadius?: number
  padding?: number
  thickness?: number
  margin?: number
  columns?: number
  columnGap?: number
  verticalAlign?: FlexAlignment
  horizontalAlign?: FlexAlignment
  stackOnMobile?: boolean
  socialLinks?: SocialLink[]
  socialSize?: number
  socialSpacing?: number
  socialColor?: string
  socialBackgroundColor?: string
  socialShape?: "square" | "circle" | "rounded"
  mergeTags?: MergeTag[]
  unsubscribeText?: string
  unsubscribeUrl?: string
  headerLevel?: 1 | 2 | 3 | 4 | 5 | 6
  position?: "static" | "absolute" | "relative"
  top?: string
  left?: string
  right?: string
  bottom?: string
  zIndex?: number
}

export interface EmailComponent {
  id: string
  type: ComponentType
  props: ComponentProps
  children?: string[]
}

export interface EmailTemplate {
  components: EmailComponent[]
  styles: {
    fontFamily: string
    backgroundColor: string
    width: string
  }
  mergeTags?: MergeTag[]
}
