/**
 * AsciiDonutLoading Component
 *
 * Fallout-themed loading screen with animated ASCII 3D donut.
 *
 * Features:
 * - 3D rotating torus rendered with ASCII characters
 * - WebGL acceleration (60 FPS) with CPU fallback (24 FPS)
 * - Smooth random rotation animations with easing
 * - Automatic performance monitoring with FPS tracking
 * - Accessibility support (ARIA attributes, prefers-reduced-motion)
 * - Static fallback mode for low-performance devices
 * - Customizable configuration (size, rotation speed, character set)
 *
 * @example
 * ```tsx
 * // Basic usage (WebGL by default)
 * <AsciiDonutLoading />
 *
 * // Custom message
 * <AsciiDonutLoading message="Loading your data..." />
 *
 * // Force CPU renderer
 * <AsciiDonutLoading useWebGL={false} />
 *
 * // Custom configuration
 * <AsciiDonutLoading
 *   config={{
 *     width: 60,
 *     height: 20,
 *     luminanceChars: '.:-=+*#%@'
 *   }}
 * />
 *
 * // Force static fallback (testing)
 * <AsciiDonutLoading forceFallback={true} />
 * ```
 *
 * Performance:
 * - WebGL Mode: 60 FPS with smooth random rotations (3-5s transitions, max 135° changes)
 * - CPU Mode: 24 FPS with linear rotation
 * - Auto-degrades to static mode when FPS < 20 (WebGL) or < 15 (CPU)
 * - Respects prefers-reduced-motion media query
 * - Uses requestAnimationFrame with optimal scheduling
 *
 * Accessibility:
 * - role="status" for semantic meaning
 * - aria-live="polite" for screen reader updates
 * - aria-label on animation element
 * - Keyboard navigation friendly (no focus traps)
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { WebGLQuadDonutRendererV2 } from '@/lib/webgl/WebGLQuadDonutRendererV2';
import { DonutRotationController } from '@/lib/animations/donutRotationController';
import { DonutRenderer } from '@/lib/donutRenderer';
import {
  DonutRendererConfig,
  DEFAULT_DONUT_CONFIG,
  LOW_PERFORMANCE_CONFIG,
  mergeDonutConfig,
} from '@/lib/donutConfig';

/**
 * Component Props
 */
export interface AsciiDonutLoadingProps {
  /** Loading message text displayed below the animation */
  message?: string;
  /** Force static fallback mode (useful for testing or debugging) */
  forceFallback?: boolean;
  /** Custom donut renderer configuration (partial override) */
  config?: Partial<DonutRendererConfig>;
  /** Use WebGL renderer (default: true for better performance) */
  useWebGL?: boolean;
  /** Progress value (0-100) for progress bar display */
  progress?: number;
}

/**
 * Static fallback ASCII donut (pre-rendered)
 */
const STATIC_DONUT = `
              .=**#@@#*=.
          ,~!#@@@@@@@@@@#!~,
        :*@@@@@@@@@@@@@@@@@@@*:
      =$@@@@@@@@@@@@@@@@@@@@@@@@$=
    .#@@@@@@@@@@@@@@@@@@@@@@@@@@@@#.
   ~@@@@@@@@@=~:.    .:~=@@@@@@@@@@@~
  ;@@@@@@@*.              .*@@@@@@@@@;
 *@@@@@@!                    !@@@@@@@@*
,@@@@@#.                      .#@@@@@@@,
#@@@@$                          $@@@@@@#
@@@@*                            *@@@@@
@@@#                              #@@@@
@@@                                @@@
@@@                                @@@
@@@                                @@@
@@@#                              #@@@@
@@@@*                            *@@@@@
#@@@@$                          $@@@@@@#
,@@@@@#.                      .#@@@@@@@,
 *@@@@@@!                    !@@@@@@@@*
  ;@@@@@@@*.              .*@@@@@@@@@;
   ~@@@@@@@@@=~:.    .:~=@@@@@@@@@@@~
    .#@@@@@@@@@@@@@@@@@@@@@@@@@@@@#.
      =$@@@@@@@@@@@@@@@@@@@@@@@@$=
        :*@@@@@@@@@@@@@@@@@@@*:
          ,~!#@@@@@@@@@@#!~,
              .=**#@@#*=.
`.trim();

/**
 * Fallout-style loading flavor texts
 * Randomly selected to add humor and immersion
 */
const FALLOUT_FLAVOR_TEXTS = [
  'Vault-Tec Quality Rendering™ - 請勿拍打終端機',
  'Pre-War Technology Detected - 比你的 Pip-Boy 還順暢',
  'Radiation-Free Performance - 經 Vault-Tec 認證',
  'Lucky 38 運算核心運作中 - 賭場老闆也會羨慕',
  'Mr. Handy 表示：這效能讓我想升級成 Mr. Gutsy',
  'Psycho 成癮者表示：這比嗑藥還爽快',
  'V.A.T.S. 偵測到：95% 流暢度命中率',
  'Nuka-Cola Quantum Powered - 含藍色螢光加成',
  'Brotherhood of Steel 認證科技水準',
  'Three Dog 播報：這是我見過最棒的終端機！',
  'Stimpak 無法治癒的卡頓 - 但我們可以',
  'Caesar\'s Legion 禁用此技術（因為太先進了）',
  '新維加斯大道的霓虹燈都沒這麼滑順',
  'RobCo Industries™ 原廠效能保證',
];

/**
 * Get a random Fallout-style flavor text
 */
function getRandomFlavorText(): string {
  return FALLOUT_FLAVOR_TEXTS[Math.floor(Math.random() * FALLOUT_FLAVOR_TEXTS.length)];
}

