'use client';

/**
 * Chirp 3:HD TTS 完整功能測試頁面
 * 測試所有 Chirp 3:HD 功能：音高、語速、暫停、自訂發音
 */

import React, { useState } from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

// 角色配置（全部 14 個角色，包含完整的語音映射）
const TEST_CHARACTERS = [
  // === 極低音角色（威脅、強大）===
  { 
    key: 'super_mutant', 
    name: 'Super Mutant', 
    pitch: 0.4, 
    rate: 0.65, 
    description: '極低音 (-12st, 0.65x)',
    voice: 'Algenib',
    languageCode: 'cmn-CN',
    category: '極低音'
  },
  { 
    key: 'brotherhood_paladin', 
    name: 'Brotherhood Paladin', 
    pitch: 0.6, 
    rate: 0.75, 
    description: '低沉威嚴 (-8st, 0.75x)',
    voice: 'Alnilam',
    languageCode: 'cmn-CN',
    category: '極低音'
  },
  { 
    key: 'legion_centurion', 
    name: 'Legion Centurion', 
    pitch: 0.5, 
    rate: 0.7, 
    description: '嚴厲命令 (-10st, 0.7x)',
    voice: 'Enceladus',
    languageCode: 'cmn-CN',
    category: '極低音'
  },
  
  // === 低音角色（粗獷、老練）===
  { 
    key: 'ghoul', 
    name: 'Ghoul', 
    pitch: 0.7, 
    rate: 0.8, 
    description: '沙啞老成 (-6st, 0.8x)',
    voice: 'Fenrir',
    languageCode: 'cmn-CN',
    category: '低音'
  },
  { 
    key: 'wasteland_trader', 
    name: 'Wasteland Trader', 
    pitch: 0.8, 
    rate: 0.9, 
    description: '成熟商人 (-4st, 0.9x)',
    voice: 'Achird',
    languageCode: 'cmn-CN',
    category: '低音'
  },
  { 
    key: 'ncr_ranger', 
    name: 'NCR Ranger', 
    pitch: 0.75, 
    rate: 0.85, 
    description: '冷靜專業 (-5st, 0.85x)',
    voice: 'Iapetus',
    languageCode: 'cmn-CN',
    category: '低音'
  },
  
  // === 中音角色（標準、友善）===
  { 
    key: 'pip_boy', 
    name: 'Pip-Boy', 
    pitch: 1.0, 
    rate: 1.0, 
    description: '標準友善 (0st, 1.0x)',
    voice: 'Puck',
    languageCode: 'cmn-CN',
    category: '中音'
  },
  { 
    key: 'minuteman', 
    name: 'Minuteman', 
    pitch: 0.92, 
    rate: 0.95, 
    description: '穩重可靠 (-2st, 0.95x)',
    voice: 'Schedar',
    languageCode: 'cmn-CN',
    category: '中音'
  },
  
  // === 高音角色（年輕、活潑）===
  { 
    key: 'vault_dweller', 
    name: 'Vault Dweller', 
    pitch: 1.16, 
    rate: 1.1, 
    description: '年輕樂觀 (+4st, 1.1x)',
    voice: 'Aoede',
    languageCode: 'cmn-CN',
    category: '高音'
  },
  { 
    key: 'railroad_agent', 
    name: 'Railroad Agent', 
    pitch: 1.12, 
    rate: 1.15, 
    description: '機敏快速 (+3st, 1.15x)',
    voice: 'Leda',
    languageCode: 'cmn-CN',
    category: '高音'
  },
  { 
    key: 'brotherhood_scribe', 
    name: 'Brotherhood Scribe', 
    pitch: 1.2, 
    rate: 1.05, 
    description: '聰明好學 (+5st, 1.05x)',
    voice: 'Callirrhoe',
    languageCode: 'cmn-CN',
    category: '高音'
  },
  
  // === 特殊角色 ===
  { 
    key: 'codsworth', 
    name: 'Codsworth', 
    pitch: 1.32, 
    rate: 1.25, 
    description: '機器人 (+8st, 1.25x)',
    voice: 'Despina',
    languageCode: 'cmn-CN',
    category: '特殊'
  },
  { 
    key: 'raider', 
    name: 'Raider', 
    pitch: 0.88, 
    rate: 1.3, 
    description: '粗野快速 (-3st, 1.3x)',
    voice: 'Rasalgethi',
    languageCode: 'cmn-CN',
    category: '特殊'
  },
  { 
    key: 'institute_scientist', 
    name: 'Institute Scientist', 
    pitch: 1.24, 
    rate: 1.15, 
    description: '知識份子 (+6st, 1.15x)',
    voice: 'Kore',
    languageCode: 'cmn-CN',
    category: '特殊'
  },
];

