'use client';

import { AsciiDonutLoading } from '@/components/loading/AsciiDonutLoading';
import { useState } from 'react';

/**
 * Test page for WebGL-integrated AsciiDonutLoading component
 */import { Button } from "@/components/ui/button";
export default function TestLoadingWebGLPage() {
  const [mode, setMode] = useState<'webgl' | 'cpu' | 'fallback'>('webgl');

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-green-400 mb-6 text-center">
          AsciiDonutLoading WebGL Integration Test
        </h1>

        {/* Mode Selector */}
        <div className="mb-8 p-6 border border-green-500 rounded bg-black/50">
          <h2 className="text-xl font-semibold text-green-400 mb-4">
            Rendering Mode:
          </h2>
          <div className="flex gap-4">
            <Button size="default" variant="default"
            onClick={() => setMode('webgl')}
            className="{expression}">





              <div className="font-semibold mb-1">🚀 WebGL V2</div>
              <div className="text-xs opacity-80">
                60 FPS + Random rotation controller
              </div>
            </Button>

            <Button size="default" variant="default"
            onClick={() => setMode('cpu')}
            className="{expression}">





              <div className="font-semibold mb-1">💻 CPU Renderer</div>
              <div className="text-xs opacity-80">
                24 FPS + Linear rotation
              </div>
            </Button>

            <Button size="default" variant="default"
            onClick={() => setMode('fallback')}
            className="{expression}">





              <div className="font-semibold mb-1">📊 Static Fallback</div>
              <div className="text-xs opacity-80">
                No animation (accessibility mode)
              </div>
            </Button>
          </div>

          {/* Current mode info */}
          <div className="mt-4 p-3 border border-green-700/50 rounded bg-black/30 text-sm text-green-300">
            <span className="text-cyan-400 font-semibold">Current Mode:</span>{' '}
            {mode === 'webgl' &&
            <>
                WebGL V2 with smooth random rotation animations (3-5s
                transitions, 30-135° changes)
              </>
            }
            {mode === 'cpu' &&
            <>CPU renderer with linear rotation (24 FPS target)</>
            }
            {mode === 'fallback' &&
            <>Static pre-rendered ASCII donut (accessibility mode)</>
            }
          </div>
        </div>

        {/* Component Test */}
        <div className="border-2 border-green-500 rounded overflow-hidden">
          {mode === 'webgl' &&
          <AsciiDonutLoading
            useWebGL={true}
            message="TESTING WEBGL V2 RENDERER..." />

          }
          {mode === 'cpu' &&
          <AsciiDonutLoading
            useWebGL={false}
            message="TESTING CPU RENDERER..." />

          }
          {mode === 'fallback' &&
          <AsciiDonutLoading
            forceFallback={true}
            message="TESTING STATIC FALLBACK..." />

          }
        </div>

        {/* Info */}
        <div className="mt-6 p-4 border border-green-500 rounded bg-black/50 text-sm text-green-300">
          <h3 className="text-lg font-semibold mb-2 text-green-400">
            Expected Behavior:
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <span className="text-cyan-400">WebGL V2:</span> Should show 60
              FPS with smooth, random rotation animations
            </li>
            <li>
              <span className="text-cyan-400">CPU:</span> Should show ~24 FPS
              with constant linear rotation
            </li>
            <li>
              <span className="text-cyan-400">Fallback:</span> Should show
              static ASCII donut (no animation)
            </li>
            <li>
              <span className="text-cyan-400">Auto-degradation:</span> WebGL
              falls back to CPU if FPS drops below 20
            </li>
          </ul>
        </div>
      </div>
    </div>);

}