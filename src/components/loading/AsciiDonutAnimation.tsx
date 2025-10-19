/**
 * AsciiDonutAnimation Component
 *
 * Pure donut animation component without container or messages.
 * Used internally by AsciiLoading for composition.
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { WebGLQuadDonutRendererV2 } from '@/lib/webgl/WebGLQuadDonutRendererV2';
import { DonutRotationController } from '@/lib/animations/donutRotationController';
import { DonutRenderer } from '@/lib/donutRenderer';
import {
  DonutRendererConfig,
  DEFAULT_DONUT_CONFIG,
  mergeDonutConfig,
} from '@/lib/donutConfig';

export interface AsciiDonutAnimationProps {
  forceFallback?: boolean;
  config?: Partial<DonutRendererConfig>;
  useWebGL?: boolean;
}

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

export function AsciiDonutAnimation({
  forceFallback = false,
  config,
  useWebGL = true,
}: AsciiDonutAnimationProps) {
  const [useFallback, setUseFallback] = useState(forceFallback);
  const containerRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const rendererRef = useRef<DonutRenderer | null>(null);
  const webglRendererRef = useRef<WebGLQuadDonutRendererV2 | null>(null);
  const rotationControllerRef = useRef<DonutRotationController | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const angleARef = useRef(0);
  const angleBRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFPSCheckRef = useRef(performance.now());
  const lastFrameTimeRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) setUseFallback(true);
    const handleChange = (e: MediaQueryListEvent) => setUseFallback(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (useFallback || forceFallback) {
      if (preRef.current) preRef.current.textContent = STATIC_DONUT;
      return;
    }

    if (useWebGL) {
      try {
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

        rotationControllerRef.current = new DonutRotationController({
          angleA: 0,
          angleB: 0,
        });

        const canvas = webglRendererRef.current.getCanvas();
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(canvas);
        }

        const animate = () => {
          if (!webglRendererRef.current || !rotationControllerRef.current) return;
          const rotation = rotationControllerRef.current.update(Date.now());
          webglRendererRef.current.render(rotation.angleA, rotation.angleB);
          frameCountRef.current++;
          if (frameCountRef.current % 60 === 0) {
            const now = performance.now();
            const fps = 60000 / (now - lastFPSCheckRef.current);
            lastFPSCheckRef.current = now;
            if (fps < 20) {
              setUseFallback(true);
              return;
            }
          }
          animationIdRef.current = requestAnimationFrame(animate);
        };

        animationIdRef.current = requestAnimationFrame(animate);

        return () => {
          if (animationIdRef.current !== null) cancelAnimationFrame(animationIdRef.current);
          if (webglRendererRef.current) webglRendererRef.current.dispose();
          rotationControllerRef.current = null;
        };
      } catch (err) {
        setUseFallback(true);
      }
    }

    if (useWebGL) return;

    const finalConfig = config
      ? mergeDonutConfig({ ...DEFAULT_DONUT_CONFIG, ...config })
      : DEFAULT_DONUT_CONFIG;
    rendererRef.current = new DonutRenderer(finalConfig);
    const targetFPS = 24;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      if (!rendererRef.current || !preRef.current) return;
      const deltaTime = currentTime - lastFrameTimeRef.current;
      if (deltaTime >= frameInterval) {
        lastFrameTimeRef.current = currentTime - (deltaTime % frameInterval);
        const asciiString = rendererRef.current.render(angleARef.current, angleBRef.current);
        preRef.current.textContent = asciiString;
        angleARef.current += 0.04;
        angleBRef.current += 0.02;
        frameCountRef.current++;
        if (frameCountRef.current % 60 === 0) {
          const now = performance.now();
          const fps = 60000 / (now - lastFPSCheckRef.current);
          lastFPSCheckRef.current = now;
          if (fps < 15) {
            setUseFallback(true);
            return;
          }
        }
      }
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationIdRef.current !== null) cancelAnimationFrame(animationIdRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, [useFallback, forceFallback, config, useWebGL]);

  return (
    <>
      {useWebGL && !useFallback && !forceFallback && (
        <div
          ref={containerRef}
          className="flex items-center justify-center w-full"
          style={{ minHeight: '288px' }}
          aria-label="Loading animation"
          suppressHydrationWarning
        />
      )}
      {(!useWebGL || useFallback || forceFallback) && (
        <pre
          ref={preRef}
          className="text-pip-boy-green whitespace-pre text-xs sm:text-sm leading-tight"
          aria-label="Loading animation"
          suppressHydrationWarning
        />
      )}
    </>
  );
}