// 可用的 Chirp 3:HD 語音列表
const AVAILABLE_VOICES = [
  { value: 'en-US-Chirp3-HD-Algenib', label: 'Algenib (深沉低音)' },
  { value: 'en-US-Chirp3-HD-Alnilam', label: 'Alnilam (軍事權威)' },
  { value: 'en-US-Chirp3-HD-Enceladus', label: 'Enceladus (嚴厲紀律)' },
  { value: 'en-US-Chirp3-HD-Fenrir', label: 'Fenrir (歷練老成)' },
  { value: 'en-US-Chirp3-HD-Achird', label: 'Achird (實用商人)' },
  { value: 'en-US-Chirp3-HD-Iapetus', label: 'Iapetus (冷靜專業)' },
  { value: 'en-US-Chirp3-HD-Puck', label: 'Puck (友善標準)' },
  { value: 'en-US-Chirp3-HD-Schedar', label: 'Schedar (穩重可靠)' },
  { value: 'en-US-Chirp3-HD-Aoede', label: 'Aoede (年輕活潑)' },
  { value: 'en-US-Chirp3-HD-Leda', label: 'Leda (機敏快速)' },
  { value: 'en-US-Chirp3-HD-Callirrhoe', label: 'Callirrhoe (聰明好學)' },
  { value: 'en-US-Chirp3-HD-Despina', label: 'Despina (機器人)' },
  { value: 'en-US-Chirp3-HD-Rasalgethi', label: 'Rasalgethi (粗野狂暴)' },
  { value: 'en-US-Chirp3-HD-Kore', label: 'Kore (知識份子)' },
];

// 支援的語言代碼
const LANGUAGE_CODES = [
  { value: 'cmn-CN', label: '中文 (中國) ✓ Chirp3 [推薦]', supported: true },
  { value: 'cmn-TW', label: '中文 (台灣) ✓ Chirp3', supported: true },
  { value: 'cmn-Hant-TW', label: '中文 (台灣-繁體) ✓ Chirp3', supported: true },
  { value: 'en-US', label: 'English (US) ✓ Chirp3', supported: true },
  { value: 'en-GB', label: 'English (UK) ✓ Chirp3', supported: true },
  { value: 'en-AU', label: 'English (AU) ✓ Chirp3', supported: true },
  { value: 'en-IN', label: 'English (IN) ✓ Chirp3', supported: true },
  { value: 'ja-JP', label: '日本語 ✓ Chirp3', supported: true },
  { value: 'ko-KR', label: '한국어 ✓ Chirp3', supported: true },
  { value: 'fr-FR', label: 'Français ✓ Chirp3', supported: true },
  { value: 'de-DE', label: 'Deutsch ✓ Chirp3', supported: true },
  { value: 'es-ES', label: 'Español ✓ Chirp3', supported: true },
  { value: 'pt-BR', label: 'Português (BR) ✓ Chirp3', supported: true },
  { value: 'it-IT', label: 'Italiano ✓ Chirp3', supported: true },
];

