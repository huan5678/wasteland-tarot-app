/**
 * GSAP Animation Configuration
 * Central configuration for all GSAP animations
 * 所有時間單位為秒（s）
 */

/**
 * GSAP 動畫配置
 * 所有時間單位為秒（s）
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
    /** 入場觸發位置（元素頂部到達 viewport 80% 位置時觸發） */
    start: 'top 80%',
    /** 退場位置（元素底部離開 viewport 20% 位置） */
    end: 'bottom 20%',
    /** 預設 toggleActions（僅播放一次） */
    toggleActions: 'play none none none',
    /** 開發模式顯示 markers */
    markers: typeof process !== 'undefined' && process.env.NODE_ENV === 'development',
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
