'use client';

/**
 * Google Cloud TTS 測試頁面
 * 測試所有 14 個角色的語音合成功能
 */

import React, { useState } from 'react';
import { PixelIcon } from '@/components/ui/icons';

// 角色配置（從 voices.ts 和 constants.ts 整合）
import { Button } from "@/components/ui/button";const CHARACTERS = [
// 通用角色
{ key: 'pip_boy', name: 'Pip-Boy', group: '通用角色', description: '系統助理', sampleText: '系統初始化完成。歡迎使用廢土塔羅系統。' },
{ key: 'vault_dweller', name: '避難所居民', group: '通用角色', description: '年輕樂觀', sampleText: '哇！外面的世界真是太令人興奮了！' },
{ key: 'wasteland_trader', name: '廢土商人', group: '通用角色', description: '成熟務實', sampleText: '這個解讀值 100 瓶蓋，不二價。' },
{ key: 'codsworth', name: 'Codsworth', group: '通用角色', description: '英式管家機器人', sampleText: '很榮幸為您服務，先生/女士。' },
// 廢土生物與掠奪者
{ key: 'super_mutant', name: '超級變種人', group: '廢土生物', description: '強大威嚇', sampleText: '強大！簡單！直接！' },
{ key: 'ghoul', name: '屍鬼', group: '廢土生物', description: '歷經滄桑', sampleText: '經歷了這麼多年，我見過太多事情了。' },
{ key: 'raider', name: '掠奪者', group: '廢土生物', description: '粗暴兇狠', sampleText: '聽好了！這是我的地盤！' },
// 鋼鐵兄弟會
{ key: 'brotherhood_scribe', name: '兄弟會書記員', group: '鋼鐵兄弟會', description: '學術知性', sampleText: '根據技術記錄，這個解讀相當準確。' },
{ key: 'brotherhood_paladin', name: '兄弟會聖騎士', group: '鋼鐵兄弟會', description: '威嚴榮譽', sampleText: '鋼鐵兄弟會永遠守護人類文明。' },
// 其他陣營
{ key: 'ncr_ranger', name: 'NCR 遊騎兵', group: '其他陣營', description: '專業可靠', sampleText: '巡邏報告：一切正常。' },
{ key: 'legion_centurion', name: '軍團百夫長', group: '其他陣營', description: '權威嚴格', sampleText: '軍團的榮耀高於一切！服從命令！' },
{ key: 'minuteman', name: '民兵', group: '其他陣營', description: '正義感', sampleText: '人民的安全是我們的責任。' },
{ key: 'railroad_agent', name: '鐵路特工', group: '其他陣營', description: '神秘謹慎', sampleText: '保持低調，不要引起懷疑。' },
{ key: 'institute_scientist', name: '學院科學家', group: '其他陣營', description: '知性理性', sampleText: '科學研究顯示，這個結果十分有趣。' }];


interface AudioState {
  isLoading: boolean;
  isPlaying: boolean;
  audioUrl: string | null;
  duration: number;
  fileSize: number;
  cached: boolean;
  source: string;
  error: string | null;
}

