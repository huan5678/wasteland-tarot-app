'use client';

import React, { useMemo, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import '@/components/PixelBlast.css';

// Dynamically import PixelBlast to handle SSR issues
const PixelBlast = dynamic(() => import('@/components/PixelBlast').catch(err => {
  console.warn('Failed to load PixelBlast:', err);
  // Return a fallback component
  return { default: () => <div className="w-full h-full bg-gradient-to-br from-pip-boy-green via-wasteland-dark to-wasteland-medium opacity-20" /> };
}), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-pip-boy-green via-wasteland-dark to-wasteland-medium opacity-20" />
  )
});

export interface PixelBlastBackgroundProps {
  variant?: 'default' | 'homepage' | 'login' | 'dashboard';
  animationIntensity?: 'low' | 'medium' | 'high';
  className?: string;
}

export const PixelBlastBackground: React.FC<PixelBlastBackgroundProps> = ({
  variant = 'default',
  animationIntensity = 'medium',
  className = ''
}) => {
  const [isClient, setIsClient] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Handle client-side only logic
  useEffect(() => {
    setIsClient(true);

    // Check for reduced motion preference
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Memoize PixelBlast configuration based on variant and animation intensity
  const pixelBlastConfig = useMemo(() => {
    // Base Fallout configuration - 極大增強可見性
    const baseConfig = {
      // Pip-Boy 綠色主題 - 使用更亮的綠色
      color: '#00ffaa', // 稍微調亮綠色
      variant: 'circle' as const,
      transparent: false, // 不透明以增強可見性
      liquid: true,
      enableRipples: true,
      autoPauseOffscreen: true,
      antialias: false, // 提高清晰度
      noiseAmount: 0.3 // 增加噪點效果以增強視覺
    };

    // Adjust parameters based on animation intensity
    const intensityConfig = {
      low: {
        pixelSize: 8,
        patternScale: 2,
        patternDensity: 0.8,
        pixelSizeJitter: 0.2,
        rippleSpeed: 0.2,
        rippleThickness: 0.08,
        rippleIntensityScale: 0.8,
        liquidStrength: 0.06,
        liquidRadius: 0.8,
        liquidWobbleSpeed: 3,
        speed: 0.3,
        edgeFade: 0.3
      },
      medium: {
        pixelSize: 3, // 更小更精細的像素
        patternScale: 1.5, // 更緊密的圖案
        patternDensity: 2.5, // 大幅增加密度
        pixelSizeJitter: 0.8, // 增加抖動
        rippleSpeed: 0.6,
        rippleThickness: 0.25, // 更厚的漣漪
        rippleIntensityScale: 4.0, // 極大增強強度
        liquidStrength: 0.25, // 大幅增強液體效果
        liquidRadius: 1.5,
        liquidWobbleSpeed: 8,
        speed: 1.2, // 更快的速度
        edgeFade: 0.05 // 最小邊緣淡化
      },
      high: {
        pixelSize: 4,
        patternScale: 4,
        patternDensity: 1.2,
        pixelSizeJitter: 0.6,
        rippleSpeed: 0.4,
        rippleThickness: 0.12,
        rippleIntensityScale: 1.5,
        liquidStrength: 0.12,
        liquidRadius: 1.2,
        liquidWobbleSpeed: 5,
        speed: 0.7,
        edgeFade: 0.2
      }
    };

    // Variant-specific configurations
    const variantConfig = {
      homepage: {
        // Standard Pip-Boy green - welcoming and mysterious
        color: '#00ff88',
        variant: 'circle' as const
      },
      login: {
        // 極大增強的放射橙色效果
        color: '#ffbb00', // 更亮的橙黃色，更明顯
        variant: 'diamond' as const,
        rippleIntensityScale: intensityConfig[animationIntensity].rippleIntensityScale * 5.0, // 極大增強
        liquidStrength: intensityConfig[animationIntensity].liquidStrength * 3.0, // 極大增強液體效果
        speed: intensityConfig[animationIntensity].speed * 2.0, // 雙倍動畫速度
        patternDensity: intensityConfig[animationIntensity].patternDensity * 2.5, // 大幅增加密度
        pixelSizeJitter: 1.0, // 最大抖動
        rippleThickness: 0.3, // 更厚的漣漪
        transparent: false, // 確保不透明
        noiseAmount: 0.4 // 增加噪點以提高可見性
      },
      dashboard: {
        // Calmer, more subdued terminal green for data display
        color: '#00cc66',
        variant: 'square' as const,
        speed: intensityConfig[animationIntensity].speed * 0.7,
        patternDensity: intensityConfig[animationIntensity].patternDensity * 0.8,
        enableRipples: false // Less distracting for data reading
      },
      default: {
        // Standard configuration
        color: '#00ff88',
        variant: 'circle' as const
      }
    };

    return {
      ...baseConfig,
      ...intensityConfig[animationIntensity],
      ...variantConfig[variant]
    };
  }, [variant, animationIntensity]);

  // Fallback background for SSR or when PixelBlast fails to load
  const fallbackBackground = (
    <div className="w-full h-full bg-gradient-to-br from-wasteland-darker via-wasteland-dark to-wasteland-medium opacity-80">
      {/* Add a subtle visual indicator that this is fallback */}
      <div className="absolute inset-0 bg-pip-boy-green/5"></div>
    </div>
  );

  return (
    <div
      className={`pixel-blast-background ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    >
      {isClient ? (
        <PixelBlast
          {...pixelBlastConfig}
          paused={prefersReducedMotion}
        />
      ) : (
        fallbackBackground
      )}
    </div>
  );
};

// Named export for DynamicBackground
export const DitherBackground = PixelBlastBackground;

// Default export
export default PixelBlastBackground;