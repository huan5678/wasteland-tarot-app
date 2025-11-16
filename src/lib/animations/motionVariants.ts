/**
 * Framer Motion Animation Variants
 * Reusable animation variants for consistent styling
 * 遵循 Fallout 主題風格
 */

import type { Variants, Transition } from 'motion/react';

/**
 * Framer Motion 動畫 Variants
 * 遵循 Fallout 主題風格
 */

/** 淡入動畫（通用） */
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

/** 向上滑入動畫（卡片入場） */
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
