'use client';

/**
 * TTS 測試頁面
 * 用於測試所有 14 個角色的語音效果
 */

import React, { useState, useEffect } from 'react';
import { SpeechEngine } from '@/lib/audio/SpeechEngine';
import { DEFAULT_VOICE_CONFIGS } from '@/lib/audio/constants';
import type { CharacterVoice } from '@/lib/audio/types';
import { VOICES } from '@/data/voices';
import { PixelIcon } from '@/components/ui/icons';

// 預設測試文字
const DEFAULT_TEST_TEXTS: Record<CharacterVoice, string> = {
  pip_boy: '系統初始化完成。歡迎使用廢土塔羅系統。正在分析卡牌數據。',
  vault_dweller: '哇！外面的世界真是太令人興奮了！我從來沒見過這樣的景色！',
  wasteland_trader: '這個解讀值一百瓶蓋，不二價。要不要順便看看我這裡的其他商品？',
  codsworth: '很榮幸為您服務，先生或女士。請允許我為您解讀這張塔羅牌。',
  super_mutant: '強大！簡單！直接！這張牌告訴你要變得更強！',
  ghoul: '經歷了這麼多年，我見過太多事情了。這張牌的意義我再清楚不過。',
  raider: '聽好了！這是我的地盤！這張牌說你最好小心點！',
  brotherhood_scribe: '根據技術記錄，這個解讀相當準確。讓我為您詳細說明。',
  brotherhood_paladin: '鋼鐵兄弟會永遠守護人類文明。這張牌象徵著榮譽與紀律。',
  ncr_ranger: '巡邏報告：一切正常。根據我的經驗，這張牌代表秩序與正義。',
  legion_centurion: '軍團的榮耀高於一切！服從命令！這張牌告訴你什麼是真正的力量！',
  minuteman: '人民的安全是我們的責任。這張牌提醒我們要保護弱小。',
  railroad_agent: '保持低調，不要引起懷疑。這張牌告訴我們要謹慎行事。',
  institute_scientist: '科學研究顯示，這個結果十分有趣。讓我用理性分析這張牌。',
};

