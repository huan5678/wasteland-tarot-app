'use client';

import { AsciiDonutLoading } from '@/components/loading/AsciiDonutLoading';
import { useState } from 'react';import { Button } from "@/components/ui/button";

export default function TestDonutPage() {
  const [showLoading, setShowLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  if (showLoading) {
    return (
      <div className="relative">
        <AsciiDonutLoading
          message="TESTING ASCII DONUT ANIMATION..."
          forceFallback={useFallback} />

        <div className="fixed bottom-4 right-4 flex gap-2 z-50">
          <Button size="default" variant="link"
          onClick={() => setShowLoading(false)}
          className="px-4 py-2 rounded">

            Hide Loading
          </Button>
          <Button size="default" variant="link"
          onClick={() => setUseFallback(!useFallback)}
          className="px-4 py-2 rounded">

            Toggle Fallback
          </Button>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-pip-boy-green">
      <h1 className="text-3xl mb-8">ASCII Donut Loading Test</h1>
      <div className="flex gap-4">
        <Button size="lg" variant="link"
        onClick={() => setShowLoading(true)}
        className="px-6 py-3 rounded">

          Show Loading (Animated)
        </Button>
        <Button size="lg" variant="link"
        onClick={() => {
          setUseFallback(true);
          setShowLoading(true);
        }}
        className="px-6 py-3 rounded">

          Show Loading (Static Fallback)
        </Button>
      </div>
      <div className="mt-8 text-center max-w-2xl">
        <p className="text-sm text-pip-boy-green/70">
          Click the buttons above to test the ASCII Donut Loading component.
          The animated version shows a rotating 3D donut, while the static
          fallback shows a pre-rendered version.
        </p>
      </div>
    </div>);

}