/**
 * Music Player Debug Tool
 * 在瀏覽器 Console 中運行此腳本來診斷音樂播放器問題
 *
 * 使用方式：
 * 1. 開啟瀏覽器 DevTools (F12)
 * 2. 複製此腳本內容到 Console
 * 3. 按 Enter 執行
 */

(function debugMusicPlayer() {
  console.log('='.repeat(60));
  console.log('Music Player Debug Tool');
  console.log('='.repeat(60));

  // 1. 檢查 Zustand Stores
  console.log('\n1. Checking Zustand Stores:');

  try {
    const musicPlayerState = window.__ZUSTAND_STORES__?.musicPlayerStore?.getState?.() || {};
    console.log('  musicPlayerStore:', {
      isPlaying: musicPlayerState.isPlaying,
      currentMode: musicPlayerState.currentMode,
      isDrawerOpen: musicPlayerState.isDrawerOpen,
      lastError: musicPlayerState.lastError,
    });
  } catch (e) {
    console.warn('  ⚠️  Cannot access musicPlayerStore:', e.message);
  }

  try {
    const rhythmEngineState = window.__ZUSTAND_STORES__?.rhythmEngineStore?.getState?.() || {};
    console.log('  rhythmEngineStore:', {
      hasSynth: !!rhythmEngineState.synth,
      hasAudioContext: !!rhythmEngineState.audioContext,
      isInitialized: rhythmEngineState.isInitialized,
      currentStep: rhythmEngineState.currentStep,
      currentLoop: rhythmEngineState.currentLoop,
    });
  } catch (e) {
    console.warn('  ⚠️  Cannot access rhythmEngineStore:', e.message);
  }

  // 2. 檢查 AudioContext
  console.log('\n2. Checking AudioContext:');

  const audioContexts = [];
  try {
    // 嘗試從 window 找到 AudioContext
    for (let key in window) {
      if (window[key] instanceof AudioContext) {
        audioContexts.push({
          key,
          state: window[key].state,
          sampleRate: window[key].sampleRate,
        });
      }
    }

    if (audioContexts.length > 0) {
      console.log('  Found AudioContext instances:', audioContexts);
    } else {
      console.warn('  ⚠️  No AudioContext found in window');
    }
  } catch (e) {
    console.warn('  ⚠️  Error checking AudioContext:', e.message);
  }

  // 3. 檢查 DOM 元素
  console.log('\n3. Checking DOM Elements:');

  const drawerTrigger = document.querySelector('[aria-label="開啟音樂播放器"]');
  const compactPlayer = document.querySelector('[aria-label="展開音樂播放器"]');
  const playButton = document.querySelector('[aria-label*="音樂播放"], [aria-label*="暫停"]');

  console.log('  Drawer Trigger:', drawerTrigger ? '✓ Found' : '✗ Not found');
  console.log('  Compact Player:', compactPlayer ? '✓ Found' : '✗ Not found');
  console.log('  Play Button:', playButton ? '✓ Found' : '✗ Not found');

  if (compactPlayer) {
    const computedStyle = window.getComputedStyle(compactPlayer);
    console.log('  Compact Player styles:', {
      display: computedStyle.display,
      pointerEvents: computedStyle.pointerEvents,
      zIndex: computedStyle.zIndex,
      position: computedStyle.position,
    });
  }

  // 4. 檢查事件監聽器
  console.log('\n4. Testing Event Handlers:');

  if (playButton) {
    console.log('  Play Button element:', playButton);
    console.log('  Play Button computed style:', {
      pointerEvents: window.getComputedStyle(playButton).pointerEvents,
      cursor: window.getComputedStyle(playButton).cursor,
    });

    // 測試點擊事件
    console.log('  💡 Try clicking the button manually and watch the console for state changes');
  }

  // 5. 檢查 System Presets
  console.log('\n5. Checking System Presets:');

  try {
    const rhythmPlaylistState = window.__ZUSTAND_STORES__?.rhythmPlaylistStore?.getState?.() || {};
    const presets = rhythmPlaylistState.systemPresets || [];
    console.log('  System Presets loaded:', presets.length, 'patterns');
    if (presets.length > 0) {
      console.log('  First preset:', presets[0]?.name);
    } else {
      console.warn('  ⚠️  No system presets loaded! Music cannot play without patterns.');
    }
  } catch (e) {
    console.warn('  ⚠️  Cannot check system presets:', e.message);
  }

  // 6. 提供測試命令
  console.log('\n6. Manual Test Commands:');
  console.log('  Run these commands to test manually:');
  console.log('  ');
  console.log('  // Resume music');
  console.log('  window.__ZUSTAND_STORES__?.musicPlayerStore?.getState?.().resume()');
  console.log('  ');
  console.log('  // Pause music');
  console.log('  window.__ZUSTAND_STORES__?.musicPlayerStore?.getState?.().pause()');
  console.log('  ');
  console.log('  // Open drawer');
  console.log('  window.__ZUSTAND_STORES__?.musicPlayerStore?.getState?.().openDrawer()');

  console.log('\n' + '='.repeat(60));
  console.log('Debug complete. Check the output above for issues.');
  console.log('='.repeat(60));
})();
