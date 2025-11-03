'use client';

import React, { useEffect, useRef, useState } from 'react';
import { WebGLQuadDonutRendererV2 } from '@/lib/webgl/WebGLQuadDonutRendererV2';
import { DonutRotationController, DonutDriftController } from '@/lib/animations/donutRotationController';

/**
 * WebGL Quad Donut Renderer V2 Test Page
 *
 * Tests the optimized full-screen quad + fragment shader ray-marching approach
 * based on WebGL best practices research.
 *
 * Now with smooth random rotation animations!
 */import { Button } from "@/components/ui/button";
export default function TestQuadDonutV2Page() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WebGLQuadDonutRendererV2 | null>(null);
  const driftControllerRef = useRef<DonutDriftController | null>(null);
  const randomControllerRef = useRef<DonutRotationController | null>(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const [fps, setFps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [animationMode, setAnimationMode] = useState<'drift' | 'random'>('drift');

  useEffect(() => {
    let animationId: number;

    try {
      // Initialize renderer
      const renderer = new WebGLQuadDonutRendererV2({
        width: 80,
        height: 24,
        R1: 1,
        R2: 2,
        K1: 150,
        K2: 5,
        thetaSpacing: 0.07,
        phiSpacing: 0.02,
        luminanceChars: ' .:-=+*#%@'
      });

      rendererRef.current = renderer;

      // Initialize both controllers
      driftControllerRef.current = new DonutDriftController({
        angleA: 0,
        angleB: 0
      });

      randomControllerRef.current = new DonutRotationController({
        angleA: 0,
        angleB: 0
      });

      // Mount canvas to DOM container
      const canvas = renderer.getCanvas();
      if (containerRef.current) {
        // Clear container and append new canvas
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(canvas);
      }

      const animate = () => {
        if (!rendererRef.current) return;

        // Get rotation from active controller based on current mode
        let rotation;
        if (animationMode === 'drift' && driftControllerRef.current) {
          rotation = driftControllerRef.current.update(Date.now());
        } else if (animationMode === 'random' && randomControllerRef.current) {
          rotation = randomControllerRef.current.update(Date.now());
        } else {
          return;
        }

        // Render frame with smooth rotation
        rendererRef.current.render(rotation.angleA, rotation.angleB);

        // Calculate FPS
        frameCountRef.current++;
        const now = Date.now();
        const elapsed = now - lastTimeRef.current;

        if (elapsed >= 1000) {
          const currentFps = frameCountRef.current / elapsed * 1000;
          setFps(Math.round(currentFps * 10) / 10);
          frameCountRef.current = 0;
          lastTimeRef.current = now;
        }

        animationId = requestAnimationFrame(animate);
      };

      animate();
    } catch (err) {
      console.error('[TestQuadDonutV2] Error:', err);
      setError(err instanceof Error ? err.message : String(err));
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [animationMode]); // Re-run when animation mode changes

  return (
    <div className="min-h-screen bg-black text-green-500 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          WebGL Quad Donut Renderer V2 Test
        </h1>

        <div className="mb-6 p-4 border border-green-500 rounded bg-green-950/20">
          <h2 className="text-xl font-semibold mb-2">V2 Architecture:</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Single full-screen quad (not 1,920 quads)</li>
            <li>Fragment shader performs ray-marching (not vertex shader)</li>
            <li>Optimized parameters (MAX_STEPS: 64, MIN_DIST: 0.005)</li>
            <li>Safety factor in ray-marching (0.9x step size)</li>
            <li>3-tap normal calculation (not 6-tap)</li>
            <li className="text-yellow-400">✨ Smooth random rotation with dual animation modes</li>
          </ul>
        </div>

        {/* Animation Mode Selector */}
        <div className="mb-6 p-4 border border-cyan-500 rounded bg-cyan-950/20">
          <h2 className="text-xl font-semibold mb-3 text-cyan-400">Animation Mode:</h2>
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <Button size="default" variant="default"
              onClick={() => setAnimationMode('drift')}
              className="{expression}">





                <div className="font-semibold mb-1">🌊 Drift Mode</div>
                <div className="text-xs opacity-80">Slow continuous drift + occasional random flips</div>
              </Button>
              <Button size="default" variant="default"
              onClick={() => setAnimationMode('random')}
              className="{expression}">





                <div className="font-semibold mb-1">🎲 Random Mode</div>
                <div className="text-xs opacity-80">Continuous smooth random rotations (3-5s each, max 135°)</div>
              </Button>
            </div>

            {/* Current mode description */}
            <div className="text-sm p-3 border border-green-700/50 rounded bg-black/30">
              {animationMode === 'drift' ?
              <>
                  <span className="text-cyan-400 font-semibold">Drift Mode:</span> Very slow base rotation with 0.1% chance per frame to trigger a 1.5s random flip animation.
                </> :

              <>
                  <span className="text-cyan-400 font-semibold">Random Mode:</span> Continuously animates between random rotation targets (30-135° changes over 3-5 seconds) with smooth sine easing. Optimized to prevent jarring jumps.
                </>
              }
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-center gap-6">
          <div className="text-xl">
            <span className="font-semibold">FPS: </span>
            <span className={fps >= 30 ? 'text-green-400' : fps >= 15 ? 'text-yellow-400' : 'text-red-400'}>
              {fps.toFixed(1)}
            </span>
          </div>
          <Button size="icon" variant="outline"
          onClick={() => {
            if (animationMode === 'drift' && driftControllerRef.current) {
              driftControllerRef.current.triggerFlip();
            } else if (animationMode === 'random' && randomControllerRef.current) {
              randomControllerRef.current.randomize();
            }
          }}
          className="px-4 py-2 border rounded transition-colors">

            {animationMode === 'drift' ? '🎲 Trigger Random Flip' : '🔄 New Random Target'}
          </Button>
        </div>

        {error &&
        <div className="mb-6 p-4 border border-red-500 rounded bg-red-950/20 text-red-400">
            <h2 className="text-xl font-semibold mb-2">Error:</h2>
            <pre className="text-sm whitespace-pre-wrap">{error}</pre>
          </div>
        }

        <div
          ref={containerRef}
          className="border-2 border-green-500 rounded overflow-hidden bg-black">

          {/* Canvas will be inserted here by renderer */}
        </div>

        <div className="mt-6 p-4 border border-green-500 rounded bg-green-950/20 text-sm">
          <h2 className="text-lg font-semibold mb-2">Performance Comparison:</h2>
          <div className="space-y-2">
            <div>
              <span className="font-semibold">Canvas 2D:</span> 22.4 FPS
            </div>
            <div>
              <span className="font-semibold">WebGL Point:</span> 60 FPS ✅
            </div>
            <div>
              <span className="font-semibold">WebGL Quad V1:</span> 8.0 FPS (vertex shader ray-marching)
            </div>
            <div>
              <span className="font-semibold">WebGL Quad V2:</span>
              <span className={fps >= 30 ? 'text-green-400 font-bold ml-2' : 'ml-2'}>
                {fps > 0 ? `${fps.toFixed(1)} FPS` : 'Testing...'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm opacity-70">
          <p>Optimized based on WebGL best practices research</p>
          <p>Full-screen quad + fragment shader ray-marching approach</p>
        </div>
      </div>
    </div>);

}