'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimation } from '@/components/providers/AnimationProvider';
import { useReducedMotion } from '@/lib/animations/useReducedMotion';

/**
 * CRT Screen Effect
 *
 * 修復說明：
 * - AnimationProvider 現在預設 isCRTOn = true
 * - 不再顯示開機動畫（避免黑屏卡死）
 * - 只在頁面切換時顯示關機/開機效果
 */
export function CRTScreenEffect() {
  // 暫時完全停用 CRT 效果來排除問題
  return null;
}
