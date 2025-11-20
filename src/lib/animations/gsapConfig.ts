/**
 * GSAP Animation Configuration Module
 *
 * @module lib/animations/gsapConfig
 * @description 中央化 GSAP 動畫參數配置，確保全站動畫一致性
 *
 * @example
 * ```typescript
 * import { gsapConfig } from '@/lib/animations/gsapConfig';
 *
 * // 使用預設 duration
 * gsap.to('.element', {
 *   opacity: 1,
 *   duration: gsapConfig.durations.normal, // 0.6s
 * });
 *
 * // 使用預設 easing
 * gsap.to('.element', {
 *   x: 100,
 *   ease: gsapConfig.easings.out, // 'power2.out'
 * });
 *
 * // 使用 ScrollTrigger 預設配置
 * ScrollTrigger.create({
 *   trigger: '.section',
 *   start: gsapConfig.scrollTrigger.start, // 'top 80%'
 *   toggleActions: gsapConfig.scrollTrigger.toggleActions,
 * });
 * ```
 *
 * @remarks
 * - 所有時間單位為秒（s）
 * - 使用 `as const` 確保 readonly，防止執行時被修改
 * - 提供完整 TypeScript 型別定義（GSAPConfig）
 * - 支援環境變數覆寫（如 `NEXT_PUBLIC_GSAP_DEBUG=true` 啟用 markers）
 *
 * @see {@link https://gsap.com/docs/v3/|GSAP Documentation}
 */

/**
 * GSAP 動畫配置物件
 *
 * @constant
 * @type {GSAPConfig}
 *
 * @property {object} durations - 預設動畫持續時間（秒）
 * @property {number} durations.fast - 快速動畫（0.2s）- 用於按鈕 hover 等
 * @property {number} durations.normal - 標準動畫（0.6s）- 用於入場、退場
 * @property {number} durations.slow - 慢速動畫（1.0s）- 用於視差、複雜序列
 * @property {object} durations.counter - 數字滾動動畫持續時間
 * @property {number} durations.counter.small - 小數字（< 100）- 1.2s
 * @property {number} durations.counter.medium - 中數字（100-10,000）- 1.5s
 * @property {number} durations.counter.large - 大數字（> 10,000）- 2s
 *
 * @property {object} easings - Easing 函數
 * @property {string} easings.in - 入場動畫（從靜止加速）- 'power2.in'
 * @property {string} easings.out - 退場動畫（減速至靜止）- 'power2.out'
 * @property {string} easings.inOut - 雙向緩動 - 'power2.inOut'
 * @property {string} easings.elastic - 彈性效果（CTA 按鈕）- 'elastic.out(1, 0.5)'
 * @property {string} easings.linear - 平滑線性（視差）- 'none'
 *
 * @property {object} staggers - Stagger 延遲（秒）
 * @property {number} staggers.fast - 快速錯開（mobile）- 0.075s
 * @property {number} staggers.normal - 標準錯開（desktop）- 0.15s
 * @property {number} staggers.slow - 慢速錯開（大量元素）- 0.25s
 *
 * @property {object} scrollTrigger - ScrollTrigger 預設配置
 * @property {string} scrollTrigger.start - 入場觸發位置（元素 top 到達 viewport 2/3 時觸發） - 'top 66.67%'
 * @property {string} scrollTrigger.end - 退場位置（元素 bottom 到達 viewport 1/3 時結束） - 'bottom 33.33%'
 * @property {string} scrollTrigger.toggleActions - 預設 toggleActions - 'play none none none'
 * @property {number} scrollTrigger.scrub - Scrub 平滑度（動畫與 scroll 綁定，1 = 1 秒延遲）
 * @property {boolean} scrollTrigger.markers - 開發模式顯示 markers
 *
 * @property {object} parallax - 視差效果速率
 * @property {number} parallax.backgroundSpeed - 背景層速率（0.5 = 50% 滾動速度）
 * @property {number} parallax.foregroundSpeed - 前景層速率（1.0 = 正常速度）
 *
 * @property {object} breakpoints - 響應式斷點（與 Tailwind 一致）
 * @property {string} breakpoints.mobile - Mobile 斷點 - '(max-width: 767px)'
 * @property {string} breakpoints.tablet - Tablet 斷點 - '(min-width: 768px) and (max-width: 1023px)'
 * @property {string} breakpoints.desktop - Desktop 斷點 - '(min-width: 1024px)'
 *
 * @property {object} performance - 效能最佳化
 * @property {boolean} performance.force3D - 強制 GPU 加速
 * @property {boolean} performance.autoKill - 自動 kill 已完成的 tween
 * @property {number} performance.minFPS - 效能監控閾值（FPS）
 *
 * @property {object} colors - Fallout 主題色彩（供 glow 效果使用）
 * @property {string} colors.pipBoyGreen - Pip-Boy Green - '#00ff88'
 * @property {string} colors.radiationOrange - Radiation Orange - '#ff8800'
 */
