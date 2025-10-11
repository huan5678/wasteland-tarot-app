/**
 * 圖示元資料系統
 *
 * 提供圖示的詳細資訊，包括分類、標籤、描述等
 * 用於圖示預覽頁面和搜尋功能
 *
 * @module iconMetadata
 */

import { IconCategory, type IconMetadata } from '../../../types/icons';

/**
 * 圖示元資料清單
 *
 * 包含所有常用圖示的詳細資訊，用於圖示預覽頁面和搜尋功能
 * 每個圖示包含：名稱、分類、標籤（中英文）、描述
 */
export const ICON_METADATA: IconMetadata[] = [
  // ========== 導航類圖示 (Navigation) ==========
  {
    name: 'home',
    category: IconCategory.NAVIGATION,
    tags: ['home', 'house', '首頁', '主頁', '住家'],
    description: '首頁圖示',
    popular: true,
  },
  {
    name: 'menu',
    category: IconCategory.NAVIGATION,
    tags: ['menu', 'hamburger', '選單', '漢堡選單'],
    description: '選單圖示',
    popular: true,
  },
  {
    name: 'close',
    category: IconCategory.NAVIGATION,
    tags: ['close', 'x', 'cancel', '關閉', '取消'],
    description: '關閉圖示',
    popular: true,
  },
  {
    name: 'chevron-left',
    category: IconCategory.NAVIGATION,
    tags: ['chevron', 'left', 'arrow', '左箭頭', '返回'],
    description: '左箭頭（V字形）',
  },
  {
    name: 'chevron-right',
    category: IconCategory.NAVIGATION,
    tags: ['chevron', 'right', 'arrow', '右箭頭', '前進'],
    description: '右箭頭（V字形）',
  },
  {
    name: 'chevron-up',
    category: IconCategory.NAVIGATION,
    tags: ['chevron', 'up', 'arrow', '上箭頭', '向上'],
    description: '上箭頭（V字形）',
  },
  {
    name: 'chevron-down',
    category: IconCategory.NAVIGATION,
    tags: ['chevron', 'down', 'arrow', '下箭頭', '向下'],
    description: '下箭頭（V字形）',
  },
  {
    name: 'arrow-left',
    category: IconCategory.NAVIGATION,
    tags: ['arrow', 'left', 'back', '箭頭', '返回'],
    description: '左箭頭',
  },
  {
    name: 'arrow-right',
    category: IconCategory.NAVIGATION,
    tags: ['arrow', 'right', 'forward', '箭頭', '前進'],
    description: '右箭頭',
  },
  {
    name: 'external-link',
    category: IconCategory.NAVIGATION,
    tags: ['external', 'link', 'open', '外部連結', '開啟'],
    description: '外部連結圖示',
  },

  // ========== 使用者相關 (User) ==========
  {
    name: 'user',
    category: IconCategory.USER,
    tags: ['user', 'account', 'profile', '使用者', '帳號', '個人資料'],
    description: '使用者圖示',
    popular: true,
  },
  {
    name: 'users',
    category: IconCategory.USER,
    tags: ['users', 'group', 'team', '使用者群', '團隊', '群組'],
    description: '多位使用者圖示',
  },
  {
    name: 'user-plus',
    category: IconCategory.USER,
    tags: ['user', 'add', 'new', '新增使用者', '加入'],
    description: '新增使用者圖示',
  },
  {
    name: 'user-minus',
    category: IconCategory.USER,
    tags: ['user', 'remove', 'delete', '移除使用者', '刪除'],
    description: '移除使用者圖示',
  },
  {
    name: 'user-x',
    category: IconCategory.USER,
    tags: ['user', 'block', 'ban', '封鎖使用者', '禁止'],
    description: '封鎖使用者圖示',
  },
  {
    name: 'avatar',
    category: IconCategory.USER,
    tags: ['avatar', 'profile', 'picture', '頭像', '大頭照'],
    description: '頭像圖示',
  },
  {
    name: 'login',
    category: IconCategory.USER,
    tags: ['login', 'sign in', 'enter', '登入', '進入'],
    description: '登入圖示',
  },
  {
    name: 'logout',
    category: IconCategory.USER,
    tags: ['logout', 'sign out', 'exit', '登出', '離開'],
    description: '登出圖示',
  },

  // ========== 操作類圖示 (Actions) ==========
  {
    name: 'search',
    category: IconCategory.ACTIONS,
    tags: ['search', 'find', 'magnify', '搜尋', '查找', '放大鏡'],
    description: '搜尋圖示',
    popular: true,
  },
  {
    name: 'plus',
    category: IconCategory.ACTIONS,
    tags: ['plus', 'add', 'new', '加號', '新增', '添加'],
    description: '加號圖示',
    popular: true,
  },
  {
    name: 'minus',
    category: IconCategory.ACTIONS,
    tags: ['minus', 'subtract', 'remove', '減號', '移除', '減少'],
    description: '減號圖示',
  },
  {
    name: 'edit',
    category: IconCategory.ACTIONS,
    tags: ['edit', 'pencil', 'write', '編輯', '修改', '鉛筆'],
    description: '編輯圖示',
    popular: true,
  },
  {
    name: 'trash',
    category: IconCategory.ACTIONS,
    tags: ['trash', 'delete', 'remove', '垃圾桶', '刪除', '移除'],
    description: '刪除圖示',
    popular: true,
  },
  {
    name: 'download',
    category: IconCategory.ACTIONS,
    tags: ['download', 'save', 'export', '下載', '儲存', '匯出'],
    description: '下載圖示',
  },
  {
    name: 'upload',
    category: IconCategory.ACTIONS,
    tags: ['upload', 'import', 'attach', '上傳', '匯入', '附加'],
    description: '上傳圖示',
  },
  {
    name: 'share',
    category: IconCategory.ACTIONS,
    tags: ['share', 'export', 'send', '分享', '傳送', '匯出'],
    description: '分享圖示',
  },
  {
    name: 'copy',
    category: IconCategory.ACTIONS,
    tags: ['copy', 'duplicate', 'clone', '複製', '拷貝'],
    description: '複製圖示',
  },
  {
    name: 'save',
    category: IconCategory.ACTIONS,
    tags: ['save', 'disk', 'store', '儲存', '保存'],
    description: '儲存圖示',
  },
  {
    name: 'print',
    category: IconCategory.ACTIONS,
    tags: ['print', 'printer', 'document', '列印', '印表機'],
    description: '列印圖示',
  },
  {
    name: 'reload',
    category: IconCategory.ACTIONS,
    tags: ['reload', 'refresh', 'sync', '重新載入', '刷新', '同步'],
    description: '重新載入圖示',
  },
  {
    name: 'undo',
    category: IconCategory.ACTIONS,
    tags: ['undo', 'revert', 'back', '復原', '撤銷'],
    description: '復原圖示',
  },
  {
    name: 'redo',
    category: IconCategory.ACTIONS,
    tags: ['redo', 'forward', 'repeat', '重做', '重複'],
    description: '重做圖示',
  },

  // ========== 狀態與反饋 (Status & Feedback) ==========
  {
    name: 'check',
    category: IconCategory.STATUS,
    tags: ['check', 'tick', 'done', 'success', '勾選', '完成', '成功'],
    description: '勾選圖示',
    popular: true,
  },
  {
    name: 'checkbox-on',
    category: IconCategory.STATUS,
    tags: ['checkbox', 'checked', 'selected', '核取方塊', '已選', '勾選'],
    description: '已勾選的核取方塊',
  },
  {
    name: 'checkbox',
    category: IconCategory.STATUS,
    tags: ['checkbox', 'unchecked', 'unselected', '核取方塊', '未選'],
    description: '未勾選的核取方塊',
  },
  {
    name: 'close-box',
    category: IconCategory.STATUS,
    tags: ['error', 'wrong', 'incorrect', '錯誤', '失敗'],
    description: '錯誤圖示（方框內的X）',
  },
  {
    name: 'info-box',
    category: IconCategory.STATUS,
    tags: ['info', 'information', 'help', '資訊', '說明', '幫助'],
    description: '資訊圖示',
  },
  {
    name: 'alert',
    category: IconCategory.STATUS,
    tags: ['alert', 'warning', 'attention', '警告', '注意'],
    description: '警告圖示',
  },
  {
    name: 'warning-box',
    category: IconCategory.STATUS,
    tags: ['warning', 'caution', 'danger', '警告', '危險', '注意'],
    description: '警告方框圖示',
  },
  {
    name: 'notification',
    category: IconCategory.STATUS,
    tags: ['notification', 'bell', 'alert', '通知', '鈴鐺', '提醒'],
    description: '通知圖示',
  },
  {
    name: 'loader',
    category: IconCategory.STATUS,
    tags: ['loader', 'loading', 'spinner', 'wait', '載入中', '等待'],
    description: '載入中圖示',
  },

  // ========== 媒體類圖示 (Media) ==========
  {
    name: 'image',
    category: IconCategory.MEDIA,
    tags: ['image', 'picture', 'photo', '圖片', '照片', '圖像'],
    description: '圖片圖示',
  },
  {
    name: 'file',
    category: IconCategory.MEDIA,
    tags: ['file', 'document', 'paper', '檔案', '文件'],
    description: '檔案圖示',
  },
  {
    name: 'folder',
    category: IconCategory.MEDIA,
    tags: ['folder', 'directory', 'files', '資料夾', '目錄'],
    description: '資料夾圖示',
    popular: true,
  },
  {
    name: 'music',
    category: IconCategory.MEDIA,
    tags: ['music', 'audio', 'sound', 'note', '音樂', '音訊', '音符'],
    description: '音樂圖示',
  },
  {
    name: 'play',
    category: IconCategory.MEDIA,
    tags: ['play', 'start', 'video', '播放', '開始'],
    description: '播放圖示',
    popular: true,
  },
  {
    name: 'pause',
    category: IconCategory.MEDIA,
    tags: ['pause', 'stop', 'wait', '暫停', '停止'],
    description: '暫停圖示',
  },
  {
    name: 'next',
    category: IconCategory.MEDIA,
    tags: ['next', 'forward', 'skip', '下一個', '前進', '跳過'],
    description: '下一個圖示',
  },
  {
    name: 'prev',
    category: IconCategory.MEDIA,
    tags: ['previous', 'back', 'skip', '上一個', '返回', '跳過'],
    description: '上一個圖示',
  },
  {
    name: 'volume',
    category: IconCategory.MEDIA,
    tags: ['volume', 'sound', 'audio', 'speaker', '音量', '聲音', '喇叭'],
    description: '音量圖示',
  },
  {
    name: 'volume-x',
    category: IconCategory.MEDIA,
    tags: ['mute', 'silent', 'quiet', '靜音', '無聲'],
    description: '靜音圖示',
  },
  {
    name: 'camera',
    category: IconCategory.MEDIA,
    tags: ['camera', 'photo', 'picture', '相機', '照相', '拍照'],
    description: '相機圖示',
  },
  {
    name: 'video',
    category: IconCategory.MEDIA,
    tags: ['video', 'camera', 'film', 'movie', '影片', '錄影', '攝影機'],
    description: '影片圖示',
  },

  // ========== 社群與通訊 (Social & Communication) ==========
  {
    name: 'heart',
    category: IconCategory.SOCIAL,
    tags: ['heart', 'like', 'favorite', 'love', '愛心', '喜歡', '最愛'],
    description: '愛心圖示',
    popular: true,
  },
  {
    name: 'star',
    category: IconCategory.SOCIAL,
    tags: ['star', 'favorite', 'rating', '星星', '評分', '收藏'],
    description: '星星圖示',
    popular: true,
  },
  {
    name: 'message',
    category: IconCategory.SOCIAL,
    tags: ['message', 'chat', 'comment', 'talk', '訊息', '聊天', '對話'],
    description: '訊息圖示',
  },
  {
    name: 'mail',
    category: IconCategory.SOCIAL,
    tags: ['mail', 'email', 'message', 'letter', '郵件', '信件', '電子郵件'],
    description: '郵件圖示',
  },
  {
    name: 'chat',
    category: IconCategory.SOCIAL,
    tags: ['chat', 'conversation', 'talk', 'bubble', '聊天', '對話', '對話框'],
    description: '聊天圖示',
  },
  {
    name: 'comment',
    category: IconCategory.SOCIAL,
    tags: ['comment', 'remark', 'note', 'feedback', '評論', '留言', '備註'],
    description: '評論圖示',
  },

  // ========== 系統與設定 (System & Settings) ==========
  {
    name: 'settings',
    category: IconCategory.SYSTEM,
    tags: ['settings', 'config', 'gear', 'options', '設定', '配置', '選項'],
    description: '設定圖示',
    popular: true,
  },
  {
    name: 'sliders',
    category: IconCategory.SYSTEM,
    tags: ['sliders', 'adjust', 'control', 'settings', '滑桿', '調整', '控制'],
    description: '滑桿圖示',
  },
  {
    name: 'power',
    category: IconCategory.SYSTEM,
    tags: ['power', 'on', 'off', 'shutdown', '電源', '開關', '關機'],
    description: '電源圖示',
  },
  {
    name: 'lock',
    category: IconCategory.SYSTEM,
    tags: ['lock', 'secure', 'private', 'locked', '鎖定', '安全', '私密'],
    description: '鎖定圖示',
  },
  {
    name: 'lock-open',
    category: IconCategory.SYSTEM,
    tags: ['unlock', 'open', 'unlocked', '解鎖', '開啟'],
    description: '解鎖圖示',
  },
  {
    name: 'eye',
    category: IconCategory.SYSTEM,
    tags: ['eye', 'view', 'visible', 'show', '眼睛', '檢視', '顯示'],
    description: '可見圖示',
  },
  {
    name: 'eye-closed',
    category: IconCategory.SYSTEM,
    tags: ['hide', 'hidden', 'invisible', '隱藏', '不可見'],
    description: '隱藏圖示',
  },
  {
    name: 'shield',
    category: IconCategory.SYSTEM,
    tags: ['shield', 'protection', 'security', 'safe', '盾牌', '保護', '安全'],
    description: '防護圖示',
  },

  // ========== 文件與組織 (Documents & Organization) ==========
  {
    name: 'book',
    category: IconCategory.DOCUMENTS,
    tags: ['book', 'read', 'library', 'manual', '書本', '閱讀', '圖書館'],
    description: '書本圖示',
  },
  {
    name: 'bookmark',
    category: IconCategory.DOCUMENTS,
    tags: ['bookmark', 'save', 'favorite', 'mark', '書籤', '儲存', '標記'],
    description: '書籤圖示',
  },
  {
    name: 'calendar',
    category: IconCategory.DOCUMENTS,
    tags: ['calendar', 'date', 'schedule', 'event', '日曆', '日期', '行程'],
    description: '日曆圖示',
  },
  {
    name: 'clock',
    category: IconCategory.DOCUMENTS,
    tags: ['clock', 'time', 'watch', 'hour', '時鐘', '時間', '鐘錶'],
    description: '時鐘圖示',
  },

  // ========== 介面元素 (UI Elements) ==========
  {
    name: 'grid',
    category: IconCategory.UI_ELEMENTS,
    tags: ['grid', 'layout', 'view', 'tiles', '網格', '佈局', '檢視'],
    description: '網格檢視圖示',
  },
  {
    name: 'list',
    category: IconCategory.UI_ELEMENTS,
    tags: ['list', 'menu', 'items', 'lines', '清單', '列表', '選單'],
    description: '清單檢視圖示',
  },
  {
    name: 'table',
    category: IconCategory.UI_ELEMENTS,
    tags: ['table', 'grid', 'data', 'spreadsheet', '表格', '數據', '試算表'],
    description: '表格圖示',
  },
  {
    name: 'dashboard',
    category: IconCategory.UI_ELEMENTS,
    tags: ['dashboard', 'panel', 'control', 'overview', '儀表板', '控制面板', '總覽'],
    description: '儀表板圖示',
  },
  {
    name: 'expand',
    category: IconCategory.UI_ELEMENTS,
    tags: ['expand', 'maximize', 'fullscreen', 'enlarge', '展開', '最大化', '全螢幕'],
    description: '展開圖示',
  },
  {
    name: 'collapse',
    category: IconCategory.UI_ELEMENTS,
    tags: ['collapse', 'minimize', 'shrink', 'reduce', '收合', '最小化', '縮小'],
    description: '收合圖示',
  },
  {
    name: 'more-horizontal',
    category: IconCategory.UI_ELEMENTS,
    tags: ['more', 'menu', 'options', 'dots', '更多', '選單', '選項', '三點'],
    description: '更多選項（水平）',
  },
  {
    name: 'more-vertical',
    category: IconCategory.UI_ELEMENTS,
    tags: ['more', 'menu', 'options', 'dots', '更多', '選單', '選項', '三點'],
    description: '更多選項（垂直）',
  },

  // ========== 商業類圖示 (Business) ==========
  {
    name: 'briefcase',
    category: IconCategory.BUSINESS,
    tags: ['briefcase', 'work', 'business', 'job', '公事包', '工作', '商務'],
    description: '公事包圖示',
  },
  {
    name: 'cart',
    category: IconCategory.BUSINESS,
    tags: ['cart', 'shopping', 'buy', 'purchase', '購物車', '購買'],
    description: '購物車圖示',
  },
  {
    name: 'credit-card',
    category: IconCategory.BUSINESS,
    tags: ['card', 'payment', 'money', 'credit', '信用卡', '付款', '金錢'],
    description: '信用卡圖示',
  },
  {
    name: 'dollar',
    category: IconCategory.BUSINESS,
    tags: ['dollar', 'money', 'currency', 'price', '美元', '金錢', '貨幣', '價格'],
    description: '美元圖示',
  },
  {
    name: 'store',
    category: IconCategory.BUSINESS,
    tags: ['store', 'shop', 'market', 'retail', '商店', '賣場', '零售'],
    description: '商店圖示',
  },

  // ========== 其他常用圖示 (Others) ==========
  {
    name: 'flag',
    category: IconCategory.OTHER,
    tags: ['flag', 'mark', 'report', 'bookmark', '旗幟', '標記', '報告'],
    description: '旗幟圖示',
  },
  {
    name: 'gift',
    category: IconCategory.OTHER,
    tags: ['gift', 'present', 'reward', 'prize', '禮物', '獎勵', '獎品'],
    description: '禮物圖示',
  },
  {
    name: 'trophy',
    category: IconCategory.OTHER,
    tags: ['trophy', 'award', 'win', 'achievement', '獎盃', '獎項', '成就'],
    description: '獎盃圖示',
  },
  {
    name: 'lightbulb',
    category: IconCategory.OTHER,
    tags: ['idea', 'innovation', 'creative', 'think', '燈泡', '想法', '創意', '思考'],
    description: '燈泡圖示',
  },
  {
    name: 'bug',
    category: IconCategory.OTHER,
    tags: ['bug', 'error', 'debug', 'issue', '錯誤', '除錯', '問題'],
    description: '錯誤（bug）圖示',
  },
  {
    name: 'code',
    category: IconCategory.OTHER,
    tags: ['code', 'programming', 'developer', 'script', '程式碼', '編程', '開發'],
    description: '程式碼圖示',
  },
  {
    name: 'server',
    category: IconCategory.OTHER,
    tags: ['server', 'database', 'backend', 'storage', '伺服器', '資料庫', '後端', '儲存'],
    description: '伺服器圖示',
  },
  {
    name: 'cloud',
    category: IconCategory.OTHER,
    tags: ['cloud', 'storage', 'online', 'sync', '雲端', '儲存', '線上', '同步'],
    description: '雲端圖示',
  },
  {
    name: 'sun',
    category: IconCategory.OTHER,
    tags: ['sun', 'light', 'day', 'bright', '太陽', '光線', '白天', '明亮'],
    description: '太陽圖示',
  },
  {
    name: 'moon',
    category: IconCategory.OTHER,
    tags: ['moon', 'night', 'dark', 'sleep', '月亮', '夜晚', '黑暗', '睡眠'],
    description: '月亮圖示',
  },
];