/**
 * AsciiDonutLoading Component
 */
export function AsciiDonutLoading({
  message = 'INITIALIZING VAULT RESIDENT STATUS...',
  forceFallback = false,
  config,
  useWebGL = true,
  progress = 0,
}: AsciiDonutLoadingProps) {
  // State management
  const [useFallback, setUseFallback] = useState(forceFallback);
  const [currentFPS, setCurrentFPS] = useState(0);
  const [flavorText] = useState(() => getRandomFlavorText());

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const rendererRef = useRef<DonutRenderer | null>(null);
  const webglRendererRef = useRef<WebGLQuadDonutRendererV2 | null>(null);
  const rotationControllerRef = useRef<DonutRotationController | null>(null);
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
    console.log('[AsciiDonutLoading] useEffect triggered', {
      useFallback,
      forceFallback,
      useWebGL,
    });

    // Skip animation if fallback mode
    if (useFallback || forceFallback) {
      console.log('[AsciiDonutLoading] Using fallback mode');
      if (preRef.current) {
        preRef.current.textContent = STATIC_DONUT;
      }
      return;
    }

    // WebGL rendering path
    if (useWebGL) {
      console.log('[AsciiDonutLoading] Initializing WebGL renderer...');
      try {
        // Initialize WebGL renderer
        const finalConfig = config
          ? mergeDonutConfig({ ...DEFAULT_DONUT_CONFIG, ...config })
          : DEFAULT_DONUT_CONFIG;

        webglRendererRef.current = new WebGLQuadDonutRendererV2({
          width: finalConfig.width,
          height: finalConfig.height,
          R1: finalConfig.R1,
          R2: finalConfig.R2,
          K1: finalConfig.K1,
          K2: finalConfig.K2,
          thetaSpacing: finalConfig.thetaSpacing,
          phiSpacing: finalConfig.phiSpacing,
          luminanceChars: finalConfig.luminanceChars,
        });

        // Initialize rotation controller (Random mode with smooth animations)
        rotationControllerRef.current = new DonutRotationController({
          angleA: 0,
          angleB: 0,
        });

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
          if (!webglRendererRef.current || !rotationControllerRef.current) return;

          // Get smooth rotation from controller
          const rotation = rotationControllerRef.current.update(Date.now());

          // Render frame with WebGL
          webglRendererRef.current.render(rotation.angleA, rotation.angleB);

          // FPS tracking
          frameCountRef.current++;
          if (frameCountRef.current % 60 === 0) {
            const now = performance.now();
            const fps = 60000 / (now - lastFPSCheckRef.current);
            lastFPSCheckRef.current = now;
            setCurrentFPS(fps);

            // Performance degradation detection
            if (fps < 20) {
              console.warn('[AsciiDonutLoading] WebGL performance degraded, switching to fallback');
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
          rotationControllerRef.current = null;
        };
      } catch (err) {
        console.error('[AsciiDonutLoading] WebGL initialization failed, falling back to CPU renderer:', err);
        setUseFallback(true);
        // Don't continue to CPU path - let the component re-render with useFallback=true
      }
    }

    // Only execute CPU rendering path if NOT using WebGL
    if (useWebGL) {
      return; // WebGL path already returned or will retry with useFallback
    }

    // CPU rendering path (fallback)
    const finalConfig = config
      ? mergeDonutConfig({ ...DEFAULT_DONUT_CONFIG, ...config })
      : DEFAULT_DONUT_CONFIG;

    rendererRef.current = new DonutRenderer(finalConfig);

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
        lastFrameTimeRef.current =
          currentTime - (deltaTime % frameInterval);

        // Render donut
        const asciiString = rendererRef.current.render(
          angleARef.current,
          angleBRef.current
        );
        preRef.current.textContent = asciiString;

        // Update angles
        angleARef.current += 0.04;
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
            console.warn('[AsciiDonutLoading] Low FPS detected, switching to static fallback');
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
    >
      {/* WebGL Canvas Container (for useWebGL mode) */}
      {useWebGL && !useFallback && !forceFallback && (
        <div
          ref={containerRef}
          className="flex items-center justify-center w-full"
          style={{ minHeight: '288px' }}
          aria-label="Loading animation"
        >
          {/* Canvas will be inserted here by WebGL renderer */}
        </div>
      )}

      {/* ASCII Donut Animation (for CPU/fallback mode) */}
      {(!useWebGL || useFallback || forceFallback) && (
        <pre
          ref={preRef}
          className="font-mono text-pip-boy-green whitespace-pre text-xs sm:text-sm leading-tight"
          aria-label="Loading animation"
        >
          {/* Content updated by animation loop or static fallback */}
        </pre>
      )}

      {/* Progress Bar */}
      <div className="w-full max-w-md px-4 mt-6">
        <div className="relative h-1.5 bg-pip-boy-green/20 rounded-full overflow-hidden">
          {/* Progress Fill */}
          <div
            className="absolute top-0 left-0 h-full bg-pip-boy-green rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Progress Percentage */}
        <p className="font-mono text-pip-boy-green/60 text-xs text-center mt-2">
          {Math.round(progress)}%
        </p>
      </div>

      {/* Loading Message */}
      <p className="font-mono text-pip-boy-green/80 text-sm mt-4">
        {message}
      </p>

      {/* Fallout-style Flavor Text (dev mode only) */}
      {process.env.NODE_ENV !== 'production' && currentFPS > 0 && (
        <p className="font-mono text-pip-boy-green/50 text-xs mt-2">
          [ {flavorText} ]
        </p>
      )}
    </div>
  );
}
