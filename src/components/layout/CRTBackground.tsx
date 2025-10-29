'use client';

import React from 'react';

interface CRTBackgroundProps {
  className?: string;
}

/**
 * CRT 掃描線與螢幕閃爍背景效果元件
 *
 * 提供復古 CRT 螢幕效果，包含：
 * - 移動的掃描線（scanlines）
 * - 螢幕閃爍（flicker）
 * - 暗色網格紋理
 *
 * 適用於 Fallout Pip-Boy 風格或其他復古終端機介面
 *
 * CSS 樣式定義於 globals.css 的 "CRT 掃描線與螢幕閃爍效果" 區段
 */
export const CRTBackground: React.FC<CRTBackgroundProps> = ({
  className = ''
}) => {
  return (
    <div
      className={`crt-background ${className}`}
      suppressHydrationWarning
    >
      {/* 暗色網格紋理層 (最底層) */}
      <div className="crt-grid-layer" suppressHydrationWarning />

      {/* 螢幕閃爍層 (中間層) */}
      <div className="crt-flicker-layer" suppressHydrationWarning />

      {/* 掃描線層 (最上層) */}
      <div className="crt-scanlines-layer" suppressHydrationWarning />
    </div>
  );
};

export default CRTBackground;
