'use client';

import { useEffect, useRef, useState } from 'react';
import { WebGLQuadDonutRenderer } from '@/lib/webgl/WebGLQuadDonutRenderer';
import { DEFAULT_DONUT_CONFIG } from '@/lib/donutConfig';

/**
 * Quad-based WebGL Donut Test Page
 *
 * Tests the quad-based renderer that displays ASCII characters
 * directly on GPU using instanced rendering.
 */
export default function TestQuadDonutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [fps, setFps] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const rendererRef = useRef<WebGLQuadDonutRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Create quad-based renderer
      setStatus('Creating WebGL quad renderer...');
      const renderer = new WebGLQuadDonutRenderer(DEFAULT_DONUT_CONFIG);
      rendererRef.current = renderer;

      // Append canvas to container
      const canvas = renderer.getCanvas();
      canvas.style.border = '2px solid #00ff00';
      canvas.style.imageRendering = 'pixelated';
      containerRef.current.appendChild(canvas);

      setStatus('✅ WebGL quad rendering active');

      // Animation loop
      let angleA = 0;
      let angleB = 0;
      let frameCount = 0;
      let fpsTime = performance.now();

      const animate = (currentTime: number) => {
        // Render frame
        renderer.render(angleA, angleB);

        // Update angles
        angleA += 0.04;
        angleB += 0.02;

        // Calculate FPS
        frameCount++;
        const elapsed = currentTime - fpsTime;
        if (elapsed >= 1000) {
          const currentFps = (frameCount / elapsed) * 1000;
          setFps(Math.round(currentFps * 10) / 10);
          frameCount = 0;
          fpsTime = currentTime;
        }

        animationIdRef.current = requestAnimationFrame(animate);
      };

      animationIdRef.current = requestAnimationFrame(animate);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setStatus('❌ Error occurred');
      console.error('[TestQuadDonut]', err);
    }

    // Cleanup
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-pip-boy-green p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-mono mb-4 text-center">
          WebGL Quad-based ASCII Donut
        </h1>

        <div className="mb-4 p-4 bg-black border border-pip-boy-green rounded">
          <h2 className="text-xl font-mono mb-2">Status</h2>
          <p className="font-mono text-sm">{status}</p>
          {error && (
            <div className="mt-2 p-2 bg-red-900/20 border border-red-500 rounded">
              <p className="text-red-500 font-mono text-sm">Error: {error}</p>
            </div>
          )}
        </div>

        <div className="mb-4 flex justify-center" ref={containerRef} />

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-black border border-pip-boy-green rounded">
            <h3 className="font-mono text-sm mb-2">Performance</h3>
            <p className="font-mono text-2xl">{fps} FPS</p>
          </div>

          <div className="p-4 bg-black border border-pip-boy-green rounded">
            <h3 className="font-mono text-sm mb-2">Rendering Method</h3>
            <ul className="font-mono text-xs space-y-1">
              <li>✅ Quad-based</li>
              <li>✅ Instanced Drawing</li>
              <li>✅ Direct GPU ASCII</li>
              <li>✅ No readPixels</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-4 bg-black border border-pip-boy-green rounded">
          <h3 className="font-mono text-sm mb-2">Technical Details</h3>
          <ul className="font-mono text-xs space-y-1 text-pip-boy-green/70">
            <li>• Each ASCII character = 1 textured quad (2 triangles)</li>
            <li>• WebGL 2.0 instanced rendering (1 draw call)</li>
            <li>• Character selection based on surface lighting</li>
            <li>• Fully GPU-accelerated (no CPU ASCII conversion)</li>
            <li>• Expected: 60+ FPS (vs Point-based: 60 FPS, Canvas 2D: 24 FPS)</li>
          </ul>
        </div>

        <div className="mt-4 flex justify-center gap-4">
          <a
            href="/test-webgl-donut"
            className="bg-pip-boy-green text-black px-6 py-3 rounded font-mono"
          >
            ← Point-based Version
          </a>
          <a
            href="/test-donut"
            className="bg-pip-boy-green text-black px-6 py-3 rounded font-mono"
          >
            ← Canvas 2D Version
          </a>
          <a
            href="/"
            className="bg-pip-boy-green text-black px-6 py-3 rounded font-mono"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
