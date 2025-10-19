/**
 * Nuka-Cola Bottle Loading Test Page
 *
 * Interactive test page for the ASCII Nuka-Cola bottle loading animation
 */

'use client';

import React, { useState } from 'react';
import { AsciiNukaColaLoading } from '@/components/loading/AsciiNukaColaLoading';
import { PixelIcon } from '@/components/ui/icons';

export default function TestNukaColaPage() {
  const [showLoading, setShowLoading] = useState(true);
  const [customMessage, setCustomMessage] = useState('LOADING NUKA-COLA...');
  const [bodyRadius, setBodyRadius] = useState(1.2);
  const [forceFallback, setForceFallback] = useState(false);
  const [useWebGL, setUseWebGL] = useState(true);

  return (
    <div className="min-h-screen bg-black text-pip-boy-green p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <PixelIcon name="science" sizePreset="lg" variant="primary" />
          Nuka-Cola Bottle Loading Test
        </h1>
        <p className="text-pip-boy-green/70 mb-8">
          Interactive test page for 3D ASCII Nuka-Cola bottle rendering
        </p>

        {/* Control Panel */}
        <div className="border-2 border-pip-boy-green/30 p-6 mb-8 rounded-lg bg-pip-boy-green/5">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <PixelIcon name="sliders" sizePreset="md" variant="primary" />
            Control Panel
          </h2>

          <div className="space-y-4">
            {/* Toggle Loading */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLoading}
                  onChange={(e) => setShowLoading(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Show Loading Animation</span>
              </label>
            </div>

            {/* Custom Message */}
            <div>
              <label className="block mb-2">Loading Message:</label>
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full bg-black border border-pip-boy-green/50 text-pip-boy-green px-3 py-2 rounded focus:outline-none focus:border-pip-boy-green"
                placeholder="Enter custom message..."
              />
            </div>

            {/* Body Radius */}
            <div>
              <label className="block mb-2">
                Body Radius (Width): {bodyRadius.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.8"
                max="1.6"
                step="0.1"
                value={bodyRadius}
                onChange={(e) => setBodyRadius(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-pip-boy-green/50 mt-1">
                <span>0.8 (窄)</span>
                <span>1.2 (標準)</span>
                <span>1.6 (寬)</span>
              </div>
            </div>

            {/* Use WebGL */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWebGL}
                  onChange={(e) => setUseWebGL(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Use WebGL Acceleration (60 FPS)</span>
              </label>
            </div>

            {/* Force Fallback */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceFallback}
                  onChange={(e) => setForceFallback(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Force Static Fallback Mode</span>
              </label>
            </div>

            {/* Preset Messages */}
            <div>
              <label className="block mb-2">Preset Messages:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  'LOADING NUKA-COLA...',
                  'OPENING NUKA-COLA QUANTUM...',
                  'SEARCHING FOR BOTTLES...',
                  'SUNSET SARSAPARILLA LOADING...',
                  'VIM! REFRESH MODE...',
                ].map((msg) => (
                  <button
                    key={msg}
                    onClick={() => setCustomMessage(msg)}
                    className="px-3 py-1 border border-pip-boy-green/50 rounded hover:bg-pip-boy-green/10 transition-colors text-sm"
                  >
                    {msg.substring(0, 20)}...
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Technical Info */}
        <div className="border-2 border-pip-boy-green/30 p-6 rounded-lg bg-pip-boy-green/5">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <PixelIcon name="code" sizePreset="md" variant="primary" />
            Technical Information
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <PixelIcon name="check" sizePreset="xs" variant="success" />
              <span>3D parametric surface rendering with z-buffer</span>
            </div>
            <div className="flex gap-2">
              <PixelIcon name="check" sizePreset="xs" variant="success" />
              <span>Realistic bottle proportions (neck, shoulder, body, base)</span>
            </div>
            <div className="flex gap-2">
              <PixelIcon name="check" sizePreset="xs" variant="success" />
              <span>Smooth shoulder transition with ease-in-out interpolation</span>
            </div>
            <div className="flex gap-2">
              <PixelIcon name="check" sizePreset="xs" variant="success" />
              <span>Concave bottom with parabolic surface</span>
            </div>
            <div className="flex gap-2">
              <PixelIcon name="check" sizePreset="xs" variant="success" />
              <span>Lambertian reflectance lighting model</span>
            </div>
            <div className="flex gap-2">
              <PixelIcon name="check" sizePreset="xs" variant="success" />
              <span>WebGL-accelerated rendering at 60 FPS</span>
            </div>
            <div className="flex gap-2">
              <PixelIcon name="check" sizePreset="xs" variant="success" />
              <span>CPU fallback at 24 FPS</span>
            </div>
            <div className="flex gap-2">
              <PixelIcon name="check" sizePreset="xs" variant="success" />
              <span>Automatic performance degradation to static mode</span>
            </div>
            <div className="flex gap-2">
              <PixelIcon name="check" sizePreset="xs" variant="success" />
              <span>Respects prefers-reduced-motion accessibility</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-black/50 rounded border border-pip-boy-green/20">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <PixelIcon name="info" sizePreset="xs" variant="info" />
              Mathematical Model
            </h3>
            <ul className="text-xs space-y-1 text-pip-boy-green/70 font-mono">
              <li>• Neck: r = neckRadius (constant cylinder)</li>
              <li>• Shoulder: r(t) = neckRadius + (bodyRadius - neckRadius) × smoothstep(t)</li>
              <li>• Body: r = bodyRadius (constant cylinder)</li>
              <li>• Base: r(t) = bodyRadius × (1 - 0.1 × t²)</li>
              <li>• Bottom: y = -bottomConcaveDepth × (1 - (r/maxR)²)</li>
              <li>• Rotation: X-axis (angleA) → Z-axis (angleB)</li>
              <li>• Projection: screenX = width/2 + K1 × (x/z)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Loading Animation Overlay */}
      {showLoading && (
        <AsciiNukaColaLoading
          message={customMessage}
          config={{
            bodyRadius: bodyRadius,
          }}
          forceFallback={forceFallback}
          useWebGL={useWebGL}
        />
      )}
    </div>
  );
}
