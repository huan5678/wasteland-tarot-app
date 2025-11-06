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
  analyserNode?: AnalyserNode | null; // P3.4: 真實的音訊分析節點
}

/**
 * MusicVisualizer Component
 * Requirements: Canvas 繪製頻譜圖、60 FPS 動畫、記憶體優化
 * P3.4: 整合 RhythmAudioSynthesizer 的 AnalyserNode 以顯示真實音訊數據
 */
export const MusicVisualizer = React.memo(function MusicVisualizer({
  isPlaying,
  className,
  analyserNode,
}: MusicVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const warmupFramesRef = useRef<number>(0);

  // ========== Initialize Audio Analyser ==========
  // P3.4: 使用傳入的 AnalyserNode（從 RhythmAudioSynthesizer 或 ProceduralMusicEngine）
  useEffect(() => {
    if (analyserNode) {
      analyserRef.current = analyserNode;

      // 建立頻率數據陣列
      const bufferLength = analyserNode.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      // 重置預熱計數器
      warmupFramesRef.current = 0;
    } else {
      // 沒有 AnalyserNode 時清空
      analyserRef.current = null;
      dataArrayRef.current = null;
      warmupFramesRef.current = 0;
    }

    // 清理函數：不 disconnect，因為 analyserNode 由外部管理
    return () => {
      dataArrayRef.current = null;
      warmupFramesRef.current = 0;
    };
  }, [analyserNode]);

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

    // P3.4: 從 AnalyserNode 取得真實頻率數據
    let frequencyData: Uint8Array | null = null;

    // 移除 isPlaying 檢查，只要有 analyserNode 就讀取數據
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      frequencyData = dataArrayRef.current;

      // 累積預熱幀數
      if (warmupFramesRef.current < 60) {
        warmupFramesRef.current++;
      }
    }

    for (let i = 0; i < barCount; i++) {
      let value: number;

      if (frequencyData) {
        // 使用真實的頻率數據（取樣 bins）
        const binIndex = Math.floor((i * frequencyData.length) / barCount);
        value = frequencyData[binIndex] || 0;
      } else {
        // 無數據時顯示靜態最小值
        value = 0;
      }

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
    // 重要：只要有 analyserNode 就持續繪製，不管是否播放
    const animate = () => {
      drawVisualizer();
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    // 只要有 analyserNode 就開始動畫循環
    if (analyserRef.current) {
      animate();
    } else {
      // 沒有 analyserNode 時顯示靜態空白
      drawVisualizer();
    }

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [analyserNode, drawVisualizer]);

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
