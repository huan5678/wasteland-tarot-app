/**
 * AsciiNukaColaLoading Component
 *
 * Fallout-themed loading screen with animated ASCII 3D Nuka-Cola bottle.
 *
 * Features:
 * - 3D rotating Nuka-Cola bottle with realistic proportions
 * - WebGL acceleration (60 FPS) with CPU fallback (24 FPS)
 * - Smooth rotation animations
 * - Bottle neck, shoulder, body, and base sections
 * - Concave bottom detail
 * - Metallic appearance with Lambertian lighting
 * - Automatic performance monitoring with FPS tracking
 *
 * @example
 * ```tsx
 * // Basic usage (WebGL by default)
 * <AsciiNukaColaLoading />
 *
 * // Custom message
 * <AsciiNukaColaLoading message="Loading Nuka-Cola..." />
 *
 * // Force CPU renderer
 * <AsciiNukaColaLoading useWebGL={false} />
 *
 * // Force static fallback
 * <AsciiNukaColaLoading forceFallback />
 * ```
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  NukaColaRenderer,
  NukaColaConfig,
  DEFAULT_NUKA_COLA_CONFIG,
} from '@/lib/nukaColaRenderer';
import { WebGLQuadNukaColaRenderer } from '@/lib/webgl/WebGLQuadNukaColaRenderer';

/**
 * Component Props
 */
export interface AsciiNukaColaLoadingProps {
  /** Loading message text displayed below the animation */
  message?: string;
  /** Custom bottle renderer configuration (partial override) */
  config?: Partial<NukaColaConfig>;
  /** Force static fallback mode (useful for testing) */
  forceFallback?: boolean;
  /** Use WebGL renderer (default: true for better performance) */
  useWebGL?: boolean;
}

/**
 * Static fallback ASCII Nuka-Cola bottle (pre-rendered)
 */
const STATIC_NUKA_COLA = `
              .=*.
             =####=
            =######=
            *######*
            *######*
            *######*
           ,########,
           !########!
           *########*
          ,##########,
          *##########*
          *##########*
         ,############,
         !############!
         *############*
        ,##############,
        *##############*
        *##############*
        *##############*
        *##############*
        *##############*
        *##############*
        *##############*
        !##############!
        ,##############,
         *############*
         !############!
         ,############,
          *##########*
          *##########*
          ,##########,
           *########*
           !########!
           ,########,
            *######*
            *######*
             =####=
              .=*.
`.trim();

/**
 * Nuka-Cola themed flavor texts
 */
const NUKA_COLA_FLAVOR_TEXTS = [
  'Nuka-Cola Quantum Rendering™ - 藍色螢光加持',
  'Sunset Sarsaparilla Star Caps Detected - 超稀有渲染',
  'Vim! Performance Mode - 來自緬因州的能量',
  'Nuka-Cola Victory 勝利配方 - 二戰限定款',
  'Sierra Madre Casino Chip 級別的流暢度',
  'Nuka-World 品質保證 - 連瓶子都能 3D 旋轉',
  'Mr. Pebbles 表示：比貓罐頭還圓潤',
  'Atomic Wrangler Casino 認證效能',
  'Lucky 38 運算核心 - 連 Mr. House 都會讚賞',
  'Caps Collector Achievement Unlocked - 24 FPS',
];

/**
 * Get a random Nuka-Cola flavor text
 */
function getRandomFlavorText(): string {
  return NUKA_COLA_FLAVOR_TEXTS[
    Math.floor(Math.random() * NUKA_COLA_FLAVOR_TEXTS.length)
  ];
}

/**
 * AsciiNukaColaLoading Component
 */
