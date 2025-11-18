/**
 * Framer Motion Animation Variants Module
 *
 * @module lib/animations/motionVariants
 * @description 定義可重用的 Framer Motion 動畫 variants，確保全站動畫風格一致性
 * 遵循 Fallout 主題風格（Pip-Boy Green, Radiation Orange）
 *
 * @example
 * ```typescript
 * import { fadeInVariants, breathingGlowVariants } from '@/lib/animations/motionVariants';
 * import { motion } from 'motion/react';
 *
 * // 使用淡入動畫
 * <motion.div
 *   variants={fadeInVariants}
 *   initial="hidden"
 *   animate="visible"
 * >
 *   Content
 * </motion.div>
 *
 * // 使用呼吸發光動畫
 * <motion.button
 *   variants={breathingGlowVariants}
 *   initial="initial"
 *   animate="animate"
 * >
 *   CTA Button
 * </motion.button>
 * ```
 *
 * @remarks
 * - 所有 variants 使用 TypeScript `Variants` 型別確保型別安全
 * - 提供 `reducedMotionTransition` 供無障礙模式使用
 * - 色彩遵循 Fallout 主題：Pip-Boy Green (#00ff88), Radiation Orange (#ff8800)
 *
 * @see {@link https://www.framer.com/motion/animation/#variants|Framer Motion Variants Documentation}
 */

import type { Variants, Transition} from 'motion/react';

/**
 * 淡入動畫 Variant（通用）
 *
 * @constant
 * @type {Variants}
 *
 * @property {object} hidden - 隱藏狀態（opacity: 0）
 * @property {object} visible - 可見狀態（opacity: 1, duration: 0.6s, ease: easeOut）
 *
 * @example
 * ```tsx
 * <motion.div
 *   variants={fadeInVariants}
 *   initial="hidden"
 *   animate="visible"
 * >
 *   Fade in content
 * </motion.div>
 * ```
 */
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

/**
 * 向上滑入動畫 Variant（卡片入場）
 *
 * @constant
 * @type {Variants}
 *
 * @property {object} hidden - 隱藏狀態（opacity: 0, y: 40px）
 * @property {object} visible - 可見狀態（opacity: 1, y: 0, duration: 0.6s, ease: easeOut）
 *
 * @example
 * ```tsx
 * <motion.div
 *   variants={slideUpVariants}
 *   initial="hidden"
 *   animate="visible"
 * >
 *   Card content
 * </motion.div>
 * ```
 */
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

/** 縮放入場動畫（圖示、按鈕） */
export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

/** CTA 呼吸發光動畫（infinite loop） */
export const breathingGlowVariants: Variants = {
  initial: {
    boxShadow: '0 0 10px rgba(0, 255, 136, 0.3), 0 0 20px rgba(0, 255, 136, 0.2)',
  },
  animate: {
    boxShadow: [
      '0 0 10px rgba(0, 255, 136, 0.3), 0 0 20px rgba(0, 255, 136, 0.2)',
      '0 0 20px rgba(0, 255, 136, 0.6), 0 0 40px rgba(0, 255, 136, 0.4)',
      '0 0 10px rgba(0, 255, 136, 0.3), 0 0 20px rgba(0, 255, 136, 0.2)',
    ],
    transition: {
      duration: 2,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

/** Feature Card Hover 動畫 */
export const featureCardHoverVariants: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    boxShadow: '0 0 15px rgba(0, 255, 136, 0.4), 0 0 30px rgba(0, 255, 136, 0.2)',
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

/** Feature Icon Hover 動畫（360° 旋轉 + 顏色變化） */
export const featureIconHoverVariants: Variants = {
  rest: { rotate: 0, color: '#00ff88' },
  hover: {
    rotate: 360,
    color: '#00ff88', // 維持 Pip-Boy Green
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
};

/** FAQ 展開動畫 */
export const faqExpandVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

/** FAQ 箭頭旋轉動畫 */
export const faqArrowVariants: Variants = {
  collapsed: { rotate: 0 },
  expanded: { rotate: 180 },
};

/** 減少動畫模式（prefers-reduced-motion） */
export const reducedMotionTransition: Transition = {
  duration: 0,
};
