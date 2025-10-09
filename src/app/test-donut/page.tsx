'use client';

import { AsciiDonutLoading } from '@/components/loading/AsciiDonutLoading';
import { useState } from 'react';

export default function TestDonutPage() {
  const [showLoading, setShowLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  if (showLoading) {
    return (
      <div className="relative">
        <AsciiDonutLoading
          message="TESTING ASCII DONUT ANIMATION..."
          forceFallback={useFallback}
        />
        <div className="fixed bottom-4 right-4 flex gap-2 z-50">
          <button
            onClick={() => setShowLoading(false)}
            className="bg-pip-boy-green text-black px-4 py-2 rounded font-mono"
          >
            Hide Loading
          </button>
          <button
            onClick={() => setUseFallback(!useFallback)}
            className="bg-pip-boy-green text-black px-4 py-2 rounded font-mono"
          >
            Toggle Fallback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-pip-boy-green">
      <h1 className="text-3xl font-mono mb-8">ASCII Donut Loading Test</h1>
      <div className="flex gap-4">
        <button
          onClick={() => setShowLoading(true)}
          className="bg-pip-boy-green text-black px-6 py-3 rounded font-mono"
        >
          Show Loading (Animated)
        </button>
        <button
          onClick={() => {
            setUseFallback(true);
            setShowLoading(true);
          }}
          className="bg-pip-boy-green text-black px-6 py-3 rounded font-mono"
        >
          Show Loading (Static Fallback)
        </button>
      </div>
      <div className="mt-8 text-center max-w-2xl">
        <p className="font-mono text-sm text-pip-boy-green/70">
          Click the buttons above to test the ASCII Donut Loading component.
          The animated version shows a rotating 3D donut, while the static
          fallback shows a pre-rendered version.
        </p>
      </div>
    </div>
  );
}