export function AsciiNukaColaLoading({
  message = 'LOADING NUKA-COLA...',
  config,
  forceFallback = false,
  useWebGL = true,
}: AsciiNukaColaLoadingProps) {
  // State management
  const [useFallback, setUseFallback] = useState(forceFallback);
  const [currentFPS, setCurrentFPS] = useState(0);
  const [flavorText] = useState(() => getRandomFlavorText());

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const rendererRef = useRef<NukaColaRenderer | null>(null);
  const webglRendererRef = useRef<WebGLQuadNukaColaRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const angleARef = useRef(0);
  const angleBRef = useRef(0);

  // Performance tracking
  const frameCountRef = useRef(0);
  const lastFPSCheckRef = useRef(performance.now());
  const lastFrameTimeRef = useRef(0);

  /**
   * Detect prefers-reduced-motion
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setUseFallback(true);
    }

    const handleChange = (e: MediaQueryListEvent) => {
      setUseFallback(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  /**
   * Handle page visibility changes (tab switching)
   */
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible again, reset FPS timer to avoid false degradation detection
        lastFPSCheckRef.current = performance.now();
        frameCountRef.current = 0;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  /**
   * Animation loop
   */
  useEffect(() => {
    // Skip animation if fallback mode
    if (useFallback || forceFallback) {
      if (preRef.current) {
        preRef.current.textContent = STATIC_NUKA_COLA;
      }
      return;
    }

    // Merge user config with defaults
    const finalConfig: NukaColaConfig = {
      ...DEFAULT_NUKA_COLA_CONFIG,
      ...config,
    };

    // Determine which renderer to use
    const shouldUseWebGL = useWebGL && !useFallback;

    // WebGL rendering path
    if (shouldUseWebGL) {
      try {
        // Initialize WebGL renderer
        webglRendererRef.current = new WebGLQuadNukaColaRenderer(finalConfig);

        // Mount canvas to DOM
        const canvas = webglRendererRef.current.getCanvas();
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(canvas);
        }

        /**
         * WebGL animation loop
         */
        const animate = () => {
          if (!webglRendererRef.current) return;

          // Render frame with WebGL
          webglRendererRef.current.render(angleARef.current, angleBRef.current);

          // Update angles (slower rotation for better visibility)
          angleARef.current += 0.02;
          angleBRef.current += 0.015;

          // FPS tracking
          frameCountRef.current++;
          if (frameCountRef.current % 60 === 0) {
            const now = performance.now();
            const deltaTime = now - lastFPSCheckRef.current;

            // Ignore FPS calculation if deltaTime is too large (tab was inactive)
            // Normal 60 frames should take ~1000ms, allow up to 2000ms
            if (deltaTime < 2000) {
              const fps = 60000 / deltaTime;
              setCurrentFPS(fps);

              // Performance degradation detection (only if valid measurement)
              if (fps < 20) {
                console.warn('[AsciiNukaColaLoading] Performance degraded, switching to CPU');
                setUseFallback(true);
                return;
              }
            }

            lastFPSCheckRef.current = now;
          }

          animationIdRef.current = requestAnimationFrame(animate);
        };

        // Start WebGL animation
        animationIdRef.current = requestAnimationFrame(animate);

        // Cleanup
        return () => {
          if (animationIdRef.current !== null) {
            cancelAnimationFrame(animationIdRef.current);
            animationIdRef.current = null;
          }
          if (webglRendererRef.current) {
            webglRendererRef.current.dispose();
            webglRendererRef.current = null;
          }
        };
      } catch (err) {
        // WebGL initialization failed, trigger re-render with CPU mode
        console.error('[AsciiNukaColaLoading] WebGL init failed:', err);
        setUseFallback(true);
        // Return early, component will re-render and use CPU path
        return;
      }
    }

    // CPU rendering path (fallback)
    rendererRef.current = new NukaColaRenderer(finalConfig);

    // Animation configuration
    const targetFPS = 24;
    const frameInterval = 1000 / targetFPS;

    /**
     * CPU animation frame callback
     */
    const animate = (currentTime: number) => {
      if (!rendererRef.current || !preRef.current) return;

      const deltaTime = currentTime - lastFrameTimeRef.current;

      // Frame skipping logic
      if (deltaTime >= frameInterval) {
        lastFrameTimeRef.current = currentTime - (deltaTime % frameInterval);

        // Render bottle
        const asciiString = rendererRef.current.render(
          angleARef.current,
          angleBRef.current
        );
        preRef.current.textContent = asciiString;

        // Update angles (slower rotation for better visibility)
        angleARef.current += 0.02;
        angleBRef.current += 0.015;

        // FPS tracking
        frameCountRef.current++;
        if (frameCountRef.current % 60 === 0) {
          const now = performance.now();
          const deltaTime = now - lastFPSCheckRef.current;

          // Ignore FPS calculation if deltaTime is too large (tab was inactive)
          // Normal 60 frames should take ~2500ms at 24 FPS, allow up to 5000ms
          if (deltaTime < 5000) {
            const fps = 60000 / deltaTime;
            setCurrentFPS(fps);

            // Performance degradation (only if valid measurement)
            if (fps < 15) {
              console.warn('[AsciiNukaColaLoading] CPU performance degraded, switching to static');
              setUseFallback(true);
              return;
            }
          }

          lastFPSCheckRef.current = now;
        }
      }

      // Continue animation loop
      animationIdRef.current = requestAnimationFrame(animate);
    };

    // Start CPU animation
    animationIdRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, [useFallback, forceFallback, config, useWebGL]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50"
      role="status"
      aria-live="polite"
      suppressHydrationWarning
    >
      {/* WebGL Canvas Container (for useWebGL mode) */}
      {useWebGL && !useFallback && !forceFallback && (
        <div
          ref={containerRef}
          className="flex items-center justify-center w-full"
          style={{ minHeight: '480px' }}
          aria-label="Loading animation"
          suppressHydrationWarning
        >
          {/* Canvas will be inserted here by WebGL renderer */}
        </div>
      )}

      {/* ASCII Nuka-Cola Animation (for CPU/fallback mode) */}
      {(!useWebGL || useFallback || forceFallback) && (
        <pre
          ref={preRef}
          className="text-pip-boy-green whitespace-pre text-xs sm:text-sm leading-tight"
          aria-label="Loading animation"
          suppressHydrationWarning
        >
          {/* Content updated by animation loop or static fallback */}
        </pre>
      )}

      {/* Loading Message */}
      <p
        className="text-pip-boy-green/80 text-sm mt-4"
        suppressHydrationWarning
      >
        {message}
      </p>

      {/* Nuka-Cola Flavor Text (dev mode only) */}
      {process.env.NODE_ENV !== 'production' && currentFPS > 0 && (
        <div className="text-center mt-2" suppressHydrationWarning>
          <p className="text-pip-boy-green/50 text-xs">[ {flavorText} ]</p>
          <p className="text-pip-boy-green/40 text-xs mt-1">
            FPS: {currentFPS.toFixed(1)} | Bottles: {frameCountRef.current} | {useWebGL && !useFallback ? 'WebGL' : 'CPU'}
          </p>
        </div>
      )}

      {/* Fallback indicator */}
      {useFallback && (
        <p className="text-pip-boy-green/40 text-xs mt-2" suppressHydrationWarning>
          [ Static Mode - Performance Optimized ]
        </p>
      )}
    </div>
  );
}
