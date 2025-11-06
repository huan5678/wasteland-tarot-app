'use client';

/**
 * VoiceSelector - 增強型角色語音選擇器
 * 需求 2.3: 角色語音選擇
 *
 * 功能：
 * - 支援全部 14 個 Fallout 角色
 * - 語音預覽（試聽）功能
 * - 顯示智能選擇的語音資訊
 * - 顯示語音參數（pitch, rate）
 */

import React, { useState, useEffect } from 'react';
import { useAudioStore } from '@/lib/audio/audioStore';
import { SpeechEngine } from '@/lib/audio/SpeechEngine';
import { DEFAULT_VOICE_CONFIGS } from '@/lib/audio/constants';
import type { CharacterVoice } from '@/lib/audio/types';
import { VOICES } from '@/data/voices';
import { PixelIcon } from '@/components/ui/icons';

/**
 * 試聽範例文字（簡短且富有角色特色）
 */import { Button } from "@/components/ui/button";
const PREVIEW_TEXTS: Record<CharacterVoice, string> = {
  pip_boy: '系統初始化完成。歡迎使用廢土塔羅系統。',
  vault_dweller: '哇！外面的世界真是太令人興奮了！',
  wasteland_trader: '這個解讀值 100 瓶蓋，不二價。',
  codsworth: '很榮幸為您服務，先生/女士。',
  super_mutant: '強大！簡單！直接！',
  ghoul: '經歷了這麼多年，我見過太多事情了。',
  raider: '聽好了！這是我的地盤！',
  brotherhood_scribe: '根據技術記錄，這個解讀相當準確。',
  brotherhood_paladin: '鋼鐵兄弟會永遠守護人類文明。',
  ncr_ranger: '巡邏報告：一切正常。',
  legion_centurion: '軍團的榮耀高於一切！服從命令！',
  minuteman: '人民的安全是我們的責任。',
  railroad_agent: '保持低調，不要引起懷疑。',
  institute_scientist: '科學研究顯示，這個結果十分有趣。'
};

