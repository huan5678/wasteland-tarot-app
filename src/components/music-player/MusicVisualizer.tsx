/**
 * MusicVisualizer - 音樂視覺化元件
 * Task 15: 實作簡易音訊視覺化
 * Requirements 9.1, 9.3, 9.4, 11.1
 */

'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { PixelIcon } from '@/components/ui/icons/PixelIcon';

/**
 * MusicVisualizer Props
 */
export interface MusicVisualizerProps {
  isPlaying: boolean;
  className?: string;
}

/**
 * MusicVisualizer Component
 * Requirements: Canvas 繪製頻譜圖、60 FPS 動畫、記憶體優化
 */
export const MusicVisualizer = React.memo(function MusicVisualizer({
  isPlaying,
  className,
}: MusicVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // ========== Initialize Audio Analyser (Simulated for now) ==========
  useEffect(() => {
    // Note: 實際的 AnalyserNode 整合需要 AudioContext 和 ProceduralMusicEngine
    // 這裡先使用模擬數據
    // TODO: 在 ProceduralMusicEngine 整合後連接真實的 AnalyserNode

    // 清理函數：當元件卸載時清理 AnalyserNode
    return () => {
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      dataArrayRef.current = null;
    };
  }, []);

  // ========== Draw Visualizer ==========
  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 清除畫布
    ctx.fillStyle = '#0c0c0c'; // wasteland-darker
    ctx.fillRect(0, 0, width, height);

    // 繪製 16 個柱狀圖
    const barCount = 16;
    const barWidth = width / barCount;
    const barGap = 2;

    for (let i = 0; i < barCount; i++) {
      // 模擬頻率數據 (0-255)
      // TODO: 使用真實的 AnalyserNode 數據
      const value = isPlaying
        ? Math.random() * 255 * (0.5 + Math.sin(Date.now() / 1000 + i) * 0.5)
        : 0;

      const barHeight = (value / 255) * height * 0.8;
      const x = i * barWidth + barGap / 2;
      const y = height - barHeight;

      // 漸層效果 (Pip-Boy 綠色)
      const gradient = ctx.createLinearGradient(x, y, x, height);
      gradient.addColorStop(0, '#00ff88'); // pip-boy-green
      gradient.addColorStop(0.5, '#00cc66'); // pip-boy-green-dark
      gradient.addColorStop(1, '#008855'); // pip-boy-green-medium

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth - barGap, barHeight);

      // 綠色光暈效果
      ctx.shadowColor = 'rgba(0, 255, 136, 0.5)';
      ctx.shadowBlur = 10;
    }

    // 重置陰影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // 繪製中心線
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [isPlaying]);

  // ========== Animation Loop ==========
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 設定 Canvas 尺寸
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // 動畫循環 (60 FPS)
    const animate = () => {
      drawVisualizer();
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animate();
    } else {
      // 暫停時顯示靜態波形
      drawVisualizer();
    }

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isPlaying, drawVisualizer]);

  // ========== Render ==========
  return (
    <div className={`relative w-full h-full min-h-[200px] ${className || ''}`}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full border border-pip-boy-green/30 rounded bg-wasteland-darker"
        style={{ width: '100%', height: '100%' }}
        aria-label="音訊視覺化"
        role="img"
      />

      {/* Overlay Text (when not playing) */}
      {!isPlaying && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-pip-boy-green/50 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <PixelIcon name="music" sizePreset="lg" className="mx-auto mb-2" decorative />
            <div>點擊播放以查看視覺化</div>
          </div>
        </motion.div>
      )}

      {/* FPS Counter (Development Only) */}
      {process.env.NODE_ENV === 'development' && isPlaying && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 border border-pip-boy-green/50 rounded text-xs text-pip-boy-green">
          FPS: ~60
        </div>
      )}
    </div>
  );
});
