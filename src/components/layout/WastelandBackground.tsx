'use client';

import React, { useState, useEffect } from 'react';

interface WastelandBackgroundProps {
  variant?: 'default' | 'homepage' | 'login' | 'dashboard';
  animationIntensity?: 'low' | 'medium' | 'high';
  className?: string;
}

export const WastelandBackground: React.FC<WastelandBackgroundProps> = ({
  variant = 'default',
  animationIntensity = 'medium',
  className = ''
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'homepage':
        return 'wasteland-bg-homepage';
      case 'login':
        return 'wasteland-bg-login';
      case 'dashboard':
        return 'wasteland-bg-dashboard';
      default:
        return 'wasteland-bg-default';
    }
  };

  const getAnimationClasses = () => {
    switch (animationIntensity) {
      case 'low':
        return 'animation-low';
      case 'high':
        return 'animation-high';
      default:
        return 'animation-medium';
    }
  };

  // Generate particles on client-side only to avoid hydration mismatch
  const [particles, setParticles] = useState<Array<{
    key: number;
    delay: number;
    duration: number;
    xStart: number;
    yStart: number;
  }>>([]);

  useEffect(() => {
    const particleCount = animationIntensity === 'low' ? 20 : animationIntensity === 'high' ? 80 : 50;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      key: i,
      delay: Math.random() * 10,
      duration: 3 + Math.random() * 4,
      xStart: Math.random() * 100,
      yStart: Math.random() * 100,
    }));
    setParticles(newParticles);
  }, [animationIntensity]);

  return (
    <div className={`wasteland-background ${getVariantClasses()} ${getAnimationClasses()} ${className}`}>
      {/* 輻射粒子層 */}
      <div className="radiation-particles">
        {particles.map((particle) => (
          <div
            key={particle.key}
            className="particle"
            style={{
              '--delay': `${particle.delay}s`,
              '--duration': `${particle.duration}s`,
              '--x-start': `${particle.xStart}%`,
              '--y-start': `${particle.yStart}%`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* 廢土網格紋理 */}
      <div className="wasteland-grid" />

      {/* Pip-Boy 掃描線效果 */}
      <div className="scan-lines" />

      {/* 電子螢幕漸層 */}
      <div className="screen-gradient" />

      {/* 輻射干擾效果 */}
      <div className="radiation-interference" />
    </div>
  );
};

export default WastelandBackground;