export function VoiceSelector() {
  const { selectedVoice, setSelectedVoice } = useAudioStore();
  const [speechEngine] = useState(() => SpeechEngine.getInstance());
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [selectedSystemVoice, setSelectedSystemVoice] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化語音引擎
  useEffect(() => {
    const init = async () => {
      await speechEngine.initialize();
      setIsInitialized(true);
      updateSelectedVoice(selectedVoice);
    };
    init();
  }, []);

  // 當選擇的角色改變時，更新系統語音資訊
  useEffect(() => {
    if (isInitialized) {
      updateSelectedVoice(selectedVoice);
    }
  }, [selectedVoice, isInitialized]);

  /**
   * 更新選定角色的系統語音資訊
   */
  const updateSelectedVoice = (character: CharacterVoice) => {
    const voiceSelector = speechEngine.getVoiceSelector();
    const systemVoice = voiceSelector.selectBestVoice(character);
    if (systemVoice) {
      setSelectedSystemVoice(`${systemVoice.name} (${systemVoice.lang})`);
    } else {
      setSelectedSystemVoice('系統預設');
    }
  };

  /**
   * 處理角色變更
   */
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVoice = e.target.value as CharacterVoice;
    setSelectedVoice(newVoice);
  };

  /**
   * 語音預覽（試聽）
   */
  const handlePreview = () => {
    if (isPreviewing) {
      speechEngine.stop();
      setIsPreviewing(false);
      return;
    }

    const previewText = PREVIEW_TEXTS[selectedVoice];
    setIsPreviewing(true);

    speechEngine.speak(previewText, {
      voice: selectedVoice,
      onComplete: () => {
        setIsPreviewing(false);
      },
      onError: () => {
        setIsPreviewing(false);
      }
    });
  };

  /**
   * 獲取當前角色的語音配置
   */
  const voiceConfig = DEFAULT_VOICE_CONFIGS[selectedVoice];
  const voiceInfo = VOICES.find((v) => v.value === selectedVoice);

  if (!voiceInfo) return null;

  return (
    <div className="space-y-4 p-4 border border-pip-boy-green/30 rounded-lg bg-black/50">
      {/* 標題 */}
      <div className="flex items-center gap-2">
        <PixelIcon name="voice" sizePreset="sm" variant="primary" decorative />
        <h3 className="text-pip-boy-green font-bold">角色語音選擇</h3>
      </div>

      {/* 角色選擇下拉選單 */}
      <div className="space-y-2">
        <label htmlFor="voice-select" className="text-sm text-pip-boy-green/80">
          選擇角色
        </label>
        <select
          id="voice-select"
          value={selectedVoice}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-black/70 border border-pip-boy-green/50
                     rounded text-pip-boy-green hover:border-pip-boy-green
                     focus:outline-none focus:ring-2 focus:ring-pip-boy-green/50
                     transition-colors"



          aria-label="選擇角色語音">

          {/* 通用角色 */}
          <optgroup label="通用角色">
            <option value="pip_boy">Pip-Boy</option>
            <option value="vault_dweller">避難所居民</option>
            <option value="wasteland_trader">廢土商人</option>
            <option value="codsworth">Codsworth</option>
          </optgroup>

          {/* 廢土生物與掠奪者 */}
          <optgroup label="廢土生物與掠奪者">
            <option value="super_mutant">超級變種人</option>
            <option value="ghoul">屍鬼</option>
            <option value="raider">掠奪者</option>
          </optgroup>

          {/* 鋼鐵兄弟會 */}
          <optgroup label="鋼鐵兄弟會">
            <option value="brotherhood_scribe">兄弟會書記員</option>
            <option value="brotherhood_paladin">兄弟會聖騎士</option>
          </optgroup>

          {/* 其他陣營 */}
          <optgroup label="其他陣營">
            <option value="ncr_ranger">NCR 遊騎兵</option>
            <option value="legion_centurion">軍團百夫長</option>
            <option value="minuteman">民兵</option>
            <option value="railroad_agent">鐵路特工</option>
            <option value="institute_scientist">學院科學家</option>
          </optgroup>
        </select>
      </div>

      {/* 角色資訊 */}
      <div className="space-y-2 p-3 bg-black/50 rounded border border-pip-boy-green/20">
        <div className="flex items-start gap-2">
          <PixelIcon name="info" sizePreset="xs" variant="primary" decorative />
          <div className="flex-1 space-y-1">
            <p className="text-sm text-pip-boy-green font-medium">{voiceInfo.label}</p>
            <p className="text-xs text-pip-boy-green/60">{voiceInfo.description}</p>
            <p className="text-xs text-pip-boy-green/50">個性：{voiceInfo.personality}</p>
          </div>
        </div>
      </div>

      {/* 語音參數資訊 */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-black/50 rounded border border-pip-boy-green/20">
          <span className="text-pip-boy-green/60">音高：</span>
          <span className="text-pip-boy-green ml-1">{voiceConfig.pitch.toFixed(2)}</span>
        </div>
        <div className="p-2 bg-black/50 rounded border border-pip-boy-green/20">
          <span className="text-pip-boy-green/60">語速：</span>
          <span className="text-pip-boy-green ml-1">{voiceConfig.rate.toFixed(2)}</span>
        </div>
      </div>

      {/* 系統語音資訊 */}
      {isInitialized &&
      <div className="p-2 bg-black/50 rounded border border-pip-boy-green/20 text-xs">
          <div className="flex items-center gap-1 text-pip-boy-green/60 mb-1">
            <PixelIcon name="settings" sizePreset="xs" variant="muted" decorative />
            <span>系統語音：</span>
          </div>
          <p className="text-pip-boy-green/80 ml-4">{selectedSystemVoice}</p>
        </div>
      }

      {/* 預覽按鈕 */}
      <Button size="icon" variant="outline"
      onClick={handlePreview}
      disabled={!isInitialized}
      className="w-full px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed\n transition-all flex items-center justify-center gap-2"



      aria-label={isPreviewing ? '停止試聽' : '試聽語音'}>

        <PixelIcon
          name={isPreviewing ? 'stop' : 'play'}
          sizePreset="xs"
          variant="primary"
          animation={isPreviewing ? 'pulse' : undefined}
          decorative />

        <span>{isPreviewing ? '停止試聽' : '試聽語音'}</span>
      </Button>
    </div>);

}