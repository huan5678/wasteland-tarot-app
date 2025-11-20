'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface AnimationContextType {
  isCRTOn: boolean;
  turnOnCRT: () => void;
  turnOffCRT: () => void;
  playTransition: (callback?: () => void) => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  // 修復黑屏卡死：直接設為 true，跳過開機動畫
  // 原本為 false 會導致 CRTScreenEffect 顯示黑屏
  const [isCRTOn, setIsCRTOn] = useState(true);
  const pathname = usePathname();

  const turnOnCRT = useCallback(() => {
    setIsCRTOn(true);
  }, []);

  const turnOffCRT = useCallback(() => {
    setIsCRTOn(false);
  }, []);

  const playTransition = useCallback((callback?: () => void) => {
    // Sequence: Turn Off -> Wait -> Callback (change route) -> Turn On
    setIsCRTOn(false);
    
    setTimeout(() => {
      if (callback) callback();
      
      // Small delay to allow new page to mount before turning on
      setTimeout(() => {
        setIsCRTOn(true);
      }, 100);
    }, 800); // Match this with the exit animation duration
  }, []);

  // 已移除：原本的開機動畫初始化邏輯
  // 現在直接從 true 開始，避免黑屏問題
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setIsCRTOn(true);
  //   }, 100);
  //   return () => clearTimeout(timer);
  // }, []);

  return (
    <AnimationContext.Provider value={{ isCRTOn, turnOnCRT, turnOffCRT, playTransition }}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimation() {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
}
