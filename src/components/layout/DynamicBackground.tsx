'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import WastelandBackground from './WastelandBackground';
import CRTBackground from './CRTBackground';

export const DynamicBackground: React.FC = () => {
  const pathname = usePathname();

  const getBackgroundConfig = () => {
    if (pathname === '/') {
      return { variant: 'homepage' as const, animationIntensity: 'medium' as const, useCRT: false };
    }

    if (pathname.startsWith('/auth/login')) {
      return { variant: 'login' as const, animationIntensity: 'high' as const, useCRT: false };
    }

    if (pathname.startsWith('/auth/register')) {
      return { variant: 'login' as const, animationIntensity: 'medium' as const, useCRT: false };
    }

    if (pathname.startsWith('/dashboard')) {
      return { variant: 'dashboard' as const, animationIntensity: 'low' as const, useCRT: true };
    }

    // Default background for other pages - 使用 CRT 掃描線背景
    return { variant: 'default' as const, animationIntensity: 'medium' as const, useCRT: true };
  };

  const { variant, animationIntensity, useCRT } = getBackgroundConfig();

  // 如果是預設頁面，使用 CRT 背景效果
  if (useCRT) {
    return <CRTBackground />;
  }

  // 其他特殊頁面使用 WastelandBackground
  return (
    <WastelandBackground
      variant={variant}
      animationIntensity={animationIntensity}
    />
  );
};

export default DynamicBackground;