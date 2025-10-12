'use client'

/**
 * RemixIcon CSS 測試頁面
 * 測試 PixelIcon 元件使用 CSS class name 方式是否正常運作
 */

import { PixelIcon } from '@/components/ui/icons/PixelIcon'

export default function TestIconsPage() {
  return (
    <div className="min-h-screen bg-wasteland-dark p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-pip-boy-green mb-8">
          RemixIcon CSS 測試
        </h1>

        {/* 基本圖示測試 */}
        <section className="mb-12">
          <h2 className="text-xl text-pip-boy-green mb-4">基本圖示 (Line)</h2>
          <div className="flex gap-4 flex-wrap bg-black/50 p-6 border border-pip-boy-green/30">
            <PixelIcon name="home" size={32} className="text-pip-boy-green" />
            <PixelIcon name="user" size={32} className="text-pip-boy-green" />
            <PixelIcon name="settings" size={32} className="text-pip-boy-green" />
            <PixelIcon name="search" size={32} className="text-pip-boy-green" />
            <PixelIcon name="heart" size={32} className="text-pip-boy-green" />
            <PixelIcon name="star" size={32} className="text-pip-boy-green" />
            <PixelIcon name="loader-3" size={32} className="text-pip-boy-green" />
            <PixelIcon name="stack" size={32} className="text-pip-boy-green" />
          </div>
        </section>

        {/* Fill 風格測試 */}
        <section className="mb-12">
          <h2 className="text-xl text-pip-boy-green mb-4">Fill 風格圖示</h2>
          <div className="flex gap-4 flex-wrap bg-black/50 p-6 border border-pip-boy-green/30">
            <PixelIcon name="home" remixVariant="fill" size={32} className="text-pip-boy-green" />
            <PixelIcon name="user" remixVariant="fill" size={32} className="text-pip-boy-green" />
            <PixelIcon name="settings" remixVariant="fill" size={32} className="text-pip-boy-green" />
            <PixelIcon name="search" remixVariant="fill" size={32} className="text-pip-boy-green" />
            <PixelIcon name="heart" remixVariant="fill" size={32} className="text-pip-boy-green" />
            <PixelIcon name="star" remixVariant="fill" size={32} className="text-pip-boy-green" />
          </div>
        </section>

        {/* 尺寸預設測試 */}
        <section className="mb-12">
          <h2 className="text-xl text-pip-boy-green mb-4">尺寸預設 (Phase 6)</h2>
          <div className="flex gap-4 items-center flex-wrap bg-black/50 p-6 border border-pip-boy-green/30">
            <PixelIcon name="home" sizePreset="xs" className="text-pip-boy-green" />
            <PixelIcon name="home" sizePreset="sm" className="text-pip-boy-green" />
            <PixelIcon name="home" sizePreset="md" className="text-pip-boy-green" />
            <PixelIcon name="home" sizePreset="lg" className="text-pip-boy-green" />
            <PixelIcon name="home" sizePreset="xl" className="text-pip-boy-green" />
            <PixelIcon name="home" sizePreset="xxl" className="text-pip-boy-green" />
          </div>
        </section>

        {/* 動畫效果測試 */}
        <section className="mb-12">
          <h2 className="text-xl text-pip-boy-green mb-4">動畫效果 (Phase 6)</h2>
          <div className="flex gap-6 flex-wrap bg-black/50 p-6 border border-pip-boy-green/30">
            <div className="flex flex-col items-center gap-2">
              <PixelIcon name="loader-4" animation="spin" size={32} className="text-pip-boy-green" />
              <span className="text-xs text-pip-boy-green/70">spin</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <PixelIcon name="notification" animation="bounce" size={32} className="text-pip-boy-green" />
              <span className="text-xs text-pip-boy-green/70">bounce</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <PixelIcon name="error-warning" animation="wiggle" size={32} className="text-pip-boy-green" />
              <span className="text-xs text-pip-boy-green/70">wiggle</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <PixelIcon name="heart" animation="pulse" size={32} className="text-pip-boy-green" />
              <span className="text-xs text-pip-boy-green/70">pulse</span>
            </div>
          </div>
        </section>

        {/* 顏色變體測試 */}
        <section className="mb-12">
          <h2 className="text-xl text-pip-boy-green mb-4">顏色變體 (Phase 6)</h2>
          <div className="flex gap-4 flex-wrap bg-black/50 p-6 border border-pip-boy-green/30">
            <div className="flex flex-col items-center gap-2">
              <PixelIcon name="checkbox-circle" variant="success" size={32} />
              <span className="text-xs text-pip-boy-green/70">success</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <PixelIcon name="error-warning" variant="error" size={32} />
              <span className="text-xs text-pip-boy-green/70">error</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <PixelIcon name="alarm-warning" variant="warning" size={32} />
              <span className="text-xs text-pip-boy-green/70">warning</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <PixelIcon name="information" variant="info" size={32} />
              <span className="text-xs text-pip-boy-green/70">info</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <PixelIcon name="home" variant="primary" size={32} />
              <span className="text-xs text-pip-boy-green/70">primary</span>
            </div>
          </div>
        </section>

        {/* 實際使用場景測試 */}
        <section className="mb-12">
          <h2 className="text-xl text-pip-boy-green mb-4">實際使用場景</h2>
          <div className="space-y-4 bg-black/50 p-6 border border-pip-boy-green/30">
            {/* LoadingSpinner 使用的圖示 */}
            <div className="flex items-center gap-4">
              <PixelIcon name="loader-3" animation="spin" size={48} className="text-pip-boy-green" />
              <span className="text-pip-boy-green">LoadingSpinner 圖示 (loader-3-line)</span>
            </div>

            {/* SuitCard 使用的圖示 */}
            <div className="flex items-center gap-4">
              <PixelIcon name="stack" size={20} className="text-pip-boy-green" />
              <span className="text-pip-boy-green">SuitCard 卡牌數量圖示 (stack-line)</span>
            </div>
          </div>
        </section>

        {/* CSS Class Name 說明 */}
        <section className="mb-12">
          <h2 className="text-xl text-pip-boy-green mb-4">RemixIcon CSS Class Name 規則</h2>
          <div className="bg-black/50 p-6 border border-pip-boy-green/30">
            <pre className="text-pip-boy-green/70 text-sm">
{`規則: ri-{name}-{style}

範例:
- <PixelIcon name="home" />           → ri-home-line
- <PixelIcon name="home" remixVariant="fill" />  → ri-home-fill
- <PixelIcon name="loader-3" />       → ri-loader-3-line
- <PixelIcon name="stack" />          → ri-stack-line

優點:
✓ 直接從 remixicon.com 複製圖示名稱
✓ 不需要動態 import React 元件
✓ 更輕量且效能更好
✓ Phase 6 功能完整保留（動畫、variant、sizePreset）`}
            </pre>
          </div>
        </section>
      </div>
    </div>
  )
}
