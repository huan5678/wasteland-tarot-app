/**
 * AsciiBottleCapLoading Component
 *
 * Fallout-themed loading screen with animated ASCII 3D bottle cap.
 *
 * Features:
 * - 3D rotating bottle cap with crimped edges (21 teeth)
 * - WebGL acceleration (60 FPS) with CPU fallback (24 FPS)
 * - Smooth rotation animations
 * - Central depression on top surface
 * - Metallic appearance with Lambertian lighting
 * - Automatic performance monitoring with FPS tracking
 *
 * @example
 * ```tsx
 * // Basic usage (WebGL by default)
 * <AsciiBottleCapLoading />
 *
 * // Custom message
 * <AsciiBottleCapLoading message="Loading Nuka-Cola..." />
 *
 * // Force CPU renderer
 * <AsciiBottleCapLoading useWebGL={false} />
 *
 * // Custom configuration
 * <AsciiBottleCapLoading
 *   config={{
 *     width: 60,
 *     height: 20,
 *     crimpCount: 24
 *   }}
 * />
 * ```
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  BottleCapRenderer,
  BottleCapConfig,
  DEFAULT_BOTTLE_CAP_CONFIG,
} from '@/lib/bottleCapRenderer';
import { WebGLQuadBottleCapRenderer } from '@/lib/webgl/WebGLQuadBottleCapRenderer';

/**
 * Component Props
 */
export interface AsciiBottleCapLoadingProps {
  /** Loading message text displayed below the animation */
  message?: string;
  /** Custom bottle cap renderer configuration (partial override) */
  config?: Partial<BottleCapConfig>;
  /** Force static fallback mode (useful for testing) */
  forceFallback?: boolean;
  /** Use WebGL renderer (default: true for better performance) */
  useWebGL?: boolean;
}

/**
 * Static fallback ASCII bottle cap (pre-rendered)
 */
const STATIC_BOTTLE_CAP = `
              .==*##*==.
          ,=*############*=,
        =###################*.
      =#######################=
     *#########################*
    *###########################*
   =####   ###############   ####=
  .*###     #############     ###*.
  =#####    #############    #####=
  *######   #############   ######*
 .########  #############  ########.
 *#########*#############*#########*
 ##########*#############*##########
 ##########*#############*##########
 *#########*#############*#########*
 .########  #############  ########.
  *######   #############   ######*
  =#####    #############    #####=
  .*###     #############     ###*.
   =####   ###############   ####=
    *###########################*
     *#########################*
      =#######################=
        =###################*.
          ,=*############*=,
              .==*##*==.
`.trim();

/**
 * Nuka-Cola themed flavor texts
 */
const BOTTLE_CAP_FLAVOR_TEXTS = [
  'Nuka-Cola Quantum Rendering™ - 藍色螢光加持',
  'Sunset Sarsaparilla Star Caps Detected - 超稀有渲染',
  'Vim! Performance Mode - 來自緬因州的能量',
  'Bottle Cap Mine 炸裂特效 - 保證不會當機',
  'Sierra Madre Casino Chip 級別的流暢度',
  'Nuka-World 品質保證 - 連可樂蓋都能 3D 旋轉',
  'Mr. Pebbles 表示：比貓罐頭的蓋子還圓',
  'Atomic Wrangler Casino 認證效能',
  'Lucky 38 運算核心 - 連 Mr. House 都會讚賞',
  'Caps Collector Achievement Unlocked - 60 FPS',
];

/**
 * Get a random Nuka-Cola flavor text
 */
function getRandomFlavorText(): string {
  return BOTTLE_CAP_FLAVOR_TEXTS[
    Math.floor(Math.random() * BOTTLE_CAP_FLAVOR_TEXTS.length)
  ];
}

/**
 * AsciiBottleCapLoading Component
 */
export function AsciiBottleCapLoading({
  message = 'COLLECTING BOTTLE CAPS...',
  config,
  forceFallback = false,
  useWebGL = true,
}: AsciiBottleCapLoadingProps) {
  // State management
  const [useFallback, setUseFallback] = useState(forceFallback);
  const [currentFPS, setCurrentFPS] = useState(0);
  const [flavorText] = useState(() => getRandomFlavorText());

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const rendererRef = useRef<BottleCapRenderer | null>(null);
  const webglRendererRef = useRef<WebGLQuadBottleCapRenderer | null>(null);
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
   * Animation loop
   */
  useEffect(() => {
    // Skip animation if fallback mode
    if (useFallback || forceFallback) {
      if (preRef.current) {
        preRef.current.textContent = STATIC_BOTTLE_CAP;
      }
      return;
    }

    // Merge user config with defaults
    const finalConfig: BottleCapConfig = {
      ...DEFAULT_BOTTLE_CAP_CONFIG,
      ...config,
    };

    // WebGL rendering path
    if (useWebGL) {
      try {
        // Initialize WebGL renderer
        webglRendererRef.current = new WebGLQuadBottleCapRenderer(finalConfig);

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
          angleARef.current += 0.03;
          angleBRef.current += 0.02;

          // FPS tracking
          frameCountRef.current++;
          if (frameCountRef.current % 60 === 0) {
            const now = performance.now();
            const fps = 60000 / (now - lastFPSCheckRef.current);
            lastFPSCheckRef.current = now;
            setCurrentFPS(fps);

            // Performance degradation detection
            if (fps < 20) {
              setUseFallback(true);
              return;
            }
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
        // WebGL initialization failed, fall back to CPU renderer
        console.warn('[AsciiBottleCapLoading] WebGL init failed, falling back to CPU', err);
        setUseFallback(true);
        // Don't continue to CPU path - let the component re-render with useFallback=true
      }
    }

    // Only execute CPU rendering path if NOT using WebGL
    if (useWebGL) {
      return; // WebGL path already returned or will retry with useFallback
    }

    // CPU rendering path (fallback)
    rendererRef.current = new BottleCapRenderer(finalConfig);

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

        // Render bottle cap
        const asciiString = rendererRef.current.render(
          angleARef.current,
          angleBRef.current
        );
        preRef.current.textContent = asciiString;

        // Update angles (slower rotation for better visibility)
        angleARef.current += 0.03;
        angleBRef.current += 0.02;

        // FPS tracking
        frameCountRef.current++;
        if (frameCountRef.current % 60 === 0) {
          const now = performance.now();
          const fps = 60000 / (now - lastFPSCheckRef.current);
          lastFPSCheckRef.current = now;
          setCurrentFPS(fps);

          // Performance degradation
          if (fps < 15) {
            setUseFallback(true);
            return;
          }
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
          style={{ minHeight: '288px' }}
          aria-label="Loading animation"
          suppressHydrationWarning
        >
          {/* Canvas will be inserted here by WebGL renderer */}
        </div>
      )}

      {/* ASCII Bottle Cap Animation (for CPU/fallback mode) */}
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
            FPS: {currentFPS.toFixed(1)} | Caps: {frameCountRef.current} | {useWebGL && !useFallback ? 'WebGL' : 'CPU'}
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
