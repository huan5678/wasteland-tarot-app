/**
 * Font Load Monitor
 * 字體載入監控元件
 *
 * 使用 document.fonts API 和 Performance API 監控字體載入狀態
 * 僅在開發環境輸出監控資訊
 * Requirements: cubic-11-font-integration Task 18
 */

'use client';

import { useEffect } from 'react';

export function FontLoadMonitor() {
  useEffect(() => {
    // 僅在開發環境和瀏覽器環境中執行
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
      return;
    }

    const monitorFontLoading = async () => {
      const startTime = performance.now();

      try {
        // 等待所有字體載入完成
        await document.fonts.ready;
        const endTime = performance.now();
        const loadTime = endTime - startTime;

        // 檢查 Cubic 11 字體是否成功載入
        const cubic11Font = Array.from(document.fonts.values()).find(
          (font) => font.family === 'Cubic 11'
        );

        if (cubic11Font) {
          console.group('🎨 Font Load Monitor');
          console.log('✅ Cubic 11 字體載入成功');
          console.log(`📊 載入狀態: ${cubic11Font.status}`);
          console.log(`⏱️  載入時間: ${loadTime.toFixed(2)}ms`);
          console.groupEnd();

          // 使用 Performance API 記錄字體載入時間
          if (performance.mark) {
            performance.mark('cubic-11-loaded');
            performance.measure('cubic-11-load-time', 'navigationStart', 'cubic-11-loaded');

            const measures = performance.getEntriesByName('cubic-11-load-time');
            if (measures.length > 0) {
              console.log(`📈 Performance Measure: ${measures[0].duration.toFixed(2)}ms`);
            }
          }
        } else {
          console.group('⚠️  Font Load Monitor');
          console.warn('Cubic 11 字體未找到');
          console.log('已載入的字體:', Array.from(document.fonts.values()).map(f => f.family));
          console.groupEnd();
        }

        // 檢查是否有字體載入失敗
        const failedFonts = Array.from(document.fonts.values()).filter(
          (font) => font.status === 'error'
        );

        if (failedFonts.length > 0) {
          console.group('❌ Font Load Errors');
          failedFonts.forEach((font) => {
            console.error(`載入失敗: ${font.family}`);
          });
          console.groupEnd();
        }

      } catch (error) {
        console.group('❌ Font Load Monitor Error');
        console.error('字體載入監控失敗:', error);
        console.groupEnd();
      }

      // 監控字體載入超時（超過 3 秒）
      const timeoutId = setTimeout(() => {
        if (document.fonts.status !== 'loaded') {
          console.group('⏰ Font Load Timeout Warning');
          console.warn('字體載入超過 3 秒，可能影響使用者體驗');
          console.log(`當前狀態: ${document.fonts.status}`);
          console.groupEnd();
        }
      }, 3000);

      // 清理 timeout
      await document.fonts.ready;
      clearTimeout(timeoutId);
    };

    // 執行監控
    monitorFontLoading();

    // 監聽字體載入事件
    const handleFontLoad = (event: Event) => {
      const fontFace = (event as any).fontface;
      if (fontFace && fontFace.family === 'Cubic 11') {
        console.log('✅ Cubic 11 字體載入事件觸發');
      }
    };

    const handleFontLoadError = (event: Event) => {
      const fontFace = (event as any).fontface;
      if (fontFace && fontFace.family === 'Cubic 11') {
        console.error('❌ Cubic 11 字體載入失敗事件:', event);
      }
    };

    document.fonts.addEventListener('loading', handleFontLoad);
    document.fonts.addEventListener('loadingerror', handleFontLoadError);

    return () => {
      document.fonts.removeEventListener('loading', handleFontLoad);
      document.fonts.removeEventListener('loadingerror', handleFontLoadError);
    };
  }, []);

  // 此元件不渲染任何 UI
  return null;
}
