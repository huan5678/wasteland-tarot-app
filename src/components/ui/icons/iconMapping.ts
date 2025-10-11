/**
 * 圖示映射系統
 *
 * 提供 lucide-react 圖示名稱到 pixelarticons 圖示名稱的映射
 * 以及圖示路徑解析和回退機制
 *
 * @module iconMapping
 */

/**
 * lucide-react 圖示名稱 → pixelarticons 圖示名稱的映射表
 *
 * 用於平滑遷移：支援使用舊的 lucide 名稱，自動映射到對應的 pixel 圖示
 *
 * @example
 * ```ts
 * ICON_MAPPING['x'] // => 'close'
 * ICON_MAPPING['user-circle'] // => 'user'
 * ```
 */
export const ICON_MAPPING: Record<string, string> = {
  // 導航 (Navigation)
  'home': 'home',
  'menu': 'menu',
  'x': 'close',
  'close': 'close',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'chevron-up': 'chevron-up',
  'chevron-down': 'chevron-down',
  'arrow-left': 'arrow-left',
  'arrow-right': 'arrow-right',
  'arrow-up': 'arrow-up',
  'arrow-down': 'arrow-down',
  'arrow-up-left': 'corner-up-left',
  'arrow-up-right': 'corner-up-right',
  'arrow-down-left': 'corner-down-left',
  'arrow-down-right': 'corner-down-right',
  'external-link': 'external-link',
  'link': 'link',  // 連結圖示
  'link-2': 'link',

  // 使用者與認證 (User & Auth)
  'user': 'user',
  'user-circle': 'user',
  'user-plus': 'user-plus',
  'user-minus': 'user-minus',
  'user-x': 'user-x',
  'users': 'users',
  'log-in': 'login',
  'log-out': 'logout',
  'settings': 'settings',

  // 操作 (Actions)
  'search': 'search',
  'plus': 'plus',
  'minus': 'minus',
  'edit': 'edit',
  'edit-2': 'edit-box',
  'edit-3': 'edit-box',
  'pencil': 'edit',
  'trash': 'trash',
  'trash-2': 'trash-alt',
  'delete': 'delete',
  'grip-vertical': 'drag-vertical',
  'download': 'download',
  'upload': 'upload',
  'share': 'share',
  'share-2': 'share',
  'copy': 'copy',
  'clipboard': 'clipboard',
  'cut': 'cut',
  'save': 'save',
  'printer': 'print',
  'refresh-cw': 'reload',
  'refresh-ccw': 'reload',
  'rotate-cw': 'redo',
  'rotate-ccw': 'undo',
  'redo': 'redo',
  'undo': 'undo',
  'filter': 'filter',
  'archive': 'archive',
  'tag': 'label',
  'hash': 'label',  // 使用 label 作為 hash 的替代（標籤概念相同）
  'palette': 'colors-swatch',

  // 狀態與反饋 (Status & Feedback)
  'check': 'check',
  'check-circle': 'checkbox-on',
  'check-square': 'checkbox-on',
  'square': 'checkbox',
  'x-circle': 'close-box',
  'x-square': 'close-box',
  'alert-circle': 'info-box',
  'alert-triangle': 'warning-box',
  'info': 'info-box',
  'help-circle': 'info-box',
  'bell': 'notification',
  'bell-off': 'notification-off',
  'loader': 'loader',
  'loader-2': 'loader',

  // 媒體與檔案 (Media & Files)
  'image': 'image',
  'file': 'file',
  'file-text': 'file-alt',
  'folder': 'folder',
  'folder-plus': 'folder-plus',
  'folder-minus': 'folder-minus',
  'folder-x': 'folder-x',
  'music': 'music',
  'music-2': 'music-note',
  'headphones': 'headphone',
  'play': 'play',
  'play-circle': 'play',
  'pause': 'pause',
  'pause-circle': 'pause',
  'skip-forward': 'next',
  'skip-back': 'prev',
  'repeat': 'repeat',
  'shuffle': 'shuffle',
  'volume': 'volume',
  'volume-1': 'volume-1',
  'volume-2': 'volume-2',
  'volume-x': 'volume-x',
  'camera': 'camera',
  'video': 'video',
  'video-off': 'video-off',
  'film': 'movie',

  // 社群與通訊 (Social & Communication)
  'heart': 'heart',
  'star': 'star',
  'message-circle': 'message',
  'message-square': 'message',
  'mail': 'mail',
  'inbox': 'inbox',
  'send': 'mail-arrow-right',
  'phone': 'deskphone',
  'phone-call': 'deskphone',
  'phone-missed': 'missed-call',
  'github': 'github',
  'twitter': 'external-link',  // 使用 external-link 作為替代
  'discord': 'message',  // 使用 message 作為替代

  // 系統與設定 (System & Settings)
  'sliders': 'sliders',
  'power': 'power',
  'lock': 'lock',
  'unlock': 'lock-open',
  'eye': 'eye',
  'eye-off': 'eye-closed',
  'shield': 'shield',
  'shield-off': 'shield-off',
  'wifi': 'radio-signal',
  'wifi-off': 'radio-signal',
  'bluetooth': 'bluetooth',

  // 文件與組織 (Documents & Organization)
  'book': 'book',
  'book-open': 'book-open',
  'bookmark': 'bookmark',
  'calendar': 'calendar',
  'clock': 'clock',
  'library': 'book',
  'scroll-text': 'article',
  'scroll': 'article',

  // 統計與圖表 (Charts & Analytics)
  'bar-chart': 'chart-bar',
  'bar-chart-2': 'chart-bar',
  'bar-chart-3': 'chart-bar',
  'line-chart': 'chart',

  // 遊戲與娛樂 (Games & Entertainment)
  'dice': 'dice',
  'dices': 'dice',
  'gamepad': 'gamepad-alt',
  'spade': 'card-stack',  // 使用卡牌堆疊圖示作為替代

  // 門戶與入口 (Doors & Portals)
  'door-open': 'logout',
  'door-closed': 'login',

  // 介面元素 (UI Elements)
  'grid': 'grid',
  'list': 'list',
  'table': 'table',
  'layout': 'layout',
  'maximize': 'expand',
  'maximize-2': 'expand',
  'minimize': 'collapse',
  'minimize-2': 'collapse',
  'more-horizontal': 'more-horizontal',
  'more-vertical': 'more-vertical',

  // 商業 (Business)
  'briefcase': 'briefcase',
  'shopping-cart': 'cart',
  'shopping-bag': 'shopping-bag',
  'credit-card': 'credit-card',
  'dollar-sign': 'dollar',
  'euro': 'euro',
  'store': 'store',

  // 其他 (Others)
  'flag': 'flag',
  'gift': 'gift',
  'trophy': 'trophy',
  'award': 'trophy',
  'zap': 'zap',
  'flame': 'zap',  // 使用 zap 作為火焰的替代
  'lightbulb': 'lightbulb',
  'bug': 'bug',
  'code': 'code',
  'code-2': 'code',
  'terminal': 'code',
  'database': 'server',
  'server': 'server',
  'cloud': 'cloud',
  'cloud-download': 'cloud-download',
  'cloud-upload': 'cloud-upload',
  'sun': 'sun',
  'moon': 'moon',
  'star-filled': 'star',
  'layers': 'card-stack',
  'target': 'bullseye',
  'trending-up': 'trending-up',
  'trending-down': 'trending-down',
  'bot': 'android',
  'qr-code': 'grid',  // 使用 grid 作為 QR code 的替代
};

