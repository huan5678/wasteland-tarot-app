/**
 * Font Configuration Module
 *
 * Google Font Doto integration as primary English font
 * Requirements: 1.1-1.5, 2.5, 9.1-9.5
 *
 * Doto Font Features:
 * - Pixel-art style variable font (6x10 grid)
 * - Full Latin character set (A-Z, a-z, 0-9, punctuation)
 * - Variable axes: ROND (roundness), PIXL (pixel size)
 * - Fallback chain: Doto → Noto Sans TC → monospace → sans-serif
 *
 * Note: Using CDN-based font loading due to Babel compatibility
 */

import { Doto } from 'next/font/google';

/**
 * Doto 字體配置
 *
 * 配置說明：
 * - subsets: ['latin'] - 僅載入 Latin 字符集（英文、數字、符號）
 * - weight: 全部字重（100-900）以支援不同視覺層級
 * - variable: CSS 變數名稱 '--font-doto'
 * - display: 'swap' - 先顯示備用字體，字體載入後切換（避免 FOIT）
 * - preload: true - 建置時預載入以優化首次載入效能
 * - fallback: 多層降級策略（Noto Sans TC 支援中文回退）
 * - adjustFontFallback: 自動調整備用字體度量以減少佈局偏移
 */
export const doto = Doto({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'], // Latin 字符集：A-Z, a-z, 0-9, 標點符號
  variable: '--font-doto',
  display: 'swap', // 先顯示備用字體，避免 FOIT (Flash of Invisible Text)
  preload: true, // 建置時預載入
  fallback: ['Noto Sans TC', 'Courier New', 'Monaco', 'monospace'], // 多層降級
  adjustFontFallback: true, // 自動調整備用字體度量
});

/**
 * 字體變數使用方式：
 *
 * 1. 在 layout.tsx 注入變數：
 *    <html className={doto.variable}>
 *
 * 2. 在 globals.css 使用：
 *    body {
 *      font-family: var(--font-doto), 'Noto Sans TC', sans-serif;
 *    }
 *
 * 3. 在 Tailwind 使用：
 *    @theme {
 *      --font-doto: var(--font-doto), 'Noto Sans TC', sans-serif;
 *    }
 */
