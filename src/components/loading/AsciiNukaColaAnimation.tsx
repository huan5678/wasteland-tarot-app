/**
 * AsciiNukaColaAnimation Component
 *
 * Pure Nuka-Cola bottle animation component without container or messages.
 * Used internally by AsciiLoading for composition.
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  NukaColaRenderer,
  NukaColaConfig,
  DEFAULT_NUKA_COLA_CONFIG,
} from '@/lib/nukaColaRenderer';
import { WebGLQuadNukaColaRenderer } from '@/lib/webgl/WebGLQuadNukaColaRenderer';

export interface AsciiNukaColaAnimationProps {
  forceFallback?: boolean;
  config?: Partial<NukaColaConfig>;
  useWebGL?: boolean;
}

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

export function AsciiNukaColaAnimation({
  forceFallback = false,
  config,
  useWebGL = true,
}: AsciiNukaColaAnimationProps) {
  const [useFallback, setUseFallback] = useState(forceFallback);
  const containerRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const rendererRef = useRef<NukaColaRenderer | null>(null);
  const webglRendererRef = useRef<WebGLQuadNukaColaRenderer | null>(null);
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
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        lastFPSCheckRef.current = performance.now();
        frameCountRef.current = 0;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (useFallback || forceFallback) {
      if (preRef.current) preRef.current.textContent = STATIC_NUKA_COLA;
      return;
    }

    const finalConfig: NukaColaConfig = {
      ...DEFAULT_NUKA_COLA_CONFIG,
      ...config,
    };

    const shouldUseWebGL = useWebGL && !useFallback;

    if (shouldUseWebGL) {
      try {
        webglRendererRef.current = new WebGLQuadNukaColaRenderer(finalConfig);
        const canvas = webglRendererRef.current.getCanvas();
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(canvas);
        }

        const animate = () => {
          if (!webglRendererRef.current) return;
          webglRendererRef.current.render(angleARef.current, angleBRef.current);
          angleARef.current += 0.02;
          angleBRef.current += 0.015;
          frameCountRef.current++;
          if (frameCountRef.current % 60 === 0) {
            const now = performance.now();
            const deltaTime = now - lastFPSCheckRef.current;
            if (deltaTime < 2000) {
              const fps = 60000 / deltaTime;
              if (fps < 20) {
                console.warn('[AsciiNukaColaAnimation] Performance degraded, switching to CPU');
                setUseFallback(true);
                return;
              }
            }
            lastFPSCheckRef.current = now;
          }
          animationIdRef.current = requestAnimationFrame(animate);
        };

        animationIdRef.current = requestAnimationFrame(animate);

        return () => {
          if (animationIdRef.current !== null) cancelAnimationFrame(animationIdRef.current);
          if (webglRendererRef.current) {
            webglRendererRef.current.dispose();
            webglRendererRef.current = null;
          }
        };
      } catch (err) {
        console.error('[AsciiNukaColaAnimation] WebGL init failed:', err);
        setUseFallback(true);
        return;
      }
    }

    rendererRef.current = new NukaColaRenderer(finalConfig);
    const targetFPS = 24;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      if (!rendererRef.current || !preRef.current) return;
      const deltaTime = currentTime - lastFrameTimeRef.current;
      if (deltaTime >= frameInterval) {
        lastFrameTimeRef.current = currentTime - (deltaTime % frameInterval);
        const asciiString = rendererRef.current.render(angleARef.current, angleBRef.current);
        preRef.current.textContent = asciiString;
        angleARef.current += 0.02;
        angleBRef.current += 0.015;
        frameCountRef.current++;
        if (frameCountRef.current % 60 === 0) {
          const now = performance.now();
          const deltaTime = now - lastFPSCheckRef.current;
          if (deltaTime < 5000) {
            const fps = 60000 / deltaTime;
            if (fps < 15) {
              console.warn('[AsciiNukaColaAnimation] CPU performance degraded, switching to static');
              setUseFallback(true);
              return;
            }
          }
          lastFPSCheckRef.current = now;
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
          style={{ minHeight: '480px' }}
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
