/**
 * RemixIcon Name Mapping
 *
 * Maps legacy icon names to correct RemixIcon class names (ri-{name}-{style})
 * RemixIcon requires explicit style suffix: -line (outlined) or -fill (solid)
 *
 * Reference: https://remixicon.com/
 * CSS Format: ri-{name}-{style}
 */

export const REMIX_ICON_MAPPING: Record<string, string> = {
  // Navigation & UI
  'home': 'home',
  'menu': 'menu',
  'close': 'close',
  'search': 'search',
  'settings': 'settings',
  'arrow-left': 'arrow-left',
  'arrow-right': 'arrow-right',
  'arrow-up': 'arrow-up',
  'arrow-down': 'arrow-down',
  'chevron-left': 'arrow-left-s',
  'chevron-right': 'arrow-right-s',
  'chevron-up': 'arrow-up-s',
  'chevron-down': 'arrow-down-s',
  'external-link': 'external-link',

  // User & Auth
  'user': 'user',
  'user-plus': 'user-add',
  'user-circle': 'account-circle',
  'login': 'login-box',
  'logout': 'logout-box',
  'door-open': 'door-open',

  // Actions
  'plus': 'add',
  'edit': 'edit',
  'trash': 'delete-bin',
  'delete': 'delete-bin',
  'save': 'save',
  'reload': 'refresh',
  'refresh': 'refresh',
  'download': 'download',
  'upload': 'upload',
  'copy': 'file-copy',
  'check': 'check',

  // Status & Feedback
  'alert': 'alert',
  'alert-triangle': 'error-warning',
  'alarm-warning': 'alarm-warning',
  'error-warning': 'error-warning',
  'info': 'information',
  'information': 'information',
  'notification': 'notification',
  'checkbox-circle': 'checkbox-circle',

  // Media & Content
  'image': 'image',
  'file': 'file',
  'file-text': 'file-text',
  'folder': 'folder',
  'book': 'book',
  'books': 'booklet',
  'music': 'music',
  'play': 'play',
  'pause': 'pause',
  'next': 'skip-forward',
  'prev': 'skip-back',
  'volume': 'volume-up',
  'volume-1': 'volume-down',
  'volume-2': 'volume-up',
  'volume-3': 'volume-up',
  'volume-x': 'volume-mute',
  'heart': 'heart',
  'star': 'star',

  // Cards & Gaming (Tarot specific)
  'card-stack': 'stack',
  'stack': 'stack',
  'spade': 'infinity', // Using infinity for mystical/endless readings concept
  'shuffle': 'shuffle',
  'repeat': 'repeat',

  // Data & Analytics
  'chart-bar': 'bar-chart',
  'bar-chart-3': 'bar-chart',
  'clipboard': 'clipboard',
  'scroll': 'scroll',
  'scroll-text': 'file-list',

  // System & Tools
  'lock': 'lock',
  'eye': 'eye',
  'eye-closed': 'eye-close',
  'loader': 'loader-4', // Default loader
  'loader-3': 'loader-3',
  'loader-4': 'loader-4',
  'loader-5': 'loader-5',
  'zap': 'flashlight',
  'sparkles': 'sparkling',
  'target': 'focus',
  'mask': 'mask',
  'palette': 'palette',
  'android': 'android',

  // Layout & Structure
  'library': 'book-2',
  'list': 'list-check',
  'grid': 'grid',
  'layout': 'layout',
  'dashboard': 'dashboard',

  // Music Player specific
  'maximize-2': 'fullscreen',
  'minimize-2': 'fullscreen-exit',
  'playlist': 'play-list',

  // Social
  'github': 'github',
  'message': 'message-2',

  // Devices
  'device-desktop': 'computer',
  'device-mobile': 'smartphone',
  'device-tablet': 'tablet',

  // Bingo & Gaming
  'dices': 'dice',
}

/**
 * Get RemixIcon class name from legacy icon name
 * Automatically appends default style suffix if not present
 *
 * @param name - Legacy icon name or RemixIcon name
 * @param remixVariant - Style variant ('line' or 'fill'), defaults to 'line'
 * @returns Full RemixIcon class name (e.g., 'ri-home-line')
 */
export function getRemixIconClassName(name: string, remixVariant: 'line' | 'fill' = 'line'): string {
  // If already in correct format (ri-{name}-{style}), return as is
  if (name.startsWith('ri-') && (name.endsWith('-line') || name.endsWith('-fill'))) {
    return name;
  }

  // Remove 'ri-' prefix if present
  const cleanName = name.startsWith('ri-') ? name.slice(3) : name;

  // Remove existing style suffix if present
  const nameWithoutStyle = cleanName.replace(/-(line|fill)$/, '');

  // Map to correct RemixIcon name
  const mappedName = REMIX_ICON_MAPPING[nameWithoutStyle] || nameWithoutStyle;

  // Return with ri- prefix and style suffix
  return `ri-${mappedName}-${remixVariant}`;
}

/**
 * Check if an icon name exists in RemixIcon
 * Note: This is a basic check based on our mapping
 *
 * @param name - Icon name to check
 * @returns true if icon exists in mapping or is a valid RemixIcon name
 */
export function isValidRemixIcon(name: string): boolean {
  const cleanName = name.replace(/^ri-/, '').replace(/-(line|fill)$/, '');
  return cleanName in REMIX_ICON_MAPPING || name.match(/^ri-[\w-]+-(?:line|fill)$/) !== null;
}
