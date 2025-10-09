'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import WastelandBackground from './WastelandBackground';

export const DynamicBackground: React.FC = () => {
  const pathname = usePathname();

  const getBackgroundConfig = () => {
    if (pathname === '/') {
      return { variant: 'homepage' as const, animationIntensity: 'medium' as const };
    }

    if (pathname.startsWith('/auth/login')) {
      return { variant: 'login' as const, animationIntensity: 'high' as const };
    }

    if (pathname.startsWith('/auth/register')) {
      return { variant: 'login' as const, animationIntensity: 'medium' as const };
    }

    if (pathname.startsWith('/dashboard')) {
      return { variant: 'dashboard' as const, animationIntensity: 'low' as const };
    }

    // Default background for other pages
    return { variant: 'default' as const, animationIntensity: 'medium' as const };
  };

  const { variant, animationIntensity } = getBackgroundConfig();

  return (
    <WastelandBackground
      variant={variant}
      animationIntensity={animationIntensity}
    />
  );
};

export default DynamicBackground;