/**
 * 取得圖示的完整路徑
 *
 * 會先檢查映射表，如果找不到則直接使用原始名稱
 *
 * @param name - 圖示名稱（可以是 lucide-react 或 pixelarticons 名稱）
 * @returns 圖示的完整路徑
 *
 * @example
 * ```ts
 * getIconPath('home') // => '/icons/pixelarticons/home.svg'
 * getIconPath('x') // => '/icons/pixelarticons/close.svg'
 * getIconPath('custom-icon') // => '/icons/pixelarticons/custom-icon.svg'
 * ```
 */
export function getIconPath(name: string): string {
  // 檢查是否需要映射
  const iconName = ICON_MAPPING[name] || name;

  // 返回圖示的 public 路徑
  return `/icons/pixelarticons/${iconName}.svg`;
}

/**
 * 取得 fallback 圖示路徑
 *
 * 當指定的圖示不存在時，會使用這個 fallback 圖示
 * 選擇 'help' 圖示作為 fallback，因為它傳達「未知」或「需要幫助」的意義
 *
 * @returns Fallback 圖示的完整路徑
 *
 * @example
 * ```ts
 * getFallbackIcon() // => '/icons/pixelarticons/help.svg'
 * ```
 */
export function getFallbackIcon(): string {
  return '/icons/pixelarticons/info-box.svg';
}

/**
 * 檢查圖示是否存在
 *
 * 使用 HEAD request 檢查圖示檔案是否存在，避免下載整個檔案
 *
 * @param name - 圖示名稱
 * @returns Promise<boolean> - 圖示是否存在
 *
 * @example
 * ```ts
 * const exists = await iconExists('home'); // => true
 * const notExists = await iconExists('nonexistent'); // => false
 * ```
 */
export async function iconExists(name: string): Promise<boolean> {
  try {
    const path = getIconPath(name);
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 批次檢查多個圖示是否存在
 *
 * @param names - 圖示名稱陣列
 * @returns Promise<Record<string, boolean>> - 圖示名稱對應的存在狀態
 *
 * @example
 * ```ts
 * const results = await batchIconExists(['home', 'user', 'nonexistent']);
 * // => { home: true, user: true, nonexistent: false }
 * ```
 */
export async function batchIconExists(names: string[]): Promise<Record<string, boolean>> {
  const results = await Promise.all(
    names.map(async (name) => ({
      name,
      exists: await iconExists(name),
    }))
  );

  return results.reduce((acc, { name, exists }) => {
    acc[name] = exists;
    return acc;
  }, {} as Record<string, boolean>);
}

/**
 * 取得映射表中所有支援的 lucide-react 圖示名稱
 *
 * @returns 支援的圖示名稱陣列
 *
 * @example
 * ```ts
 * const supported = getSupportedLucideIcons();
 * // => ['home', 'user', 'x', 'menu', ...]
 * ```
 */
export function getSupportedLucideIcons(): string[] {
  return Object.keys(ICON_MAPPING);
}

/**
 * 取得映射表中所有對應的 pixelarticons 圖示名稱
 *
 * @returns 對應的圖示名稱陣列（去重後）
 *
 * @example
 * ```ts
 * const pixelIcons = getMappedPixelIcons();
 * // => ['home', 'user', 'close', 'menu', ...]
 * ```
 */
export function getMappedPixelIcons(): string[] {
  return Array.from(new Set(Object.values(ICON_MAPPING)));
}