/**
 * 根據分類過濾圖示
 *
 * @param category - 圖示分類
 * @returns 符合指定分類的圖示陣列
 *
 * @example
 * ```ts
 * const navIcons = getIconsByCategory(IconCategory.NAVIGATION);
 * // => [{ name: 'home', ... }, { name: 'menu', ... }, ...]
 * ```
 */
export function getIconsByCategory(category: IconCategory): IconMetadata[] {
  return ICON_METADATA.filter((icon) => icon.category === category);
}

/**
 * 搜尋圖示
 *
 * 支援在圖示名稱、標籤、描述中搜尋（不區分大小寫）
 *
 * @param query - 搜尋關鍵字
 * @returns 符合搜尋條件的圖示陣列
 *
 * @example
 * ```ts
 * const results = searchIcons('home');
 * // => [{ name: 'home', ... }]
 *
 * const results2 = searchIcons('首頁');
 * // => [{ name: 'home', ... }]
 * ```
 */
export function searchIcons(query: string): IconMetadata[] {
  if (!query || query.trim() === '') {
    return ICON_METADATA;
  }

  const lowerQuery = query.toLowerCase();

  return ICON_METADATA.filter(
    (icon) =>
      icon.name.toLowerCase().includes(lowerQuery) ||
      icon.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      icon.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 取得所有常用圖示
 *
 * @returns 標記為常用的圖示陣列
 *
 * @example
 * ```ts
 * const popularIcons = getPopularIcons();
 * // => [{ name: 'home', ... }, { name: 'user', ... }, ...]
 * ```
 */
export function getPopularIcons(): IconMetadata[] {
  return ICON_METADATA.filter((icon) => icon.popular === true);
}

/**
 * 根據名稱取得圖示元資料
 *
 * @param name - 圖示名稱
 * @returns 圖示元資料，如果找不到則返回 undefined
 *
 * @example
 * ```ts
 * const homeIcon = getIconMetadata('home');
 * // => { name: 'home', category: IconCategory.NAVIGATION, ... }
 * ```
 */
export function getIconMetadata(name: string): IconMetadata | undefined {
  return ICON_METADATA.find((icon) => icon.name === name);
}

/**
 * 取得所有圖示分類
 *
 * @returns 所有使用中的分類陣列（去重）
 *
 * @example
 * ```ts
 * const categories = getAllCategories();
 * // => [IconCategory.NAVIGATION, IconCategory.USER, ...]
 * ```
 */
export function getAllCategories(): IconCategory[] {
  const categories = new Set(ICON_METADATA.map((icon) => icon.category));
  return Array.from(categories);
}

/**
 * 取得圖示總數
 *
 * @returns 圖示元資料中的總圖示數量
 *
 * @example
 * ```ts
 * const total = getIconCount();
 * // => 85
 * ```
 */
export function getIconCount(): number {
  return ICON_METADATA.length;
}

/**
 * 取得每個分類的圖示數量
 *
 * @returns 分類對應圖示數量的物件
 *
 * @example
 * ```ts
 * const counts = getIconCountByCategory();
 * // => { navigation: 10, user: 8, actions: 14, ... }
 * ```
 */
export function getIconCountByCategory(): Record<IconCategory, number> {
  const counts: Record<string, number> = {};

  for (const category of Object.values(IconCategory)) {
    counts[category as string] = getIconsByCategory(category as IconCategory).length;
  }

  return counts as Record<IconCategory, number>;
}