export default function TestTTSPage() {
  const [speechEngine] = useState(() => SpeechEngine.getInstance());
  const [selectedVoice, setSelectedVoice] = useState<CharacterVoice>('pip_boy');
  const [customText, setCustomText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingVoice, setCurrentPlayingVoice] = useState<CharacterVoice | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [systemVoiceInfo, setSystemVoiceInfo] = useState<{
    name: string;
    lang: string;
    localService: boolean;
  } | null>(null);
  const [availableVoicesCount, setAvailableVoicesCount] = useState(0);

  // 初始化語音引擎
  useEffect(() => {
    const init = async () => {
      await speechEngine.initialize();
      setIsInitialized(true);
      const voices = speechEngine.getAvailableVoices();
      setAvailableVoicesCount(voices.length);
      updateSystemVoiceInfo(selectedVoice);
    };
    init();
  }, []);

  // 當選擇的角色改變時，更新系統語音資訊
  useEffect(() => {
    if (isInitialized) {
      updateSystemVoiceInfo(selectedVoice);
      setCustomText(DEFAULT_TEST_TEXTS[selectedVoice]);
    }
  }, [selectedVoice, isInitialized]);

  /**
   * 更新系統語音資訊
   */
  const updateSystemVoiceInfo = (character: CharacterVoice) => {
    const voiceSelector = speechEngine.getVoiceSelector();
    const systemVoice = voiceSelector.selectBestVoice(character);
    if (systemVoice) {
      setSystemVoiceInfo({
        name: systemVoice.name,
        lang: systemVoice.lang,
        localService: systemVoice.localService,
      });
    } else {
      setSystemVoiceInfo(null);
    }
  };

  /**
   * 播放測試語音
   */
  const handlePlay = (voice: CharacterVoice, text?: string) => {
    if (isPlaying) {
      speechEngine.stop();
      setIsPlaying(false);
      setCurrentPlayingVoice(null);
      return;
    }

    const textToSpeak = text || customText || DEFAULT_TEST_TEXTS[voice];
    setIsPlaying(true);
    setCurrentPlayingVoice(voice);

    speechEngine.speak(textToSpeak, {
      voice,
      onComplete: () => {
        setIsPlaying(false);
        setCurrentPlayingVoice(null);
      },
      onError: (error) => {
        console.error('TTS Error:', error);
        setIsPlaying(false);
        setCurrentPlayingVoice(null);
      },
    });
  };

  /**
   * 停止播放
   */
  const handleStop = () => {
    speechEngine.stop();
    setIsPlaying(false);
    setCurrentPlayingVoice(null);
  };

  /**
   * 測試所有角色（依序播放）
   */
  const handleTestAll = async () => {
    if (isPlaying) {
      handleStop();
      return;
    }

    for (const voiceInfo of VOICES) {
      if (isPlaying) break; // 如果用戶停止，中斷循環

      await new Promise<void>((resolve) => {
        const text = DEFAULT_TEST_TEXTS[voiceInfo.value];
        setCurrentPlayingVoice(voiceInfo.value);
        setIsPlaying(true);

        speechEngine.speak(text, {
          voice: voiceInfo.value,
          onComplete: () => {
            resolve();
          },
          onError: () => {
            resolve();
          },
        });
      });

      // 每個角色間隔 500ms
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsPlaying(false);
    setCurrentPlayingVoice(null);
  };

  const voiceConfig = DEFAULT_VOICE_CONFIGS[selectedVoice];
  const voiceInfo = VOICES.find((v) => v.value === selectedVoice);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-pip-boy-green flex items-center gap-3">
          <PixelIcon name="loader" animation="spin" sizePreset="md" decorative />
          <span>正在初始化語音系統...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-pip-boy-green p-6">
      {/* 標題 */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-pip-boy-green/30 pb-4">
          <div className="flex items-center gap-3">
            <PixelIcon name="voice" sizePreset="lg" variant="primary" decorative />
            <h1 className="text-3xl font-bold">TTS 語音測試中心</h1>
          </div>
          <div className="text-sm text-pip-boy-green/60">
            系統語音數量: {availableVoicesCount}
          </div>
        </div>

        {/* 主要控制區 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：角色選擇與控制 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 角色選擇 */}
            <div className="border border-pip-boy-green/30 rounded-lg p-4 bg-black/50">
              <label htmlFor="voice-select" className="block text-sm font-medium mb-2">
                選擇角色
              </label>
              <select
                id="voice-select"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value as CharacterVoice)}
                className="w-full px-3 py-2 bg-black/70 border border-pip-boy-green/50
                           rounded text-pip-boy-green hover:border-pip-boy-green
                           focus:outline-none focus:ring-2 focus:ring-pip-boy-green/50"
              >
                <optgroup label="通用角色">
                  <option value="pip_boy">Pip-Boy</option>
                  <option value="vault_dweller">避難所居民</option>
                  <option value="wasteland_trader">廢土商人</option>
                  <option value="codsworth">Codsworth</option>
                </optgroup>
                <optgroup label="廢土生物與掠奪者">
                  <option value="super_mutant">超級變種人</option>
                  <option value="ghoul">屍鬼</option>
                  <option value="raider">掠奪者</option>
                </optgroup>
                <optgroup label="鋼鐵兄弟會">
                  <option value="brotherhood_scribe">兄弟會書記員</option>
                  <option value="brotherhood_paladin">兄弟會聖騎士</option>
                </optgroup>
                <optgroup label="其他陣營">
                  <option value="ncr_ranger">NCR 遊騎兵</option>
                  <option value="legion_centurion">軍團百夫長</option>
                  <option value="minuteman">民兵</option>
                  <option value="railroad_agent">鐵路特工</option>
                  <option value="institute_scientist">學院科學家</option>
                </optgroup>
              </select>
            </div>

            {/* 角色資訊卡 */}
            {voiceInfo && (
              <div className="border border-pip-boy-green/30 rounded-lg p-4 bg-black/50 space-y-3">
                <div className="flex items-center gap-2">
                  <PixelIcon name="info" sizePreset="sm" variant="primary" decorative />
                  <h3 className="font-bold">{voiceInfo.label}</h3>
                </div>
                <p className="text-sm text-pip-boy-green/70">{voiceInfo.description}</p>
                <div className="text-xs text-pip-boy-green/50">
                  個性：{voiceInfo.personality}
                </div>

                {/* 語音參數 */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-pip-boy-green/20">
                  <div className="text-xs">
                    <span className="text-pip-boy-green/60">音高：</span>
                    <span className="ml-1 text-pip-boy-green font-mono">
                      {voiceConfig.pitch.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-pip-boy-green/60">語速：</span>
                    <span className="ml-1 text-pip-boy-green font-mono">
                      {voiceConfig.rate.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-pip-boy-green/60">音量：</span>
                    <span className="ml-1 text-pip-boy-green font-mono">
                      {voiceConfig.volume.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-pip-boy-green/60">效果：</span>
                    <span className="ml-1 text-pip-boy-green font-mono">
                      {voiceConfig.effects?.join(', ') || 'none'}
                    </span>
                  </div>
                </div>

                {/* 系統語音資訊 */}
                {systemVoiceInfo && (
                  <div className="pt-2 border-t border-pip-boy-green/20">
                    <div className="flex items-center gap-1 mb-1">
                      <PixelIcon name="settings" sizePreset="xs" variant="muted" decorative />
                      <span className="text-xs text-pip-boy-green/60">系統語音：</span>
                    </div>
                    <div className="text-xs text-pip-boy-green/80 ml-4 space-y-1">
                      <div>{systemVoiceInfo.name}</div>
                      <div className="text-pip-boy-green/50">
                        語言: {systemVoiceInfo.lang} |{' '}
                        {systemVoiceInfo.localService ? '本地' : '遠端'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 控制按鈕 */}
            <div className="space-y-2">
              <button
                onClick={() => handlePlay(selectedVoice)}
                disabled={!customText && !DEFAULT_TEST_TEXTS[selectedVoice]}
                className="w-full px-4 py-3 bg-pip-boy-green/10 border border-pip-boy-green/50
                           rounded text-pip-boy-green hover:bg-pip-boy-green/20
                           hover:border-pip-boy-green disabled:opacity-50
                           disabled:cursor-not-allowed transition-all
                           flex items-center justify-center gap-2 font-medium"
              >
                <PixelIcon
                  name={isPlaying && currentPlayingVoice === selectedVoice ? 'stop' : 'play'}
                  sizePreset="sm"
                  variant="primary"
                  animation={
                    isPlaying && currentPlayingVoice === selectedVoice ? 'pulse' : undefined
                  }
                  decorative
                />
                {isPlaying && currentPlayingVoice === selectedVoice ? '停止播放' : '播放測試'}
              </button>

              <button
                onClick={handleTestAll}
                className="w-full px-4 py-2 bg-radiation-orange/10 border border-radiation-orange/50
                           rounded text-radiation-orange hover:bg-radiation-orange/20
                           hover:border-radiation-orange transition-all
                           flex items-center justify-center gap-2 text-sm"
              >
                <PixelIcon
                  name="list"
                  sizePreset="xs"
                  variant="secondary"
                  animation={isPlaying ? 'pulse' : undefined}
                  decorative
                />
                {isPlaying ? '停止全部測試' : '測試所有角色'}
              </button>
            </div>
          </div>

          {/* 右側：測試文字編輯器 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 自訂測試文字 */}
            <div className="border border-pip-boy-green/30 rounded-lg p-4 bg-black/50">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="custom-text" className="text-sm font-medium">
                  測試文字
                </label>
                <button
                  onClick={() => setCustomText(DEFAULT_TEST_TEXTS[selectedVoice])}
                  className="text-xs text-pip-boy-green/60 hover:text-pip-boy-green
                             transition-colors"
                >
                  重置為預設
                </button>
              </div>
              <textarea
                id="custom-text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={6}
                placeholder="輸入要測試的文字..."
                className="w-full px-3 py-2 bg-black/70 border border-pip-boy-green/50
                           rounded text-pip-boy-green placeholder-pip-boy-green/30
                           hover:border-pip-boy-green focus:outline-none
                           focus:ring-2 focus:ring-pip-boy-green/50 resize-none"
              />
              <div className="text-xs text-pip-boy-green/50 mt-2">
                字數: {customText.length}
              </div>
            </div>

            {/* 快速測試所有角色 */}
            <div className="border border-pip-boy-green/30 rounded-lg p-4 bg-black/50">
              <div className="flex items-center gap-2 mb-3">
                <PixelIcon name="list" sizePreset="sm" variant="primary" decorative />
                <h3 className="font-bold">所有角色快速測試</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {VOICES.map((voice) => (
                  <button
                    key={voice.value}
                    onClick={() => handlePlay(voice.value, DEFAULT_TEST_TEXTS[voice.value])}
                    disabled={isPlaying && currentPlayingVoice !== voice.value}
                    className={`
                      px-3 py-2 border rounded text-sm transition-all
                      ${
                        currentPlayingVoice === voice.value
                          ? 'bg-pip-boy-green/20 border-pip-boy-green text-pip-boy-green'
                          : 'bg-black/50 border-pip-boy-green/30 text-pip-boy-green/70 hover:bg-pip-boy-green/10 hover:border-pip-boy-green/50'
                      }
                      disabled:opacity-30 disabled:cursor-not-allowed
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <PixelIcon
                        name={currentPlayingVoice === voice.value ? 'stop' : 'play'}
                        sizePreset="xs"
                        variant={currentPlayingVoice === voice.value ? 'primary' : 'muted'}
                        animation={currentPlayingVoice === voice.value ? 'pulse' : undefined}
                        decorative
                      />
                      <span className="truncate">{voice.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 使用說明 */}
            <div className="border border-pip-boy-green/30 rounded-lg p-4 bg-black/50">
              <div className="flex items-center gap-2 mb-2">
                <PixelIcon name="info" sizePreset="sm" variant="primary" decorative />
                <h3 className="font-bold text-sm">使用說明</h3>
              </div>
              <ul className="text-xs text-pip-boy-green/70 space-y-1 list-disc list-inside">
                <li>選擇角色後會自動載入該角色的預設測試文字</li>
                <li>可以在「測試文字」區域自訂要朗讀的內容</li>
                <li>點擊「播放測試」按鈕試聽當前選定角色</li>
                <li>點擊「測試所有角色」可依序播放所有 14 個角色</li>
                <li>在「所有角色快速測試」區域可快速點擊測試任一角色</li>
                <li>系統語音資訊顯示智能選擇的實際系統語音</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 底部狀態列 */}
        {isPlaying && (
          <div className="fixed bottom-0 left-0 right-0 bg-pip-boy-green/10 border-t border-pip-boy-green/30 p-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PixelIcon name="voice" animation="pulse" sizePreset="md" variant="primary" decorative />
                <div>
                  <div className="text-sm font-medium">
                    正在播放: {VOICES.find((v) => v.value === currentPlayingVoice)?.label}
                  </div>
                  <div className="text-xs text-pip-boy-green/60">
                    音高: {DEFAULT_VOICE_CONFIGS[currentPlayingVoice!].pitch.toFixed(2)} | 語速:{' '}
                    {DEFAULT_VOICE_CONFIGS[currentPlayingVoice!].rate.toFixed(2)}
                  </div>
                </div>
              </div>
              <button
                onClick={handleStop}
                className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded
                           text-red-400 hover:bg-red-500/30 hover:border-red-500
                           transition-all flex items-center gap-2"
              >
                <PixelIcon name="stop" sizePreset="xs" decorative />
                停止
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
