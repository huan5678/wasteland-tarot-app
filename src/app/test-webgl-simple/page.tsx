'use client';

import { useEffect, useRef, useState } from 'react';
import { WebGLQuadDonutRendererV2 } from '@/lib/webgl/WebGLQuadDonutRendererV2';
import { DonutRotationController } from '@/lib/animations/donutRotationController';

/**
 * Simplified WebGL test page for debugging
 */
export default function TestWebGLSimplePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let renderer: WebGLQuadDonutRendererV2 | null = null;
    let controller: DonutRotationController | null = null;
    let animationId: number;

    try {
      setStatus('Creating WebGL renderer...');

      renderer = new WebGLQuadDonutRendererV2({
        width: 80,
        height: 24,
        R1: 1,
        R2: 2,
        K1: 150,
        K2: 5,
        thetaSpacing: 0.07,
        phiSpacing: 0.02,
        luminanceChars: ' .:-=+*#%@',
      });

      setStatus('Creating rotation controller...');

      controller = new DonutRotationController({
        angleA: 0,
        angleB: 0,
      });

      setStatus('Mounting canvas...');

      const canvas = renderer.getCanvas();
      console.log('[Debug] Canvas element:', canvas);
      console.log('[Debug] Canvas width:', canvas.width, 'height:', canvas.height);
      console.log('[Debug] Container ref:', containerRef.current);

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(canvas);
        console.log('[Debug] Canvas mounted successfully');
        setStatus('Canvas mounted, starting animation...');
      } else {
        throw new Error('Container ref is null');
      }

      let frameCount = 0;
      const animate = () => {
        if (!renderer || !controller) return;

        const rotation = controller.update(Date.now());
        renderer.render(rotation.angleA, rotation.angleB);

        frameCount++;
        if (frameCount === 60) {
          setStatus(`Animation running (${frameCount} frames rendered)`);
        }

        animationId = requestAnimationFrame(animate);
      };

      setStatus('Starting animation loop...');
      animationId = requestAnimationFrame(animate);

    } catch (err) {
      console.error('[Debug] Error:', err);
      setError(err instanceof Error ? err.message : String(err));
      setStatus('Failed');
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (renderer) {
        renderer.dispose();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-green-400 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Simple WebGL Test
        </h1>

        <div className="mb-6 p-4 border border-green-500 rounded bg-green-950/20">
          <div className="mb-2">
            <strong>Status:</strong> {status}
          </div>
          {error && (
            <div className="text-red-400">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* Container for canvas */}
        <div
          ref={containerRef}
          className="border-2 border-green-500 rounded overflow-hidden bg-black flex items-center justify-center min-h-[400px]"
          style={{ minWidth: '600px' }}
        >
          {/* Canvas will be inserted here */}
        </div>

        <div className="mt-6 p-4 border border-green-500 rounded bg-green-950/20 text-sm">
          <h3 className="font-semibold mb-2">Debug Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open browser DevTools (F12)</li>
            <li>Check Console tab for debug messages</li>
            <li>Inspect the green bordered container div</li>
            <li>Verify canvas element exists inside container</li>
            <li>Check canvas dimensions and WebGL context</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