export const gsapConfig = {
  /** 預設動畫持續時間 */
  durations: {
    /** 快速動畫（按鈕 hover 等） */
    fast: 0.2,
    /** 標準動畫（入場、退場） */
    normal: 0.6,
    /** 慢速動畫（視差、複雜序列） */
    slow: 1.0,
    /** 數字滾動動畫 */
    counter: {
      small: 1.2,   // < 100
      medium: 1.5,  // 100-10,000
      large: 2.0,   // > 10,000
    },
  },

  /** Easing 函數 */
  easings: {
    /** 入場動畫（從靜止加速） */
    in: 'power2.in',
    /** 退場動畫（減速至靜止） */
    out: 'power2.out',
    /** 雙向緩動 */
    inOut: 'power2.inOut',
    /** 彈性效果（CTA 按鈕） */
    elastic: 'elastic.out(1, 0.5)',
    /** 平滑線性（視差） */
    linear: 'none',
  },

  /** Stagger 延遲 */
  staggers: {
    /** 快速錯開（mobile） */
    fast: 0.075,
    /** 標準錯開（desktop） */
    normal: 0.15,
    /** 慢速錯開（大量元素） */
    slow: 0.25,
  },

  /** ScrollTrigger 預設配置 */
  scrollTrigger: {
    /** 入場觸發位置（元素頂部到達 viewport 2/3 位置時觸發） */
    start: 'top 66.67%',
    /** 退場位置（元素底部離開 viewport 33.33% 位置） */
    end: 'bottom 33.33%',
    /** 預設 toggleActions（僅播放一次） */
    toggleActions: 'play none none none',
    /** Scrub 平滑度（將動畫與 scroll 進度綁定） */
    scrub: 1,
    /** 開發模式顯示 markers */
    markers: false, // Disabled for cleaner UI (set to true for debugging)
  },

  /** Pin（釘住）效果配置 - 用於需要固定在畫面中播放動畫的 sections */
  pin: {
    /** 是否啟用 pin（預設為 false，需手動啟用） */
    enabled: false,
    /** Pin 觸發位置（section 頂部到達 viewport 頂部時釘住）⚠️ 2025 GSAP 最佳實踐 */
    start: 'top top',
    /** Pin 持續時間（滾動 1 倍 section 高度的距離）⚠️ 2025 GSAP 最佳實踐 */
    end: '+=100%',
    /** 為釘住元素創建空間，避免內容重疊（預設 true） */
    pinSpacing: true,
  },

  /** 視差效果速率 */
  parallax: {
    /** 背景層速率（50% 滾動速度） */
    backgroundSpeed: 0.5,
    /** 前景層速率（正常速度） */
    foregroundSpeed: 1.0,
  },

  /** 響應式斷點（與 Tailwind 一致） */
  breakpoints: {
    mobile: '(max-width: 767px)',
    tablet: '(min-width: 768px) and (max-width: 1023px)',
    desktop: '(min-width: 1024px)',
  },

  /** 效能最佳化 */
  performance: {
    /** 強制 GPU 加速 */
    force3D: true,
    /** 自動 kill 已完成的 tween */
    autoKill: true,
    /** 效能監控閾值（FPS） */
    minFPS: 50,
  },

  /** Fallout 主題色彩（供 glow 效果使用） */
  colors: {
    pipBoyGreen: '#00ff88',
    radiationOrange: '#ff8800',
  },
} as const;

/** TypeScript 型別匯出 */
export type GSAPConfig = typeof gsapConfig;