// 測試場景
const TEST_SCENARIOS = [
  {
    id: 'basic',
    name: '基本語音',
    text: 'Welcome to the wasteland. Your journey begins now.',
    description: '測試基本語音合成',
    useCustomPronunciation: false,
    usePauses: false,
    useVoiceControls: false,
  },
  {
    id: 'pronunciation',
    name: '自訂發音',
    text: 'The Pip-Boy displays your Tarot reading. Visit the NCR Ranger station.',
    description: '測試 IPA 自訂發音',
    useCustomPronunciation: true,
    customPronunciations: [
      { phrase: 'Pip-Boy', pronunciation: 'pɪp bɔɪ' },
      { phrase: 'Tarot', pronunciation: 'ˈtæ.roʊ' },
      { phrase: 'NCR', pronunciation: 'ɛn si ɑr' },
    ],
    usePauses: false,
    useVoiceControls: false,
  },
  {
    id: 'pauses',
    name: '自訂暫停',
    text: 'System ready. Loading data. Please wait. Process complete.',
    description: '測試暫停控制',
    useCustomPronunciation: false,
    usePauses: true,
    pauses: [
      { position: 13, duration: 'medium' }, // after "ready"
      { position: 27, duration: '500ms' },  // after "data"
      { position: 40, duration: 'long' },   // after "wait"
    ],
    useVoiceControls: false,
  },
  {
    id: 'voice-controls',
    name: '語音控制',
    text: 'This message is modified with custom pitch and rate.',
    description: '測試音高與語速覆寫',
    useCustomPronunciation: false,
    usePauses: false,
    useVoiceControls: true,
    voiceControls: {
      pitch: 5.0,
      rate: 1.2,
      volume: 1.0,
    },
  },
  {
    id: 'full-features',
    name: '完整功能',
    text: 'The Pip-Boy system is ready. Your Tarot reading begins. Brotherhood forces detected.',
    description: '測試所有功能組合',
    useCustomPronunciation: true,
    customPronunciations: [
      { phrase: 'Pip-Boy', pronunciation: 'pɪp bɔɪ' },
      { phrase: 'Tarot', pronunciation: 'ˈtæ.roʊ' },
      { phrase: 'Brotherhood', pronunciation: 'ˈbrʌðərhʊd' },
    ],
    usePauses: true,
    pauses: [
      { position: 26, duration: 'short' },   // after "ready"
      { position: 52, duration: 'medium' },  // after "begins"
    ],
    useVoiceControls: true,
    voiceControls: {
      pitch: 2.0,
      rate: 1.1,
      volume: 1.0,
    },
  },
];

interface TestResult {
  success: boolean;
  duration?: number;
  fileSize?: number;
  cached?: boolean;
  source?: string;
  audioUrl?: string;
  error?: string;
  metadata?: {
    model?: string;
    sampleRate?: number;
    encoding?: string;
  };
}

