/**
 * Font Configuration Module
 *
 * Google Font Doto integration for numeric displays
 * Requirements: 1.1, 1.2, 1.3, 1.4
 *
 * Note: Using CDN-based font loading due to Babel compatibility
 */

import { Doto } from 'next/font/google';

/**
 * Doto 字體配置
 * - 點陣風格可變字體，適用於所有數字顯示
 * - 支援像素大小和圓角度調整
 * - 透過 Next.js Font Optimization 自動優化
 */
export const doto = Doto({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-doto',
  display: 'swap',
  preload: true,
  fallback: ['Courier New', 'Monaco', 'monospace'],
});
