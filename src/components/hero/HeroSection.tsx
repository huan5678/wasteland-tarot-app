/**
 * HeroSection Component
 *
 * Hero Section with parallax effects and entrance animations
 *
 * Features:
 * - Task 7.1: Parallax effect (background 0.5x, foreground 1.0x)
 * - Task 7.2: Entrance animation sequence (title → subtitle → CTA)
 * - Task 7.3: Accessibility support (useReducedMotion integration)
 *
 * Requirements:
 * - 3.1, 3.2, 3.3: Hero Section parallax and entrance animations
 * - 10.1: Responsive design (mobile disables parallax)
 * - 11.2, 11.3: Accessibility (prefers-reduced-motion)
 * - 12: Performance optimization (60fps)
 */

'use client';

import { useRef } from 'react';
import { useParallax } from '@/lib/animations/useParallax';
import { useScrollAnimation } from '@/lib/animations/useScrollAnimation';
import { useReducedMotion } from '@/lib/animations/useReducedMotion';
import { DynamicHeroTitle, DynamicHeroTitleErrorBoundary } from '@/components/hero';
import { PixelIcon } from '@/components/ui/icons';

/**
 * HeroSection Component
 *
 * Renders the Hero section with parallax background and entrance animations.
 * Integrates with animation system hooks for smooth, accessible effects.
 */
export function HeroSection() {
  // Refs for parallax layers
  const backgroundRef = useRef<HTMLDivElement>(null);
  const foregroundRef = useRef<HTMLDivElement>(null);

  // Check reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  // Task 7.1: Setup parallax effect
  // Background layer moves at 0.5x scroll speed
  // Foreground layer moves at 1.0x scroll speed (normal)
  // Mobile devices: parallax disabled
  useParallax({
    backgroundRef,
    foregroundRef,
    backgroundSpeed: 0.5,
    foregroundSpeed: 1.0,
    disableOnMobile: true,
  });

  // Task 7.2: Setup entrance animation sequence
  // 1. Title fades in with upward translation (0.8s, power2.out)
  // 2. Subtitle fades in 0.3s after title (0.6s, power2.out)
  // 3. CTA button scales in 0.5s after subtitle (0.4s, elastic.out)
  useScrollAnimation({
    triggerRef: foregroundRef,
    animations: [
      {
        target: '.hero-title',
        from: { opacity: 0, y: -40 },
        to: { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      },
      {
        target: '.hero-subtitle',
        from: { opacity: 0, y: -20 },
        to: { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        position: '+=0.3', // 0.3s delay after title
      },
      {
        target: '.hero-cta',
        from: { opacity: 0, scale: 0.8 },
        to: { opacity: 1, scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' },
        position: '+=0.5', // 0.5s delay after subtitle
      },
    ],
    // Task 7.3: Disable animations when reduced motion is enabled
    enabled: !prefersReducedMotion,
  });

  return (
    <section className="relative">
      {/* Task 7.1: Background layer (parallax effect) */}
      <div
        ref={backgroundRef}
        data-testid="hero-background"
        className="absolute inset-0 -z-10"
      >
        <div className="scanline-overlay" />
      </div>

      {/* Task 7.1: Foreground content layer (normal scroll speed) */}
      <div
        ref={foregroundRef}
        data-testid="hero-foreground"
        className="max-w-6xl mx-auto px-4 py-16"
      >
        {/* Terminal Header */}
        <div className="text-center mb-12">
          <div
            className="border-2 border-pip-boy-green p-4 inline-block mb-8"
            style={{ backgroundColor: 'var(--color-pip-boy-green-10)' }}
          >
            <div className="flex items-center gap-2 sm:gap-4 text-xs">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
              {/* Mobile: Simplified display */}
              <span className="hidden md:inline">VAULT-TEC PIP-BOY 3000 MARK IV</span>
              <span className="hidden sm:inline md:hidden">PIP-BOY 3000 MARK IV</span>
              <span className="inline sm:hidden">PIP-BOY 3000</span>
              <span className="hidden sm:inline text-pip-boy-green/50">|</span>
              <span className="hidden sm:inline">占卜終端機啟動中</span>
              <span className="hidden md:inline text-pip-boy-green/50">|</span>
              <span className="hidden md:inline">狀態：線上</span>
            </div>
          </div>

          {/* Task 7.2: Title (animated element) */}
          <div className="hero-title">
            <DynamicHeroTitleErrorBoundary>
              <DynamicHeroTitle />
            </DynamicHeroTitleErrorBoundary>
          </div>
        </div>

        {/* Task 7.2: Subtitle (animated element) */}
        <p className="hero-subtitle text-center text-pip-boy-green/70 mb-8">
          結合 Fallout 世界觀的獨特塔羅占卜體驗
        </p>

        {/* Task 7.2: CTA Buttons (animated element) */}
        <div className="hero-cta flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto mb-16 justify-center">
          {/* Primary CTA */}
          <button className="group relative w-full sm:w-auto overflow-hidden">
            {/* Background layers */}
            <div className="absolute inset-0 bg-black border-2 border-pip-boy-green"></div>
            <div className="absolute inset-0 bg-pip-boy-green/5 group-hover:bg-pip-boy-green/10 transition-colors"></div>

            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-pip-boy-green"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-pip-boy-green"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-pip-boy-green"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-pip-boy-green"></div>

            {/* Scan line effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="h-full w-full bg-gradient-to-b from-transparent via-pip-boy-green/10 to-transparent animate-scanline"></div>
            </div>

            {/* Content - Horizontal Layout */}
            <div className="relative px-6 py-4 flex items-center gap-4">
              <PixelIcon
                name="target"
                sizePreset="lg"
                className="text-pip-boy-green group-hover:animate-pulse flex-shrink-0"
                decorative
              />
              <div className="text-left flex-1">
                <div className="text-lg font-bold text-pip-boy-green tracking-wider uppercase">
                  進入 Vault
                </div>
                <div className="text-xs text-pip-boy-green/70 font-mono">
                  [ 登入終端機 ]
                </div>
              </div>
            </div>
          </button>

          {/* Secondary CTA */}
          <button className="group relative w-full sm:w-auto overflow-hidden">
            {/* Background layers */}
            <div className="absolute inset-0 bg-black border-2 border-radiation-orange"></div>
            <div className="absolute inset-0 bg-radiation-orange/5 group-hover:bg-radiation-orange/10 transition-colors"></div>

            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-radiation-orange"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-radiation-orange"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-radiation-orange"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-radiation-orange"></div>

            {/* Scan line effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="h-full w-full bg-gradient-to-b from-transparent via-radiation-orange/10 to-transparent animate-scanline"></div>
            </div>

            {/* Content - Horizontal Layout */}
            <div className="relative px-6 py-4 flex items-center gap-4">
              <PixelIcon
                name="file-list-2"
                sizePreset="lg"
                className="text-radiation-orange group-hover:animate-pulse flex-shrink-0"
                decorative
              />
              <div className="text-left flex-1">
                <div className="text-lg font-bold text-radiation-orange tracking-wider uppercase">
                  快速占卜
                </div>
                <div className="text-xs text-radiation-orange/70 font-mono">
                  [ 免註冊試用 ]
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Scanline effect overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="h-px bg-gradient-to-r from-transparent via-pip-boy-green to-transparent opacity-30 animate-pulse"></div>
      </div>
    </section>
  );
}