export default function TestChirp3HDPage() {
  const [selectedCharacter, setSelectedCharacter] = useState('vault_dweller');
  const [selectedScenario, setSelectedScenario] = useState('basic');
  const [isRunning, setIsRunning] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // 自訂參數
  const [customText, setCustomText] = useState('');
  const [customPitch, setCustomPitch] = useState(0);
  const [customRate, setCustomRate] = useState(1.0);
  const [customVolume, setCustomVolume] = useState(1.0);
  
  // 語音和語言代碼自訂
  const [customVoice, setCustomVoice] = useState('');
  const [customLanguageCode, setCustomLanguageCode] = useState('cmn-CN');
  const [useCustomVoiceSettings, setUseCustomVoiceSettings] = useState(false);

  /**
   * 執行單一測試
   */
  const runTest = async (characterKey: string, scenarioId: string) => {
    const scenario = TEST_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;

    const testKey = `${characterKey}-${scenarioId}`;
    setIsRunning(true);

    try {
      // 準備請求體
      const requestBody: any = {
        text: scenario.text,
        character_key: characterKey,
        audio_type: 'ai_response', // 使用 ai_response 代替 story (避免 enum 問題)
        cache_enabled: false, // 測試時關閉快取以確保每次都重新生成
        return_format: 'url',
        force_voice_model: 'chirp3-hd', // 強制使用 Chirp 3:HD
      };

      // 添加自訂語音設定（如果啟用）
      if (useCustomVoiceSettings) {
        if (customVoice) {
          requestBody.voice_name = customVoice;
        }
        if (customLanguageCode) {
          requestBody.language_code = customLanguageCode;
        }
      }

      // 添加自訂發音
      if (scenario.useCustomPronunciation && scenario.customPronunciations) {
        requestBody.custom_pronunciations = scenario.customPronunciations;
      }

      // 添加暫停
      if (scenario.usePauses && scenario.pauses) {
        requestBody.voice_controls = {
          pauses: scenario.pauses,
        };
      }

      // 添加語音控制
      if (scenario.useVoiceControls && scenario.voiceControls) {
        requestBody.voice_controls = {
          ...requestBody.voice_controls,
          ...scenario.voiceControls,
        };
      }

      console.log('[Chirp3HD Test] Request:', requestBody);

      // 呼叫 API
      const response = await fetch('/api/v1/audio/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'TTS synthesis failed');
      }

      const data = await response.json();
      console.log('[Chirp3HD Test] Response:', data);

      // 儲存測試結果
      setTestResults(prev => ({
        ...prev,
        [testKey]: {
          success: true,
          duration: data.duration,
          fileSize: data.file_size,
          cached: data.cached,
          source: data.source,
          audioUrl: data.url,
          metadata: data.metadata,
        },
      }));

      // 播放音檔
      if (currentAudio) {
        currentAudio.pause();
      }

      const audio = new Audio(data.url);
      audio.onended = () => {
        setCurrentAudio(null);
      };
      audio.play();
      setCurrentAudio(audio);

    } catch (error) {
      console.error('[Chirp3HD Test] Error:', error);
      setTestResults(prev => ({
        ...prev,
        [testKey]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * 執行自訂測試
   */
  const runCustomTest = async () => {
    if (!customText.trim()) {
      alert('請輸入測試文字');
      return;
    }

    setIsRunning(true);
    const testKey = `custom-${Date.now()}`;

    try {
      const requestBody: any = {
        text: customText,
        character_key: selectedCharacter,
        audio_type: 'ai_response', // 使用 ai_response 代替 story (避免 enum 問題)
        cache_enabled: false,
        return_format: 'url',
        force_voice_model: 'chirp3-hd', // 強制使用 Chirp 3:HD
        voice_controls: {
          pitch: customPitch,
          rate: customRate,
          volume: customVolume,
        },
      };

      // 添加自訂語音設定
      if (useCustomVoiceSettings) {
        if (customVoice) {
          requestBody.voice_name = customVoice;
        }
        if (customLanguageCode) {
          requestBody.language_code = customLanguageCode;
        }
      }

      console.log('[Chirp3HD Custom Test] Request:', requestBody);

      const response = await fetch('/api/v1/audio/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'TTS synthesis failed');
      }

      const data = await response.json();
      console.log('[Chirp3HD Custom Test] Response:', data);

      setTestResults(prev => ({
        ...prev,
        [testKey]: {
          success: true,
          duration: data.duration,
          fileSize: data.file_size,
          cached: data.cached,
          source: data.source,
          audioUrl: data.url,
          metadata: data.metadata,
        },
      }));

      if (currentAudio) {
        currentAudio.pause();
      }

      const audio = new Audio(data.url);
      audio.onended = () => setCurrentAudio(null);
      audio.play();
      setCurrentAudio(audio);

    } catch (error) {
      console.error('[Chirp3HD Custom Test] Error:', error);
      setTestResults(prev => ({
        ...prev,
        [testKey]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * 執行所有測試
   */
  const runAllTests = async () => {
    for (const scenario of TEST_SCENARIOS) {
      await runTest(selectedCharacter, scenario.id);
      // 等待一秒避免 API rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const getTestResult = (characterKey: string, scenarioId: string) => {
    return testResults[`${characterKey}-${scenarioId}`];
  };

  return (
    <div className="min-h-screen bg-black text-pip-boy-green p-8">
      <div className="max-w-7xl mx-auto">
        {/* 標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <PixelIcon name="radio" sizePreset="md" variant="primary" decorative />
            Chirp 3:HD TTS 完整功能測試
          </h1>
          <p className="text-pip-boy-green/60">
            測試所有 14 個角色的音高、語速、自訂發音、暫停控制等 Chirp 3:HD 功能
          </p>
          <div className="mt-2 flex gap-4 text-xs text-pip-boy-green/50">
            <span>✓ 14 個角色</span>
            <span>✓ 14 種語音</span>
            <span>✓ 5 個測試場景</span>
            <span>✓ 6 種語言</span>
          </div>
        </div>

        {/* 控制面板 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 角色選擇 */}
          <div className="p-6 border border-pip-boy-green/30 rounded-lg bg-black/50">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PixelIcon name="user" sizePreset="sm" variant="primary" decorative />
              選擇角色 (14 個)
            </h2>
            <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
              {/* 分組顯示角色 */}
              {['極低音', '低音', '中音', '高音', '特殊'].map(category => {
                const chars = TEST_CHARACTERS.filter(c => c.category === category);
                if (chars.length === 0) return null;
                
                return (
                  <div key={category}>
                    <div className="text-xs font-bold text-pip-boy-green/70 mb-2 px-2">
                      {category} ({chars.length})
                    </div>
                    <div className="space-y-1">
                      {chars.map(char => (
                        <button
                          key={char.key}
                          onClick={() => setSelectedCharacter(char.key)}
                          className={`w-full p-2 text-left rounded border transition-colors ${
                            selectedCharacter === char.key
                              ? 'border-pip-boy-green bg-pip-boy-green/20'
                              : 'border-pip-boy-green/30 hover:border-pip-boy-green/50'
                          }`}
                        >
                          <div className="font-bold text-sm">{char.name}</div>
                          <div className="text-xs text-pip-boy-green/60">{char.description}</div>
                          <div className="text-xs text-pip-boy-green/40 mt-0.5">
                            {char.voice.split('-').pop()}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 測試場景 */}
          <div className="p-6 border border-pip-boy-green/30 rounded-lg bg-black/50">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PixelIcon name="list" sizePreset="sm" variant="primary" decorative />
              測試場景
            </h2>
            <div className="space-y-2">
              {TEST_SCENARIOS.map(scenario => {
                const result = getTestResult(selectedCharacter, scenario.id);
                return (
                  <button
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario.id)}
                    className={`w-full p-3 text-left rounded border transition-colors ${
                      selectedScenario === scenario.id
                        ? 'border-pip-boy-green bg-pip-boy-green/20'
                        : 'border-pip-boy-green/30 hover:border-pip-boy-green/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">{scenario.name}</span>
                      {result && (
                        <PixelIcon
                          name={result.success ? 'check' : 'close'}
                          sizePreset="xs"
                          variant={result.success ? 'success' : 'error'}
                          decorative
                        />
                      )}
                    </div>
                    <div className="text-xs text-pip-boy-green/60">{scenario.description}</div>
                  </button>
                );
              })}
            </div>
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              className="w-full mt-4"
              variant="default"
            >
              <PixelIcon name="play" sizePreset="xs" decorative />
              執行所有測試
            </Button>
          </div>

          {/* 測試詳情 */}
          <div className="p-6 border border-pip-boy-green/30 rounded-lg bg-black/50">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PixelIcon name="info" sizePreset="sm" variant="primary" decorative />
              測試詳情
            </h2>
            {(() => {
              const scenario = TEST_SCENARIOS.find(s => s.id === selectedScenario);
              const result = getTestResult(selectedCharacter, selectedScenario);
              
              if (!scenario) return null;

              const character = TEST_CHARACTERS.find(c => c.key === selectedCharacter);

              return (
                <div className="space-y-4">
                  {/* 角色語音資訊 */}
                  {character && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                      <div className="text-xs font-bold mb-2">角色語音設定：</div>
                      <div className="text-xs space-y-1 text-pip-boy-green/70">
                        <div>角色: {character.name}</div>
                        <div>語音: {character.voice}</div>
                        <div>語言: {character.languageCode}</div>
                        <div>音高: {character.pitch > 1 ? '+' : ''}{((character.pitch - 1) * 20).toFixed(0)}st</div>
                        <div>語速: {character.rate}x</div>
                      </div>
                    </div>
                  )}

                  {/* 文字 */}
                  <div>
                    <div className="text-xs text-pip-boy-green/60 mb-1">測試文字：</div>
                    <div className="p-2 bg-black/50 rounded border border-pip-boy-green/20 text-sm">
                      {scenario.text}
                    </div>
                  </div>

                  {/* 功能標記 */}
                  <div>
                    <div className="text-xs text-pip-boy-green/60 mb-2">啟用功能：</div>
                    <div className="flex flex-wrap gap-2">
                      {scenario.useCustomPronunciation && (
                        <span className="px-2 py-1 text-xs bg-blue-500/20 border border-blue-500/50 rounded">
                          自訂發音
                        </span>
                      )}
                      {scenario.usePauses && (
                        <span className="px-2 py-1 text-xs bg-yellow-500/20 border border-yellow-500/50 rounded">
                          暫停控制
                        </span>
                      )}
                      {scenario.useVoiceControls && (
                        <span className="px-2 py-1 text-xs bg-purple-500/20 border border-purple-500/50 rounded">
                          語音控制
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 執行按鈕 */}
                  <Button
                    onClick={() => runTest(selectedCharacter, selectedScenario)}
                    disabled={isRunning}
                    className="w-full"
                    variant="default"
                  >
                    {isRunning ? (
                      <>
                        <PixelIcon name="loader" sizePreset="xs" animation="spin" decorative />
                        測試中...
                      </>
                    ) : (
                      <>
                        <PixelIcon name="play" sizePreset="xs" decorative />
                        執行測試
                      </>
                    )}
                  </Button>

                  {/* 測試結果 */}
                  {result && (
                    <div className={`p-3 rounded border ${
                      result.success
                        ? 'bg-green-500/10 border-green-500/50'
                        : 'bg-red-500/10 border-red-500/50'
                    }`}>
                      <div className="text-sm font-bold mb-2">
                        {result.success ? '✓ 測試成功' : '✗ 測試失敗'}
                      </div>
                      {result.success ? (
                        <div className="text-xs space-y-1">
                          <div>時長: {result.duration?.toFixed(2)}s</div>
                          <div>大小: {((result.fileSize || 0) / 1024).toFixed(1)} KB</div>
                          <div>模型: {result.metadata?.model || 'chirp3-hd'}</div>
                          <div>採樣率: {result.metadata?.sampleRate || 24000} Hz</div>
                        </div>
                      ) : (
                        <div className="text-xs text-red-400">{result.error}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* 自訂測試區 */}
        <div className="p-6 border border-pip-boy-green/30 rounded-lg bg-black/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <PixelIcon name="edit" sizePreset="sm" variant="primary" decorative />
              自訂參數測試
            </h2>
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="text-sm text-pip-boy-green/60 hover:text-pip-boy-green"
            >
              {showAdvancedOptions ? '隱藏' : '顯示'}進階選項
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 文字輸入 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">測試文字</label>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="輸入要測試的文字..."
                  rows={6}
                  maxLength={1000}
                  className="w-full px-3 py-2 bg-black/70 border border-pip-boy-green/50 rounded text-pip-boy-green resize-none"
                />
                <div className="text-xs text-pip-boy-green/60 mt-1">
                  {customText.length}/1000 字元
                </div>
              </div>

              {/* 角色選擇 */}
              <div>
                <label className="block text-sm mb-2">測試角色</label>
                <select
                  value={selectedCharacter}
                  onChange={(e) => setSelectedCharacter(e.target.value)}
                  className="w-full px-3 py-2 bg-black/70 border border-pip-boy-green/50 rounded text-pip-boy-green"
                >
                  {TEST_CHARACTERS.map(char => (
                    <option key={char.key} value={char.key}>
                      {char.name} - {char.description}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-pip-boy-green/60 mt-1">
                  {(() => {
                    const char = TEST_CHARACTERS.find(c => c.key === selectedCharacter);
                    return char ? `語音: ${char.voice} | 語言: ${char.languageCode}` : '';
                  })()}
                </div>
              </div>
            </div>

            {/* 參數控制 */}
            {showAdvancedOptions && (
              <div className="space-y-4">
                {/* 語音和語言代碼設定 */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="useCustomVoice"
                      checked={useCustomVoiceSettings}
                      onChange={(e) => setUseCustomVoiceSettings(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="useCustomVoice" className="text-sm font-bold cursor-pointer">
                      使用自訂語音設定
                    </label>
                  </div>
                  
                  {useCustomVoiceSettings && (
                    <div className="space-y-3">
                      {/* 語音選擇 */}
                      <div>
                        <label className="block text-xs mb-1">Chirp 3:HD 語音</label>
                        <select
                          value={customVoice}
                          onChange={(e) => setCustomVoice(e.target.value)}
                          className="w-full px-2 py-1 text-sm bg-black/70 border border-pip-boy-green/50 rounded text-pip-boy-green"
                        >
                          <option value="">使用角色預設語音</option>
                          {AVAILABLE_VOICES.map(voice => (
                            <option key={voice.value} value={voice.value}>
                              {voice.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 語言代碼選擇 */}
                      <div>
                        <label className="block text-xs mb-1">語言代碼</label>
                        <select
                          value={customLanguageCode}
                          onChange={(e) => setCustomLanguageCode(e.target.value)}
                          className="w-full px-2 py-1 text-sm bg-black/70 border border-pip-boy-green/50 rounded text-pip-boy-green"
                        >
                          {LANGUAGE_CODES.map(lang => (
                            <option key={lang.value} value={lang.value}>
                              {lang.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 當前選擇顯示 */}
                      <div className="text-xs text-pip-boy-green/70 pt-2 border-t border-pip-boy-green/20">
                        <div>語音: {customVoice || '(角色預設)'}</div>
                        <div>語言: {customLanguageCode}</div>
                        {!LANGUAGE_CODES.find(l => l.value === customLanguageCode)?.supported && (
                          <div className="text-yellow-500 mt-1">
                            ⚠️ 此語言不支援 Chirp3-HD，將使用 WaveNet
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 音高 */}
                <div>
                  <label className="block text-sm mb-2">
                    音高調整: {customPitch > 0 ? '+' : ''}{customPitch} semitones
                  </label>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="1"
                    value={customPitch}
                    onChange={(e) => setCustomPitch(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-pip-boy-green/60">
                    <span>-20st (極低)</span>
                    <span>0st (標準)</span>
                    <span>+20st (極高)</span>
                  </div>
                </div>

                {/* 語速 */}
                <div>
                  <label className="block text-sm mb-2">
                    語速倍率: {customRate.toFixed(2)}x
                  </label>
                  <input
                    type="range"
                    min="0.25"
                    max="4"
                    step="0.05"
                    value={customRate}
                    onChange={(e) => setCustomRate(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-pip-boy-green/60">
                    <span>0.25x (極慢)</span>
                    <span>1.0x (標準)</span>
                    <span>4.0x (極快)</span>
                  </div>
                </div>

                {/* 音量 */}
                <div>
                  <label className="block text-sm mb-2">
                    音量: {(customVolume * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={customVolume}
                    onChange={(e) => setCustomVolume(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-pip-boy-green/60">
                    <span>0% (靜音)</span>
                    <span>50%</span>
                    <span>100% (最大)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={runCustomTest}
            disabled={isRunning || !customText.trim()}
            className="mt-4"
            variant="default"
          >
            {isRunning ? (
              <>
                <PixelIcon name="loader" sizePreset="xs" animation="spin" decorative />
                測試中...
              </>
            ) : (
              <>
                <PixelIcon name="play" sizePreset="xs" decorative />
                執行自訂測試
              </>
            )}
          </Button>
        </div>

        {/* 測試結果總覽 */}
        {Object.keys(testResults).length > 0 && (
          <div className="mt-8 p-6 border border-pip-boy-green/30 rounded-lg bg-black/50">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PixelIcon name="chart" sizePreset="sm" variant="primary" decorative />
              測試結果總覽
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(testResults).map(([key, result]) => (
                <div
                  key={key}
                  className={`p-4 rounded border ${
                    result.success
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="font-bold mb-2 flex items-center gap-2">
                    <PixelIcon
                      name={result.success ? 'check' : 'close'}
                      sizePreset="xs"
                      variant={result.success ? 'success' : 'error'}
                      decorative
                    />
                    {key}
                  </div>
                  {result.success ? (
                    <div className="text-xs space-y-1 text-pip-boy-green/80">
                      <div>時長: {result.duration?.toFixed(2)}s</div>
                      <div>大小: {((result.fileSize || 0) / 1024).toFixed(1)} KB</div>
                      {result.audioUrl && (
                        <button
                          onClick={() => {
                            if (currentAudio) currentAudio.pause();
                            const audio = new Audio(result.audioUrl);
                            audio.onended = () => setCurrentAudio(null);
                            audio.play();
                            setCurrentAudio(audio);
                          }}
                          className="text-pip-boy-green hover:underline"
                        >
                          🔊 播放
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-red-400">{result.error}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
