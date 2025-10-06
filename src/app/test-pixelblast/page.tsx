'use client';

import React, { useState } from 'react';
import { PixelBlastBackground } from '@/components/layout/DitherBackground';

export default function TestPixelBlastPage() {
  const [variant, setVariant] = useState<'default' | 'homepage' | 'login' | 'dashboard'>('homepage');
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');

  return (
    <>
      {/* Background */}
      <PixelBlastBackground variant={variant} animationIntensity={intensity} />

      {/* Test UI */}
      <div className="min-h-screen flex flex-col items-center justify-center text-pip-boy-green relative z-10">
        <div className="bg-bg-secondary/90 p-8 border-2 border-pip-boy-green rounded-lg backdrop-blur-sm">
          <h1 className="text-3xl font-bold mb-6 font-mono text-center">
            PixelBlast 背景測試
          </h1>

          {/* Variant Controls */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 font-mono">變體:</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['homepage', 'login', 'dashboard', 'default'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVariant(v)}
                  className={`px-4 py-2 border font-mono text-sm transition-all duration-200 ${
                    variant === v
                      ? 'bg-pip-boy-green text-wasteland-dark border-pip-boy-green'
                      : 'bg-transparent text-pip-boy-green border-pip-boy-green hover:bg-pip-boy-green/20'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Intensity Controls */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 font-mono">動畫強度:</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((i) => (
                <button
                  key={i}
                  onClick={() => setIntensity(i)}
                  className={`px-4 py-2 border font-mono text-sm transition-all duration-200 ${
                    intensity === i
                      ? 'bg-pip-boy-green text-wasteland-dark border-pip-boy-green'
                      : 'bg-transparent text-pip-boy-green border-pip-boy-green hover:bg-pip-boy-green/20'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Color Reference */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3 font-mono">預期顏色:</h3>
            <div className="grid grid-cols-3 gap-4 text-sm font-mono">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 border border-pip-boy-green" style={{ backgroundColor: '#00ff88' }}></div>
                <div>Homepage</div>
                <div className="text-xs text-pip-boy-green/70">#00ff88</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 border border-pip-boy-green" style={{ backgroundColor: '#ff8800' }}></div>
                <div>Login</div>
                <div className="text-xs text-pip-boy-green/70">#ff8800</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 border border-pip-boy-green" style={{ backgroundColor: '#00cc66' }}></div>
                <div>Dashboard</div>
                <div className="text-xs text-pip-boy-green/70">#00cc66</div>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          <div className="text-xs font-mono text-pip-boy-green/60 border-t border-pip-boy-green/30 pt-4">
            <div>當前配置: {variant} / {intensity}</div>
            <div>添加 ?debug=pixelblast 到 URL 來開啟除錯模式</div>
            <div>按 F12 打開開發者工具查看 console 輸出</div>
          </div>
        </div>
      </div>
    </>
  );
}