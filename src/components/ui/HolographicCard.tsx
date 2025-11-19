'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HolographicCardProps {
  children: React.ReactNode;
  className?: string;
  /** Intensity of the tilt effect (default: 15) */
  intensity?: number;
  /** Whether to show the glare effect (default: true) */
  enableGlare?: boolean;
}

export function HolographicCard({
  children,
  className,
  intensity = 15,
  enableGlare = true,
}: HolographicCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for mouse position (0 to 1)
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  // Spring physics for smooth movement
  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  const rotateX = useSpring(useTransform(y, [0, 1], [intensity, -intensity]), springConfig);
  const rotateY = useSpring(useTransform(x, [0, 1], [-intensity, intensity]), springConfig);

  // Glare effect positioning
  const glareX = useTransform(x, [0, 1], ['0%', '100%']);
  const glareY = useTransform(y, [0, 1], ['0%', '100%']);
  const glareOpacity = useSpring(isHovered ? 0.4 : 0, { ...springConfig, stiffness: 100 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Normalize to 0-1
    const xPct = mouseX / rect.width;
    const yPct = mouseY / rect.height;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Reset to center
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      className={cn('relative preserve-3d perspective-1000', className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Content */}
      <div className="relative z-10 h-full w-full transform-style-3d">
        {children}
      </div>

      {/* Holographic Glare Overlay */}
      {enableGlare && (
        <motion.div
          className="absolute inset-0 z-20 pointer-events-none rounded-[inherit] mix-blend-overlay"
          style={{
            opacity: glareOpacity,
            background: `radial-gradient(circle at ${glareX.get()} ${glareY.get()}, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`,
          }}
        />
      )}
      
      {/* Scanline/Hologram texture overlay (optional, static) */}
      <div className="absolute inset-0 z-0 pointer-events-none rounded-[inherit] opacity-5 bg-[url('/images/noise.png')] bg-repeat mix-blend-overlay" />
    </motion.div>
  );
}