export default function TestTTSCloudPage() {
  const [customText, setCustomText] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [audioStates, setAudioStates] = useState<Record<string, AudioState>>({});
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  /**
   * 播放角色語音（使用範例文字）
   */
  const handlePlaySample = async (characterKey: string) => {
    const character = CHARACTERS.find((c) => c.key === characterKey);
    if (!character) return;

    await synthesizeAndPlay(characterKey, character.sampleText);
  };

  /**
   * 播放自訂文字
   */
  const handlePlayCustom = async () => {
    if (!selectedCharacter || !customText.trim()) {
      alert('請選擇角色並輸入文字');
      return;
    }

    await synthesizeAndPlay(selectedCharacter, customText);
  };

  /**
   * 合成並播放語音
   */
  const synthesizeAndPlay = async (characterKey: string, text: string) => {
    // 停止當前播放
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }

    // 設定載入狀態
    setAudioStates((prev) => ({
      ...prev,
      [characterKey]: {
        isLoading: true,
        isPlaying: false,
        audioUrl: null,
        duration: 0,
        fileSize: 0,
        cached: false,
        source: '',
        error: null
      }
    }));

    try {
      // 呼叫 TTS API
      const response = await fetch('/api/v1/audio/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          character_key: characterKey,
          audio_type: 'ai_response',
          cache_enabled: true,
          return_format: 'url'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'TTS synthesis failed');
      }

      const data = await response.json();

      // 更新狀態
      setAudioStates((prev) => ({
        ...prev,
        [characterKey]: {
          isLoading: false,
          isPlaying: false,
          audioUrl: data.url,
          duration: data.duration,
          fileSize: data.file_size,
          cached: data.cached,
          source: data.source,
          error: null
        }
      }));

      // 播放音檔
      const audio = new Audio(data.url);
      audio.onplay = () => {
        setAudioStates((prev) => ({
          ...prev,
          [characterKey]: { ...prev[characterKey], isPlaying: true }
        }));
      };
      audio.onended = () => {
        setAudioStates((prev) => ({
          ...prev,
          [characterKey]: { ...prev[characterKey], isPlaying: false }
        }));
        setCurrentAudio(null);
      };
      audio.onerror = () => {
        setAudioStates((prev) => ({
          ...prev,
          [characterKey]: {
            ...prev[characterKey],
            isPlaying: false,
            error: 'Audio playback failed'
          }
        }));
        setCurrentAudio(null);
      };

      audio.play();
      setCurrentAudio(audio);

    } catch (error) {
      console.error('TTS synthesis error:', error);
      setAudioStates((prev) => ({
        ...prev,
        [characterKey]: {
          isLoading: false,
          isPlaying: false,
          audioUrl: null,
          duration: 0,
          fileSize: 0,
          cached: false,
          source: '',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };

  /**
   * 停止播放
   */
  const handleStop = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
  };

  // 按群組分類角色
  const groupedCharacters = CHARACTERS.reduce((acc, char) => {
    if (!acc[char.group]) {
      acc[char.group] = [];
    }
    acc[char.group].push(char);
    return acc;
  }, {} as Record<string, typeof CHARACTERS>);

  return (
    <div className="min-h-screen bg-black text-pip-boy-green p-8">
      <div className="max-w-6xl mx-auto">
        {/* 標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <PixelIcon name="radio" sizePreset="md" variant="primary" decorative />
            Google Cloud TTS 測試頁面
          </h1>
          <p className="text-pip-boy-green/60">測試所有 14 個 Fallout 角色的語音合成功能</p>
        </div>

        {/* 自訂文字測試區 */}
        <div className="mb-8 p-6 border border-pip-boy-green/30 rounded-lg bg-black/50">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <PixelIcon name="edit" sizePreset="sm" variant="primary" decorative />
            自訂文字測試
          </h2>

          <div className="space-y-4">
            {/* 角色選擇 */}
            <div>
              <label className="block text-sm mb-2">選擇角色</label>
              <select
                value={selectedCharacter || ''}
                onChange={(e) => setSelectedCharacter(e.target.value)}
                className="w-full px-3 py-2 bg-black/70 border border-pip-boy-green/50 rounded text-pip-boy-green">

                <option value="">-- 選擇角色 --</option>
                {CHARACTERS.map((char) =>
                <option key={char.key} value={char.key}>
                    {char.name} ({char.description})
                  </option>
                )}
              </select>
            </div>

            {/* 文字輸入 */}
            <div>
              <label className="block text-sm mb-2">輸入文字</label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="輸入要合成的文字..."
                rows={4}
                maxLength={500}
                className="w-full px-3 py-2 bg-black/70 border border-pip-boy-green/50 rounded text-pip-boy-green resize-none" />

              <div className="text-xs text-pip-boy-green/60 mt-1">
                {customText.length}/500 字元
              </div>
            </div>

            {/* 播放按鈕 */}
            <div className="flex gap-3">
              <Button size="default" variant="outline"
              onClick={handlePlayCustom}
              disabled={!selectedCharacter || !customText.trim()}
              className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">

                <PixelIcon name="play" sizePreset="xs" variant="primary" decorative />
                播放自訂文字
              </Button>

              {currentAudio &&
              <Button size="default" variant="outline"
              onClick={handleStop}
              className="px-4 py-2 border rounded flex items-center gap-2">

                  <PixelIcon name="stop" sizePreset="xs" variant="error" decorative />
                  停止播放
                </Button>
              }
            </div>
          </div>
        </div>

        {/* 角色列表 */}
        {Object.entries(groupedCharacters).map(([group, characters]) =>
        <div key={group} className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-pip-boy-green/80">{group}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {characters.map((character) => {
              const state = audioStates[character.key] || {
                isLoading: false,
                isPlaying: false,
                audioUrl: null,
                duration: 0,
                fileSize: 0,
                cached: false,
                source: '',
                error: null
              };

              return (
                <div
                  key={character.key}
                  className="p-4 border border-pip-boy-green/30 rounded-lg bg-black/50 hover:border-pip-boy-green/50 transition-colors">

                    {/* 角色資訊 */}
                    <div className="mb-3">
                      <h3 className="text-lg font-bold">{character.name}</h3>
                      <p className="text-sm text-pip-boy-green/60">{character.description}</p>
                    </div>

                    {/* 範例文字 */}
                    <div className="mb-3 p-2 bg-black/50 rounded border border-pip-boy-green/20">
                      <p className="text-xs text-pip-boy-green/80 italic">
                        「{character.sampleText}」
                      </p>
                    </div>

                    {/* 播放按鈕 */}
                    <Button size="icon" variant="outline"
                  onClick={() => handlePlaySample(character.key)}
                  disabled={state.isLoading}
                  className="w-full px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">

                      {state.isLoading ?
                    <>
                          <PixelIcon name="loader" sizePreset="xs" animation="spin" decorative />
                          <span>合成中...</span>
                        </> :
                    state.isPlaying ?
                    <>
                          <PixelIcon name="pause" sizePreset="xs" animation="pulse" decorative />
                          <span>播放中...</span>
                        </> :

                    <>
                          <PixelIcon name="play" sizePreset="xs" decorative />
                          <span>試聽語音</span>
                        </>
                    }
                    </Button>

                    {/* 狀態資訊 */}
                    {state.audioUrl && !state.error &&
                  <div className="mt-3 text-xs text-pip-boy-green/60 space-y-1">
                        <div className="flex justify-between">
                          <span>時長:</span>
                          <span>{state.duration.toFixed(1)}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>大小:</span>
                          <span>{(state.fileSize / 1024).toFixed(1)} KB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>來源:</span>
                          <span className="flex items-center gap-1">
                            {state.cached &&
                        <PixelIcon name="flash" sizePreset="xs" variant="success" decorative />
                        }
                            {state.source === 'redis' && '快取 (Redis)'}
                            {state.source === 'db' && '快取 (DB)'}
                            {state.source === 'new' && '新生成'}
                          </span>
                        </div>
                      </div>
                  }

                    {/* 錯誤訊息 */}
                    {state.error &&
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/50 rounded text-xs text-red-500">
                        <PixelIcon name="alert" sizePreset="xs" variant="error" decorative />
                        {state.error}
                      </div>
                  }
                  </div>);

            })}
            </div>
          </div>
        )}
      </div>
    </div>);

}