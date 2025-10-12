'use client'

import { useState } from 'react'
import { CardBackPixelEffect } from '@/components/cards/CardBackPixelEffect'

export default function TestCardBackPage() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="space-y-8">
        <h1 className="text-pip-boy-green text-2xl text-center">Card Back Pixel Effect Test</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pip-Boy Green Card Back */}
          <div
            className="relative w-64 h-96 bg-black rounded-lg border-2 border-pip-boy-green overflow-hidden cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <img
              src="/assets/cards/card-backs/01.png"
              alt="Wasteland Tarot Card Back"
              className="w-full h-full object-cover"
            />
            <CardBackPixelEffect
              isHovered={isHovered}
              gap={8}
              speed={35}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-pip-boy-green text-center">
                <div className="text-xs">Hover Me!</div>
                <div className="text-xs opacity-60 mt-2">Pip-Boy Green</div>
              </div>
            </div>
          </div>

          {/* Gold Card Back */}
          <div
            className="relative w-64 h-96 bg-gradient-to-br from-purple-900 to-indigo-900 rounded-lg border-2 border-gold-400 overflow-hidden cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <CardBackPixelEffect
              isHovered={isHovered}
              colors="#fbbf24,#f59e0b,#d97706,#b45309"
              gap={8}
              speed={35}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-gold-400 text-center">
                <div className="text-xs">Hover Me!</div>
                <div className="text-xs opacity-60 mt-2">Gold Variant</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-pip-boy-green/60 text-sm text-center max-w-md mx-auto">
          將滑鼠移到卡牌上方，觀看像素粒子動畫效果。這個效果參考自 PixelCard 元件，並整合到塔羅牌卡背上。
        </div>
      </div>
    </div>
  )
}
