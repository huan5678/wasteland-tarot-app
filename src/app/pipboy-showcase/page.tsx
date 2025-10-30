'use client'

import React, { useState } from 'react'
import {
  PipBoyButton,
  PipBoyCard,
  PipBoyCardHeader,
  PipBoyCardTitle,
  PipBoyCardDescription,
  PipBoyCardContent,
  PipBoyCardFooter,
  PipBoyDialog,
  PipBoyDialogTrigger,
  PipBoyDialogContent,
  PipBoyDialogHeader,
  PipBoyDialogTitle,
  PipBoyDialogDescription,
  PipBoyDialogFooter,
  PipBoyDialogClose,
  PipBoyLoading,
  PipBoyInput,
  PipBoySelect,
  PipBoySelectTrigger,
  PipBoySelectValue,
  PipBoySelectContent,
  PipBoySelectItem,
  PipBoyLabel,
} from '@/components/ui/pipboy'
import { PixelIcon } from '@/components/ui/icons'

/**
 * PipBoy 元件系統展示頁面
 *
 * 展示所有 PipBoy 元件及其變體、尺寸、狀態
 * 類似於 Storybook 的互動式元件展示
 */
export default function PipBoyShowcasePage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [selectValue, setSelectValue] = useState('')

  return (
    <div className="min-h-screen bg-wasteland-dark p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* 頁面標題 */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-pip-boy-green uppercase tracking-wider">
            <PixelIcon name="flask" size={40} className="inline-block mr-4" decorative />
            PipBoy 元件系統展示
          </h1>
          <p className="text-pip-boy-green/60 text-lg">
            Vault-Tec 認證的終端機風格 UI 元件 - 完整變體與互動展示
          </p>
        </header>

        {/* 快速導航 */}
        <nav className="flex flex-wrap gap-2 justify-center">
          {['按鈕', '卡片', '載入', '對話框', '表單'].map((section) => (
            <a
              key={section}
              href={`#${section}`}
              className="px-4 py-2 border border-pip-boy-green/30 text-pip-boy-green hover:bg-pip-boy-green/10 transition-colors"
            >
              {section}
            </a>
          ))}
        </nav>

        {/* Section 1: PipBoyButton */}
        <section id="按鈕" className="space-y-6">
          <h2 className="text-3xl font-bold text-pip-boy-green uppercase border-b-2 border-pip-boy-green pb-2">
            <PixelIcon name="cursor" size={24} className="inline-block mr-2" decorative />
            PipBoyButton - 按鈕元件
          </h2>

          {/* 變體展示 */}
          <div className="space-y-4">
            <h3 className="text-xl text-pip-boy-green font-semibold">9 個變體 (Variants)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PipBoyCard padding="md">
                <PipBoyCardContent className="space-y-2">
                  <p className="text-pip-boy-green text-sm font-bold">variant="default"</p>
                  <PipBoyButton variant="default">Default Button</PipBoyButton>
                  <code className="text-xs text-pip-boy-green/60 block">實心背景 - 主要操作</code>
                </PipBoyCardContent>
              </PipBoyCard>

              <PipBoyCard padding="md">
                <PipBoyCardContent className="space-y-2">
                  <p className="text-pip-boy-green text-sm font-bold">variant="outline"</p>
                  <PipBoyButton variant="outline">Outline Button</PipBoyButton>
                  <code className="text-xs text-pip-boy-green/60 block">透明背景 - 次要操作</code>
                </PipBoyCardContent>
              </PipBoyCard>

              <PipBoyCard padding="md">
                <PipBoyCardContent className="space-y-2">
                  <p className="text-pip-boy-green text-sm font-bold">variant="destructive"</p>
                  <PipBoyButton variant="destructive">Destructive</PipBoyButton>
                  <code className="text-xs text-pip-boy-green/60 block">深紅色 - 刪除操作</code>
                </PipBoyCardContent>
              </PipBoyCard>

              <PipBoyCard padding="md">
                <PipBoyCardContent className="space-y-2">
                  <p className="text-pip-boy-green text-sm font-bold">variant="secondary"</p>
                  <PipBoyButton variant="secondary">Secondary</PipBoyButton>
                  <code className="text-xs text-pip-boy-green/60 block">輻射橙 - 次要操作</code>
                </PipBoyCardContent>
              </PipBoyCard>

              <PipBoyCard padding="md">
                <PipBoyCardContent className="space-y-2">
                  <p className="text-pip-boy-green text-sm font-bold">variant="ghost"</p>
                  <PipBoyButton variant="ghost">Ghost Button</PipBoyButton>
                  <code className="text-xs text-pip-boy-green/60 block">無邊框 - 輕量操作</code>
                </PipBoyCardContent>
              </PipBoyCard>

              <PipBoyCard padding="md">
                <PipBoyCardContent className="space-y-2">
                  <p className="text-pip-boy-green text-sm font-bold">variant="link"</p>
                  <PipBoyButton variant="link">Link Button</PipBoyButton>
                  <code className="text-xs text-pip-boy-green/60 block">連結樣式 - 導航</code>
                </PipBoyCardContent>
              </PipBoyCard>

              <PipBoyCard padding="md">
                <PipBoyCardContent className="space-y-2">
                  <p className="text-pip-boy-green text-sm font-bold">variant="success"</p>
                  <PipBoyButton variant="success">Success</PipBoyButton>
                  <code className="text-xs text-pip-boy-green/60 block">亮綠色 - 成功狀態</code>
                </PipBoyCardContent>
              </PipBoyCard>

              <PipBoyCard padding="md">
                <PipBoyCardContent className="space-y-2">
                  <p className="text-pip-boy-green text-sm font-bold">variant="warning"</p>
                  <PipBoyButton variant="warning">Warning</PipBoyButton>
                  <code className="text-xs text-pip-boy-green/60 block">警告黃 - 警告操作</code>
                </PipBoyCardContent>
              </PipBoyCard>

              <PipBoyCard padding="md">
                <PipBoyCardContent className="space-y-2">
                  <p className="text-pip-boy-green text-sm font-bold">variant="info"</p>
                  <PipBoyButton variant="info">Info</PipBoyButton>
                  <code className="text-xs text-pip-boy-green/60 block">Vault 藍 - 資訊提示</code>
                </PipBoyCardContent>
              </PipBoyCard>
            </div>
          </div>

          {/* 尺寸展示 */}
          <div className="space-y-4">
            <h3 className="text-xl text-pip-boy-green font-semibold">6 個尺寸 (Sizes)</h3>
            <PipBoyCard padding="lg">
              <PipBoyCardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <PipBoyButton size="xs">XS Button</PipBoyButton>
                  <PipBoyButton size="sm">SM Button</PipBoyButton>
                  <PipBoyButton size="default">Default</PipBoyButton>
                  <PipBoyButton size="lg">LG Button</PipBoyButton>
                  <PipBoyButton size="xl">XL Button</PipBoyButton>
                  <PipBoyButton size="icon">
                    <PixelIcon name="star" decorative />
                  </PipBoyButton>
                </div>
                <code className="text-xs text-pip-boy-green/60 block">
                  xs (28px) → sm (32px) → default (40px) → lg (48px) → xl (56px) → icon (32x32)
                </code>
              </PipBoyCardContent>
            </PipBoyCard>
          </div>

          {/* 狀態展示 */}
          <div className="space-y-4">
            <h3 className="text-xl text-pip-boy-green font-semibold">狀態 (States)</h3>
            <PipBoyCard padding="lg">
              <PipBoyCardContent className="flex flex-wrap gap-4">
                <PipBoyButton>Normal</PipBoyButton>
                <PipBoyButton disabled>Disabled</PipBoyButton>
                <PipBoyButton className="hover:scale-105">
                  With Icon
                  <PixelIcon name="arrow-right" size={16} className="ml-2" decorative />
                </PipBoyButton>
              </PipBoyCardContent>
            </PipBoyCard>
          </div>
        </section>

        {/* Section 2: PipBoyCard */}
        <section id="卡片" className="space-y-6">
          <h2 className="text-3xl font-bold text-pip-boy-green uppercase border-b-2 border-pip-boy-green pb-2">
            <PixelIcon name="layout" size={24} className="inline-block mr-2" decorative />
            PipBoyCard - 卡片元件
          </h2>

          {/* 變體展示 */}
          <div className="space-y-4">
            <h3 className="text-xl text-pip-boy-green font-semibold">4 個變體 (Variants)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PipBoyCard variant="default" padding="md">
                <PipBoyCardHeader>
                  <PipBoyCardTitle>Default Card</PipBoyCardTitle>
                  <PipBoyCardDescription>基礎卡片樣式</PipBoyCardDescription>
                </PipBoyCardHeader>
                <PipBoyCardContent>
                  <p className="text-pip-boy-green/60 text-sm">
                    標準卡片，帶有綠色邊框和半透明背景。適用於大部分內容展示。
                  </p>
                </PipBoyCardContent>
                <PipBoyCardFooter>
                  <PipBoyButton size="sm">Action</PipBoyButton>
                </PipBoyCardFooter>
              </PipBoyCard>

              <PipBoyCard variant="elevated" padding="md">
                <PipBoyCardHeader>
                  <PipBoyCardTitle>Elevated Card</PipBoyCardTitle>
                  <PipBoyCardDescription>懸浮卡片樣式</PipBoyCardDescription>
                </PipBoyCardHeader>
                <PipBoyCardContent>
                  <p className="text-pip-boy-green/60 text-sm">
                    帶有陰影效果的卡片，視覺上更加突出。適用於重要內容。
                  </p>
                </PipBoyCardContent>
              </PipBoyCard>

              <PipBoyCard variant="ghost" padding="md">
                <PipBoyCardHeader>
                  <PipBoyCardTitle>Ghost Card</PipBoyCardTitle>
                  <PipBoyCardDescription>幽靈卡片樣式</PipBoyCardDescription>
                </PipBoyCardHeader>
                <PipBoyCardContent>
                  <p className="text-pip-boy-green/60 text-sm">
                    輕量級卡片，背景更透明。適用於次要內容或嵌套場景。
                  </p>
                </PipBoyCardContent>
              </PipBoyCard>

              <PipBoyCard variant="interactive" padding="md" isClickable onClick={() => alert('Card clicked!')}>
                <PipBoyCardHeader>
                  <PipBoyCardTitle>Interactive Card</PipBoyCardTitle>
                  <PipBoyCardDescription>可點擊卡片</PipBoyCardDescription>
                </PipBoyCardHeader>
                <PipBoyCardContent>
                  <p className="text-pip-boy-green/60 text-sm">
                    可互動卡片，帶有 hover 效果和音效。點擊試試！
                  </p>
                </PipBoyCardContent>
              </PipBoyCard>
            </div>
          </div>

          {/* 特殊效果 */}
          <div className="space-y-4">
            <h3 className="text-xl text-pip-boy-green font-semibold">特殊效果</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PipBoyCard padding="md" glowEffect>
                <PipBoyCardContent className="text-center py-4">
                  <PixelIcon name="flashlight" size={32} className="mx-auto mb-2 text-pip-boy-green" decorative />
                  <p className="text-pip-boy-green font-bold">glowEffect={'{true}'}</p>
                  <p className="text-pip-boy-green/60 text-sm">外發光動畫</p>
                </PipBoyCardContent>
              </PipBoyCard>

              <PipBoyCard padding="md" isLoading>
                <PipBoyCardContent className="text-center py-4">
                  <PixelIcon name="loader" size={32} className="mx-auto mb-2 text-pip-boy-green animate-spin" decorative />
                  <p className="text-pip-boy-green font-bold">isLoading={'{true}'}</p>
                  <p className="text-pip-boy-green/60 text-sm">載入脈衝動畫</p>
                </PipBoyCardContent>
              </PipBoyCard>

              <PipBoyCard padding="md" showCornerIcons>
                <PipBoyCardContent className="text-center py-4">
                  <PixelIcon name="shield" size={32} className="mx-auto mb-2 text-pip-boy-green" decorative />
                  <p className="text-pip-boy-green font-bold">showCornerIcons={'{true}'}</p>
                  <p className="text-pip-boy-green/60 text-sm">Vault-Tec 角落裝飾</p>
                </PipBoyCardContent>
              </PipBoyCard>
            </div>
          </div>
        </section>

        {/* Section 3: PipBoyLoading */}
        <section id="載入" className="space-y-6">
          <h2 className="text-3xl font-bold text-pip-boy-green uppercase border-b-2 border-pip-boy-green pb-2">
            <PixelIcon name="loader" size={24} className="inline-block mr-2" decorative />
            PipBoyLoading - 載入元件
          </h2>

          <div className="space-y-4">
            <h3 className="text-xl text-pip-boy-green font-semibold">4 個變體 (Variants)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PipBoyCard padding="lg">
                <PipBoyCardContent className="space-y-4 text-center">
                  <p className="text-pip-boy-green font-bold">variant="spinner"</p>
                  <PipBoyLoading variant="spinner" size="md" text="載入中..." />
                  <code className="text-xs text-pip-boy-green/60 block">旋轉圖示載入</code>
                </PipBoyCardContent>
              </PipBoyCard>

              <PipBoyCard padding="lg">
                <PipBoyCardContent className="space-y-4 text-center">
                  <p className="text-pip-boy-green font-bold">variant="dots"</p>
                  <PipBoyLoading variant="dots" size="md" text="處理中" />
                  <code className="text-xs text-pip-boy-green/60 block">三點跳動載入</code>
                </PipBoyCardContent>
              </PipBoyCard>

              <PipBoyCard padding="lg">
                <PipBoyCardContent className="space-y-4">
                  <p className="text-pip-boy-green font-bold text-center">variant="skeleton"</p>
                  <PipBoyLoading variant="skeleton" className="h-4 w-full mb-2" />
                  <PipBoyLoading variant="skeleton" className="h-4 w-3/4 mb-2" />
                  <PipBoyLoading variant="skeleton" className="h-4 w-1/2" />
                  <code className="text-xs text-pip-boy-green/60 block text-center">骨架屏載入</code>
                </PipBoyCardContent>
              </PipBoyCard>

              <PipBoyCard padding="lg">
                <PipBoyCardContent className="space-y-4 text-center">
                  <p className="text-pip-boy-green font-bold">variant="overlay"</p>
                  <PipBoyButton onClick={() => {
                    // 模擬 overlay 效果（實際會是全螢幕）
                    alert('variant="overlay" 會顯示全螢幕遮罩')
                  }}>
                    預覽 Overlay
                  </PipBoyButton>
                  <code className="text-xs text-pip-boy-green/60 block">全螢幕遮罩載入</code>
                </PipBoyCardContent>
              </PipBoyCard>
            </div>
          </div>

          {/* 尺寸展示 */}
          <div className="space-y-4">
            <h3 className="text-xl text-pip-boy-green font-semibold">3 個尺寸</h3>
            <PipBoyCard padding="lg">
              <PipBoyCardContent className="flex items-center justify-around">
                <div className="text-center">
                  <PipBoyLoading variant="spinner" size="sm" />
                  <p className="text-pip-boy-green/60 text-xs mt-2">size="sm"</p>
                </div>
                <div className="text-center">
                  <PipBoyLoading variant="spinner" size="md" />
                  <p className="text-pip-boy-green/60 text-xs mt-2">size="md"</p>
                </div>
                <div className="text-center">
                  <PipBoyLoading variant="spinner" size="lg" />
                  <p className="text-pip-boy-green/60 text-xs mt-2">size="lg"</p>
                </div>
              </PipBoyCardContent>
            </PipBoyCard>
          </div>
        </section>

        {/* Section 4: PipBoyDialog */}
        <section id="對話框" className="space-y-6">
          <h2 className="text-3xl font-bold text-pip-boy-green uppercase border-b-2 border-pip-boy-green pb-2">
            <PixelIcon name="window" size={24} className="inline-block mr-2" decorative />
            PipBoyDialog - 對話框元件
          </h2>

          <PipBoyCard padding="lg">
            <PipBoyCardContent className="space-y-4">
              <p className="text-pip-boy-green/60">
                基於 Radix UI Dialog Primitive，提供完整的無障礙支援與鍵盤導航。
              </p>

              <div className="flex flex-wrap gap-4">
                <PipBoyDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <PipBoyDialogTrigger asChild>
                    <PipBoyButton>開啟基礎對話框</PipBoyButton>
                  </PipBoyDialogTrigger>
                  <PipBoyDialogContent>
                    <PipBoyDialogHeader>
                      <PipBoyDialogTitle>Vault-Tec 通知</PipBoyDialogTitle>
                      <PipBoyDialogDescription>
                        這是一個基礎的 PipBoy 對話框範例
                      </PipBoyDialogDescription>
                    </PipBoyDialogHeader>
                    <div className="py-4">
                      <p className="text-pip-boy-green/80 text-sm">
                        對話框支援：
                      </p>
                      <ul className="list-disc list-inside text-pip-boy-green/60 text-sm space-y-1 mt-2">
                        <li>自動焦點管理</li>
                        <li>焦點陷阱（Tab 鍵循環）</li>
                        <li>Escape 鍵關閉</li>
                        <li>點擊背景關閉</li>
                        <li>關閉後焦點恢復</li>
                      </ul>
                    </div>
                    <PipBoyDialogFooter>
                      <PipBoyDialogClose asChild>
                        <PipBoyButton variant="outline">關閉</PipBoyButton>
                      </PipBoyDialogClose>
                      <PipBoyButton onClick={() => setDialogOpen(false)}>確認</PipBoyButton>
                    </PipBoyDialogFooter>
                  </PipBoyDialogContent>
                </PipBoyDialog>

                <PipBoyDialog>
                  <PipBoyDialogTrigger asChild>
                    <PipBoyButton variant="destructive">刪除確認對話框</PipBoyButton>
                  </PipBoyDialogTrigger>
                  <PipBoyDialogContent>
                    <PipBoyDialogHeader>
                      <PipBoyDialogTitle className="text-[#ef4444]">
                        <PixelIcon name="alert-triangle" size={20} className="inline-block mr-2" />
                        確認刪除？
                      </PipBoyDialogTitle>
                      <PipBoyDialogDescription>
                        此操作無法復原。確定要刪除這個項目嗎？
                      </PipBoyDialogDescription>
                    </PipBoyDialogHeader>
                    <PipBoyDialogFooter>
                      <PipBoyDialogClose asChild>
                        <PipBoyButton variant="outline">取消</PipBoyButton>
                      </PipBoyDialogClose>
                      <PipBoyDialogClose asChild>
                        <PipBoyButton variant="destructive">確認刪除</PipBoyButton>
                      </PipBoyDialogClose>
                    </PipBoyDialogFooter>
                  </PipBoyDialogContent>
                </PipBoyDialog>
              </div>

              <code className="text-xs text-pip-boy-green/60 block">
                支援 Radix UI 的所有 Dialog 功能 + Pip-Boy 終端機風格
              </code>
            </PipBoyCardContent>
          </PipBoyCard>
        </section>

        {/* Section 5: 表單元件 */}
        <section id="表單" className="space-y-6">
          <h2 className="text-3xl font-bold text-pip-boy-green uppercase border-b-2 border-pip-boy-green pb-2">
            <PixelIcon name="edit" size={24} className="inline-block mr-2" decorative />
            Form Controls - 表單控制元件
          </h2>

          <PipBoyCard padding="lg">
            <PipBoyCardHeader>
              <PipBoyCardTitle>完整表單範例</PipBoyCardTitle>
              <PipBoyCardDescription>
                展示 PipBoyInput、PipBoySelect、PipBoyLabel 的完整使用
              </PipBoyCardDescription>
            </PipBoyCardHeader>
            <PipBoyCardContent className="space-y-6">
              {/* Input 範例 */}
              <div className="space-y-2">
                <PipBoyLabel htmlFor="username" required>
                  使用者名稱
                </PipBoyLabel>
                <PipBoyInput
                  id="username"
                  type="text"
                  placeholder="輸入使用者名稱"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <p className="text-pip-boy-green/60 text-xs">
                  支援：focus 脈衝效果、錯誤狀態、disabled 狀態
                </p>
              </div>

              {/* Input with Error */}
              <div className="space-y-2">
                <PipBoyLabel htmlFor="email">電子郵件</PipBoyLabel>
                <PipBoyInput
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  error="請輸入有效的電子郵件地址"
                />
              </div>

              {/* Select 範例 */}
              <div className="space-y-2">
                <PipBoyLabel htmlFor="role">角色</PipBoyLabel>
                <PipBoySelect value={selectValue} onValueChange={setSelectValue}>
                  <PipBoySelectTrigger id="role">
                    <PipBoySelectValue placeholder="選擇角色" />
                  </PipBoySelectTrigger>
                  <PipBoySelectContent>
                    <PipBoySelectItem value="overseer">監督者 (Overseer)</PipBoySelectItem>
                    <PipBoySelectItem value="dweller">避難所居民 (Vault Dweller)</PipBoySelectItem>
                    <PipBoySelectItem value="wanderer">廢土流浪者 (Wasteland Wanderer)</PipBoySelectItem>
                    <PipBoySelectItem value="trader">商人 (Trader)</PipBoySelectItem>
                  </PipBoySelectContent>
                </PipBoySelect>
                <p className="text-pip-boy-green/60 text-xs">
                  支援：鍵盤導航、無障礙屬性、終端機風格下拉選單
                </p>
              </div>

              {/* Disabled Input */}
              <div className="space-y-2">
                <PipBoyLabel htmlFor="disabled-input">Disabled Input</PipBoyLabel>
                <PipBoyInput
                  id="disabled-input"
                  type="text"
                  placeholder="This input is disabled"
                  disabled
                />
              </div>
            </PipBoyCardContent>
            <PipBoyCardFooter>
              <PipBoyButton type="submit" size="lg">
                <PixelIcon name="send" size={16} className="mr-2" decorative />
                提交表單
              </PipBoyButton>
            </PipBoyCardFooter>
          </PipBoyCard>
        </section>

        {/* 技術特性總結 */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-pip-boy-green uppercase border-b-2 border-pip-boy-green pb-2">
            <PixelIcon name="shield-check" size={24} className="inline-block mr-2" decorative />
            技術特性總結
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PipBoyCard padding="md">
              <PipBoyCardContent className="space-y-2 text-center">
                <PixelIcon name="code" size={32} className="mx-auto text-pip-boy-green" decorative />
                <h3 className="text-pip-boy-green font-bold">CVA 變體系統</h3>
                <p className="text-pip-boy-green/60 text-sm">
                  使用 class-variance-authority 統一管理樣式變體，提供強類型支援
                </p>
              </PipBoyCardContent>
            </PipBoyCard>

            <PipBoyCard padding="md">
              <PipBoyCardContent className="space-y-2 text-center">
                <PixelIcon name="accessibility" size={32} className="mx-auto text-pip-boy-green" decorative />
                <h3 className="text-pip-boy-green font-bold">Radix UI 無障礙</h3>
                <p className="text-pip-boy-green/60 text-sm">
                  基於 Radix UI Primitives，確保 WCAG AA 標準合規
                </p>
              </PipBoyCardContent>
            </PipBoyCard>

            <PipBoyCard padding="md">
              <PipBoyCardContent className="space-y-2 text-center">
                <PixelIcon name="volume" size={32} className="mx-auto text-pip-boy-green" decorative />
                <h3 className="text-pip-boy-green font-bold">音效整合</h3>
                <p className="text-pip-boy-green/60 text-sm">
                  自動整合 useAudioEffect hook，提供終端機按鈕音效
                </p>
              </PipBoyCardContent>
            </PipBoyCard>

            <PipBoyCard padding="md">
              <PipBoyCardContent className="space-y-2 text-center">
                <PixelIcon name="braces" size={32} className="mx-auto text-pip-boy-green" decorative />
                <h3 className="text-pip-boy-green font-bold">TypeScript 支援</h3>
                <p className="text-pip-boy-green/60 text-sm">
                  完整類型定義與 IDE 自動完成支援
                </p>
              </PipBoyCardContent>
            </PipBoyCard>

            <PipBoyCard padding="md">
              <PipBoyCardContent className="space-y-2 text-center">
                <PixelIcon name="palette" size={32} className="mx-auto text-pip-boy-green" decorative />
                <h3 className="text-pip-boy-green font-bold">Pip-Boy 配色</h3>
                <p className="text-pip-boy-green/60 text-sm">
                  統一的 Pip-Boy Green 配色系統與 CRT 掃描線效果
                </p>
              </PipBoyCardContent>
            </PipBoyCard>

            <PipBoyCard padding="md">
              <PipBoyCardContent className="space-y-2 text-center">
                <PixelIcon name="file-text" size={32} className="mx-auto text-pip-boy-green" decorative />
                <h3 className="text-pip-boy-green font-bold">完整文件</h3>
                <p className="text-pip-boy-green/60 text-sm">
                  1,200+ 行文件包含 API 參考與遷移指南
                </p>
              </PipBoyCardContent>
            </PipBoyCard>
          </div>
        </section>

        {/* 頁尾 */}
        <footer className="text-center space-y-4 py-8 border-t-2 border-pip-boy-green/30">
          <p className="text-pip-boy-green/60">
            <PixelIcon name="radiation" size={16} className="inline-block mx-2" decorative />
            PipBoy UI 元件系統 v1.0
            <PixelIcon name="radiation" size={16} className="inline-block mx-2" decorative />
          </p>
          <p className="text-pip-boy-green/40 text-sm">
            查看完整文件：
            <a href="/docs/pipboy" className="text-pip-boy-green hover:underline ml-2">
              API 文件
            </a>
            {' | '}
            <a href="/docs/migration" className="text-pip-boy-green hover:underline ml-2">
              遷移指南
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
