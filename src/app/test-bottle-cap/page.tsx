/**
 * Bottle Cap Loading Test Page
 *
 * Interactive test page for the ASCII bottle cap loading animation
 */

'use client';

import React, { useState } from 'react';
import { AsciiBottleCapLoading } from '@/components/loading/AsciiBottleCapLoading';
import { PixelIcon } from '@/components/ui/icons';

export default function TestBottleCapPage() {
  const [showLoading, setShowLoading] = useState(true);
  const [customMessage, setCustomMessage] = useState('COLLECTING BOTTLE CAPS...');
  const [crimpCount, setCrimpCount] = useState(21);
  const [forceFallback, setForceFallback] = useState(false);

  return (
    <div className="min-h-screen bg-black text-pip-boy-green p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <PixelIcon name="science" sizePreset="lg" variant="primary" />
          Bottle Cap Loading Test
        </h1>
        <p className="text-pip-boy-green/70 mb-8">
          Interactive test page for 3D ASCII bottle cap rendering
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

            {/* Crimp Count */}
            <div>
              <label className="block mb-2">
                Crimp Count (Teeth): {crimpCount}
              </label>
              <input
                type="range"
                min="12"
                max="36"
                step="3"
                value={crimpCount}
                onChange={(e) => setCrimpCount(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-pip-boy-green/50 mt-1">
                <span>12 (少)</span>
                <span>24 (標準)</span>
                <span>36 (多)</span>
              </div>
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
                  'COLLECTING BOTTLE CAPS...',
                  'OPENING NUKA-COLA...',
                  'SEARCHING FOR STAR CAPS...',
                  'SUNSET SARSAPARILLA LOADING...',
                  'ATOMIC WRANGLER CASINO',
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
              <span>21 crimped edges (configurable: 12-36)</span>
            </div>
            <div className="flex gap-2">
              <PixelIcon name="check" sizePreset="xs" variant="success" />
              <span>Central depression with parabolic surface</span>
            </div>
            <div className="flex gap-2">
              <PixelIcon name="check" sizePreset="xs" variant="success" />
              <span>Lambertian reflectance lighting model</span>
            </div>
            <div className="flex gap-2">
              <PixelIcon name="check" sizePreset="xs" variant="success" />
              <span>CPU-based ASCII rendering at 24 FPS</span>
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
              <li>• Top Surface: z = -depth × (r / depressionRadius)²</li>
              <li>• Bottom Surface: z = -thickness (flat)</li>
              <li>• Crimped Edge: r(θ) = radius + amplitude × sin(crimpCount × θ)</li>
              <li>• Rotation: X-axis (angleA) → Z-axis (angleB)</li>
              <li>• Projection: screenX = width/2 + K1 × (x/z)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Loading Animation Overlay */}
      {showLoading && (
        <AsciiBottleCapLoading
          message={customMessage}
          config={{
            crimpCount: crimpCount,
          }}
          forceFallback={forceFallback}
        />
      )}
    </div>
  );
}
