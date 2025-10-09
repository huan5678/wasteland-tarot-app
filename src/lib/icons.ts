/**
 * Icon registry for commonly used Lucide React icons.
 * This provides a centralized location for icon imports and standardized sizing.
 */
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Info,
  Loader2,
  Menu,
  Search,
  Settings,
  User,
  X,
  XCircle,
  Home,
  BookOpen,
  Heart,
  Star,
  Calendar,
  Clock,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Edit,
  Trash2,
  Download,
  Upload,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Share2,
  type LucideIcon,
} from "lucide-react"

/**
 * Icon registry with type-safe icon names
 */
export const icons = {
  // Status icons
  "alert-circle": AlertCircle,
  "alert-triangle": AlertTriangle,
  check: Check,
  "check-circle": CheckCircle,
  info: Info,
  "x-circle": XCircle,

  // Navigation icons
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  "arrow-right": ArrowRight,
  "arrow-left": ArrowLeft,

  // UI icons
  x: X,
  menu: Menu,
  search: Search,
  loader: Loader2,
  settings: Settings,
  user: User,
  plus: Plus,
  minus: Minus,

  // Common icons
  home: Home,
  "book-open": BookOpen,
  heart: Heart,
  star: Star,
  calendar: Calendar,
  clock: Clock,
  mail: Mail,
  phone: Phone,
  "map-pin": MapPin,

  // Action icons
  edit: Edit,
  trash: Trash2,
  download: Download,
  upload: Upload,
  eye: Eye,
  "eye-off": EyeOff,
  copy: Copy,
  "external-link": ExternalLink,
  share: Share2,
} as const

export type IconName = keyof typeof icons

/**
 * Get an icon component by name
 */
export function getIcon(name: IconName): LucideIcon {
  return icons[name]
}

/**
 * Icon size mapping for standardized sizing
 */
export const iconSizes = {
  xs: 16,   // Inline text icons
  sm: 20,   // Button icons, form field icons
  base: 24, // Default size (changed from 'md' to match Tailwind convention)
  md: 24,   // Alias for base
  lg: 32,   // Section headers
  xl: 48,   // Hero icons, empty states
} as const

export type IconSize = keyof typeof iconSizes
