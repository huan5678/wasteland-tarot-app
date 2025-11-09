/**
 * 统一的图标映射常量
 *
 * 用于确保全站使用一致的 PixelIcon 图标
 * 避免相同功能使用不同图标造成的混乱
 *
 * @module iconMapping
 * @see src/components/ui/icons/README.md
 */

/**
 * 四大花色图标
 * 塔罗牌核心概念，必须保持一致
 */
export const SUIT_ICONS = {
  /** 權杖 - 火元素 */
  WANDS: 'flashlight',
  /** 聖杯 - 水元素 */
  CUPS: 'heart-3-fill',
  /** 寶劍 - 風元素 */
  SWORDS: 'knife-fill',
  /** 錢幣 - 土元素 */
  PENTACLES: 'copper-coin',
} as const;

/**
 * UI 操作图标
 * 通用 UI 交互动作
 */
export const UI_ICONS = {
  /** 新占卜 / 新增项目 */
  NEW_READING: 'magic',
  /** 删除 */
  DELETE: 'trash',
  /** 关闭 / 取消 */
  CLOSE: 'close',
  /** 重试 / 刷新 */
  RETRY: 'refresh-cw',
  /** 编辑 */
  EDIT: 'edit',
  /** 确认 / 完成 */
  CONFIRM: 'check',
  /** 搜索 */
  SEARCH: 'search',
  /** 筛选 */
  FILTER: 'filter',
} as const;

/**
 * 播放控制图标
 * 音频/视频播放相关
 */
export const PLAYBACK_ICONS = {
  /** 播放 */
  PLAY: 'play',
  /** 暂停 */
  PAUSE: 'pause',
  /** 停止 */
  STOP: 'stop',
  /** 语音播放 */
  VOICE_PLAY: 'volume-up',
  /** 语音停止 / 静音 */
  VOICE_STOP: 'volume-mute',
  /** 上一首 */
  PREVIOUS: 'skip-back',
  /** 下一首 */
  NEXT: 'skip-forward',
} as const;

/**
 * 加载状态图标
 */
export const LOADING_ICONS = {
  /** 一般加载状态 */
  DEFAULT: 'loader',
  /** 音乐/播放清单加载 */
  MUSIC: 'loader-4',
} as const;

/**
 * 卡牌相关图标
 * 塔罗卡牌展示与解读
 */
export const CARD_ICONS = {
  /** 正位含义 */
  UPRIGHT_MEANING: 'arrow-up-s',
  /** 逆位含义 */
  REVERSED_MEANING: 'arrow-down-s',
  /** 卡牌含义 / 解读书籍 */
  MEANING: 'book-open',
  /** 卡牌 */
  CARD: 'spade',
  /** 抽卡 / 卡牌堆 */
  DRAW_CARD: 'card-stack',
  /** 收藏卡牌 */
  BOOKMARK: 'bookmark',
} as const;

/**
 * 功能性图标
 * 特定功能的专用图标
 */
export const FEATURE_ICONS = {
  /** 卡牌图书馆 */
  LIBRARY: 'library',
  /** 深度解读 / AI 分析 */
  INTERPRETATION: 'brain',
  /** 语音朗读 */
  VOICE_READ: 'volume-up',
  /** 成就系统 */
  ACHIEVEMENT: 'trophy',
  /** 设定 */
  SETTINGS: 'settings',
  /** 个人资料 */
  PROFILE: 'user-circle',
  /** 仪表板 / 控制台 */
  DASHBOARD: 'home',
  /** 首页 */
  HOME: 'tent-fill',
} as const;

/**
 * 状态指示图标
 */
export const STATUS_ICONS = {
  /** 成功 */
  SUCCESS: 'check-circle',
  /** 错误 */
  ERROR: 'alert-triangle',
  /** 警告 */
  WARNING: 'alert',
  /** 信息 */
  INFO: 'info',
  /** 已解锁 */
  UNLOCKED: 'unlock',
  /** 已锁定 */
  LOCKED: 'lock',
} as const;

/**
 * 导航图标
 */
export const NAVIGATION_ICONS = {
  /** 返回 */
  BACK: 'arrow-left',
  /** 前进 */
  FORWARD: 'arrow-right',
  /** 上一页 */
  PREVIOUS_PAGE: 'chevron-left',
  /** 下一页 */
  NEXT_PAGE: 'chevron-right',
  /** 展开 */
  EXPAND: 'chevron-up',
  /** 收起 */
  COLLAPSE: 'chevron-down',
} as const;

/**
 * 分享与导出图标
 */
export const SHARE_ICONS = {
  /** 分享 */
  SHARE: 'share-forward',
  /** 导出 / 下载 */
  EXPORT: 'download',
  /** 复制 */
  COPY: 'copy',
  /** 链接 */
  LINK: 'link',
} as const;

/**
 * 合并所有图标映射
 */
export const ICON_MAP = {
  ...SUIT_ICONS,
  ...UI_ICONS,
  ...PLAYBACK_ICONS,
  ...LOADING_ICONS,
  ...CARD_ICONS,
  ...FEATURE_ICONS,
  ...STATUS_ICONS,
  ...NAVIGATION_ICONS,
  ...SHARE_ICONS,
} as const;

export type IconMapKey = keyof typeof ICON_MAP;
export type IconMapValue = (typeof ICON_MAP)[IconMapKey];
