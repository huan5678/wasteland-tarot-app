/**
 * 瀏覽器相容性警告元件
 * 當瀏覽器不支援 WebAuthn 時顯示降級 UI
 */

'use client';

import { PixelIcon } from '@/components/ui/icons';import { Button } from "@/components/ui/button";

export interface BrowserCompatibilityWarningProps {
  /** 警告標題 */
  title: string;
  /** 警告訊息 */
  message: string;
  /** 降級操作回調（例如：使用密碼登入） */
  fallbackAction?: () => void;
  /** 降級操作按鈕文字 */
  fallbackLabel?: string;
  /** 是否顯示升級瀏覽器提示 */
  showUpgradeHint?: boolean;
}

/**
 * 瀏覽器相容性警告元件
 * 使用 Fallout Pip-Boy 風格
 */
export function BrowserCompatibilityWarning({
  title,
  message,
  fallbackAction,
  fallbackLabel = '使用傳統密碼登入',
  showUpgradeHint = true
}: BrowserCompatibilityWarningProps) {
  return (
    <div className="rounded-lg border-2 border-pip-boy-green/30 bg-pip-boy-dark/80 p-6 shadow-[0_0_20px_rgba(0,255,136,0.3)]">
      {/* 警告標題 */}
      <div className="mb-4 flex items-center gap-3">
        <PixelIcon
          name="alert-triangle"
          variant="warning"
          sizePreset="lg"
          animation="pulse"
          decorative />

        <h3 className="text-lg font-bold text-pip-boy-green">{title}</h3>
      </div>

      {/* 警告訊息 */}
      <p className="mb-6 text-sm leading-relaxed text-pip-boy-green/80">
        {message}
      </p>

      {/* 升級瀏覽器提示 */}
      {showUpgradeHint &&
      <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold text-pip-boy-green">
            支援的 Pip-Boy 韌體版本：
          </p>
          <ul className="space-y-1 text-xs text-pip-boy-green/70">
            <li className="flex items-center gap-2">
              <PixelIcon name="check" sizePreset="xs" decorative />
              Chrome / Edge 67+
            </li>
            <li className="flex items-center gap-2">
              <PixelIcon name="check" sizePreset="xs" decorative />
              Firefox 60+
            </li>
            <li className="flex items-center gap-2">
              <PixelIcon name="check" sizePreset="xs" decorative />
              Safari 13+
            </li>
            <li className="flex items-center gap-2">
              <PixelIcon name="check" sizePreset="xs" decorative />
              Opera 54+
            </li>
          </ul>
        </div>
      }

      {/* 降級操作按鈕 */}
      {fallbackAction &&
      <Button size="icon" variant="outline"
      onClick={fallbackAction}
      className="group flex w-full items-center justify-center gap-2 px-4 py-3 font-bold transition-all"
      aria-label={fallbackLabel}>

          <PixelIcon
          name="arrow-right"
          sizePreset="sm"
          className="transition-transform group-hover:translate-x-1"
          decorative />

          {fallbackLabel}
        </Button>
      }

      {/* 廢土風格裝飾 */}
      <div className="mt-6 flex items-center gap-2 border-t border-pip-boy-green/20 pt-4">
        <PixelIcon name="info" sizePreset="xs" variant="muted" decorative />
        <p className="text-xs text-pip-boy-green/50">
          避難科技生物辨識系統需要最新的 Pip-Boy 韌體支援
        </p>
      </div>
    </div>);

}

/**
 * Conditional UI 不支援警告
 * 顯示較輕微的警告訊息
 */
export function ConditionalUIUnsupportedWarning() {
  return (
    <div className="mb-4 rounded-md border border-yellow-500/30 bg-yellow-900/10 p-3">
      <div className="flex items-start gap-3">
        <PixelIcon
          name="alert-circle"
          variant="warning"
          sizePreset="sm"
          decorative />

        <div className="flex-1">
          <p className="text-xs text-yellow-500/90">
            [Pip-Boy 提示] 你的瀏覽器不支援「自動填入」功能。你仍可手動輸入
            email 後使用生物辨識驗證。
          </p>
        </div>
      </div>
    </div>);

}