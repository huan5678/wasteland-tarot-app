'use client';

/**
 * Icon Showcase Page
 *
 * Phase 6: Visual Polish - 功能展示頁面
 * 展示所有圖示動畫、尺寸預設和顏色變體
 */

import React, { useState } from 'react';
import { PixelIcon } from '@/components/ui/icons';
import type { IconAnimation, IconColorVariant, IconSizePreset } from '@/types/icons';

export default function IconShowcasePage() {
  const [selectedAnimation, setSelectedAnimation] = useState<IconAnimation>('none');
  const [selectedVariant, setSelectedVariant] = useState<IconColorVariant>('default');
  const [selectedSize, setSelectedSize] = useState<IconSizePreset>('md');

  // 動畫類型列表
  const animations: IconAnimation[] = [
    'none', 'pulse', 'spin', 'bounce', 'ping', 'fade', 'wiggle', 'float'
  ];

  // 顏色變體列表
  const variants: IconColorVariant[] = [
    'default', 'primary', 'secondary', 'success', 'warning', 'error', 'info', 'muted'
  ];

  // 尺寸預設列表
  const sizePresets: IconSizePreset[] = [
    'xs', 'sm', 'md', 'lg', 'xl', 'xxl'
  ];

  // 常用圖示範例
  const sampleIcons = [
    'home', 'user', 'heart', 'star', 'bell', 'reload',
    'check', 'close', 'alert', 'info-box', 'loader', 'trophy'
  ];

  return (
    <div className="min-h-screen bg-wasteland-dark p-8 font-cubic">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-pip-boy-green mb-4">
            🎨 PixelIcon Showcase
          </h1>
          <p className="text-pip-boy-green/70 text-lg">
            Phase 6: Visual Polish - 圖示動畫、尺寸預設與顏色變體展示
          </p>
        </header>

        {/* Interactive Demo Section */}
        <section className="mb-16 bg-wasteland-medium border-2 border-pip-boy-green/30 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-pip-boy-green mb-6">
            🎮 互動式展示
          </h2>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Animation Select */}
            <div>
              <label className="block text-pip-boy-green mb-2 text-sm">
                動畫效果 (animation)
              </label>
              <select
                value={selectedAnimation}
                onChange={(e) => setSelectedAnimation(e.target.value as IconAnimation)}
                className="w-full bg-wasteland-dark border border-pip-boy-green/30 text-pip-boy-green p-2 rounded font-cubic"
              >
                {animations.map(anim => (
                  <option key={anim} value={anim}>{anim}</option>
                ))}
              </select>
            </div>

            {/* Variant Select */}
            <div>
              <label className="block text-pip-boy-green mb-2 text-sm">
                顏色變體 (variant)
              </label>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value as IconColorVariant)}
                className="w-full bg-wasteland-dark border border-pip-boy-green/30 text-pip-boy-green p-2 rounded font-cubic"
              >
                {variants.map(variant => (
                  <option key={variant} value={variant}>{variant}</option>
                ))}
              </select>
            </div>

            {/* Size Select */}
            <div>
              <label className="block text-pip-boy-green mb-2 text-sm">
                尺寸預設 (sizePreset)
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value as IconSizePreset)}
                className="w-full bg-wasteland-dark border border-pip-boy-green/30 text-pip-boy-green p-2 rounded font-cubic"
              >
                {sizePresets.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-wasteland-dark border border-pip-boy-green/30 rounded p-8">
            <div className="flex flex-col items-center justify-center min-h-[200px]">
              <PixelIcon
                name="star"
                animation={selectedAnimation}
                variant={selectedVariant}
                sizePreset={selectedSize}
                decorative
              />
              <code className="mt-6 text-pip-boy-green/60 text-sm">
                {`<PixelIcon name="star" animation="${selectedAnimation}" variant="${selectedVariant}" sizePreset="${selectedSize}" />`}
              </code>
            </div>
          </div>
        </section>

        {/* Animation Showcase */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-pip-boy-green mb-6">
            🎬 動畫效果展示
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {animations.map(animation => (
              <div
                key={animation}
                className="bg-wasteland-medium border border-pip-boy-green/30 rounded-lg p-6 flex flex-col items-center justify-center"
              >
                <PixelIcon
                  name="loader"
                  animation={animation}
                  sizePreset="lg"
                  variant="primary"
                  decorative
                />
                <span className="mt-4 text-pip-boy-green text-sm">{animation}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Color Variant Showcase */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-pip-boy-green mb-6">
            🎨 顏色變體展示（高對比度）
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {variants.map(variant => {
              const variantLabels: Record<IconColorVariant, string> = {
                default: 'Default (繼承)',
                primary: 'Primary (綠)',
                secondary: 'Secondary (橙)',
                success: 'Success (亮綠)',
                warning: 'Warning (黃)',
                error: 'Error (紅)',
                info: 'Info (藍)',
                muted: 'Muted (灰)',
              };

              return (
                <div
                  key={variant}
                  className="bg-wasteland-medium border border-pip-boy-green/30 rounded-lg p-6 flex flex-col items-center justify-center"
                >
                  <PixelIcon
                    name="heart"
                    variant={variant}
                    sizePreset="lg"
                    decorative
                  />
                  <span className="mt-4 text-pip-boy-green text-sm text-center">
                    {variantLabels[variant]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Size Preset Showcase */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-pip-boy-green mb-6">
            📏 尺寸預設展示
          </h2>
          <div className="bg-wasteland-medium border border-pip-boy-green/30 rounded-lg p-8">
            <div className="flex items-end justify-center gap-8">
              {sizePresets.map(size => (
                <div key={size} className="flex flex-col items-center gap-4">
                  <PixelIcon
                    name="star"
                    sizePreset={size}
                    variant="primary"
                    decorative
                  />
                  <span className="text-pip-boy-green text-xs">{size}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Case Examples */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-pip-boy-green mb-6">
            💡 實際應用範例
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Loading State */}
            <div className="bg-wasteland-medium border border-pip-boy-green/30 rounded-lg p-6">
              <h3 className="text-pip-boy-green font-bold mb-4">載入狀態</h3>
              <div className="flex items-center gap-4">
                <PixelIcon name="loader" animation="spin" variant="primary" sizePreset="md" decorative />
                <span className="text-pip-boy-green/70">載入中...</span>
              </div>
              <code className="text-pip-boy-green/50 text-xs mt-2 block">
                animation="spin" variant="primary"
              </code>
            </div>

            {/* Success Message */}
            <div className="bg-wasteland-medium border border-pip-boy-green/30 rounded-lg p-6">
              <h3 className="text-pip-boy-green font-bold mb-4">成功訊息</h3>
              <div className="flex items-center gap-4">
                <PixelIcon name="check" variant="success" sizePreset="md" decorative />
                <span className="text-pip-boy-green/70">操作成功！</span>
              </div>
              <code className="text-pip-boy-green/50 text-xs mt-2 block">
                variant="success"
              </code>
            </div>

            {/* Error Warning */}
            <div className="bg-wasteland-medium border border-pip-boy-green/30 rounded-lg p-6">
              <h3 className="text-pip-boy-green font-bold mb-4">錯誤警告</h3>
              <div className="flex items-center gap-4">
                <PixelIcon name="alert" animation="wiggle" variant="error" sizePreset="md" decorative />
                <span className="text-pip-boy-green/70">發生錯誤！</span>
              </div>
              <code className="text-pip-boy-green/50 text-xs mt-2 block">
                animation="wiggle" variant="error"
              </code>
            </div>

            {/* Notification */}
            <div className="bg-wasteland-medium border border-pip-boy-green/30 rounded-lg p-6">
              <h3 className="text-pip-boy-green font-bold mb-4">通知提示</h3>
              <div className="flex items-center gap-4">
                <PixelIcon name="bell" animation="bounce" variant="warning" sizePreset="md" decorative />
                <span className="text-pip-boy-green/70">您有新通知</span>
              </div>
              <code className="text-pip-boy-green/50 text-xs mt-2 block">
                animation="bounce" variant="warning"
              </code>
            </div>
          </div>
        </section>

        {/* Icon Grid */}
        <section>
          <h2 className="text-2xl font-bold text-pip-boy-green mb-6">
            🎯 常用圖示範例
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {sampleIcons.map(icon => (
              <div
                key={icon}
                className="bg-wasteland-medium border border-pip-boy-green/30 rounded-lg p-4 flex flex-col items-center justify-center gap-3 hover:border-pip-boy-green transition-colors"
              >
                <PixelIcon
                  name={icon}
                  sizePreset="lg"
                  variant="primary"
                  decorative
                />
                <span className="text-pip-boy-green/60 text-xs">{icon}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-pip-boy-green/30 text-center">
          <p className="text-pip-boy-green/50 text-sm">
            Phase 6: Visual Polish - PixelIcon Component Enhancement
          </p>
          <p className="text-pip-boy-green/30 text-xs mt-2">
            7 Animations × 8 Variants × 6 Size Presets = 336 Combinations
          </p>
        </footer>
      </div>
    </div>
  );
}
