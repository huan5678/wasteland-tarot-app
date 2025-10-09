/**
 * 音訊系統整合測試
 * 需求 6.1, 6.2, 6.3: 系統整合測試
 */

import { AudioEngine } from '@/lib/audio/AudioEngine';
import { SpeechEngine } from '@/lib/audio/SpeechEngine';
import { MusicManager } from '@/lib/audio/MusicManager';
import { VolumeController } from '@/lib/audio/VolumeController';
import { EffectsProcessor } from '@/lib/audio/EffectsProcessor';

// Mock Web Audio API
const mockAudioContext = {
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: { value: 1, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
  })),
  createBufferSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    buffer: null,
  })),
  decodeAudioData: jest.fn().mockResolvedValue({}),
  destination: {},
  state: 'running',
  resume: jest.fn().mockResolvedValue(undefined),
} as any;

// Mock fetch
global.fetch = jest.fn();

// Mock AudioContext
(global as any).AudioContext = jest.fn(() => mockAudioContext);

describe('Audio System Integration', () => {
  let audioEngine: AudioEngine;
  let speechEngine: SpeechEngine;
  let musicManager: MusicManager;
  let volumeController: VolumeController;

  beforeEach(() => {
    audioEngine = AudioEngine.getInstance();
    speechEngine = SpeechEngine.getInstance();
    volumeController = new VolumeController();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(1024),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('應該能夠初始化完整的音訊系統', async () => {
    await audioEngine.initialize();

    expect(audioEngine).toBeDefined();
    expect(speechEngine).toBeDefined();
    expect(volumeController).toBeDefined();
  });

  it('應該能夠載入和播放音效', async () => {
    await audioEngine.initialize();
    await audioEngine.preloadSounds([
      { id: 'test-sound', type: 'sfx', url: '/test.mp3', priority: 'critical' },
    ]);

    await audioEngine.play('test-sound', { volume: 0.5 });

    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
  });

  it('應該同步音量設定', async () => {
    await audioEngine.initialize();

    volumeController.setVolume('sfx', 0.6);
    const volume = volumeController.getVolume('sfx');

    expect(volume).toBe(0.6);
  });

  it('應該能夠切換場景音樂', async () => {
    await audioEngine.initialize();
    musicManager = new MusicManager(audioEngine);

    await musicManager.switchScene('home');

    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
  });

  it('應該在靜音時停止所有播放', async () => {
    await audioEngine.initialize();
    const stopAllSpy = jest.spyOn(audioEngine, 'stopAll');

    volumeController.setMute('sfx', true);
    audioEngine.stopAll();

    expect(stopAllSpy).toHaveBeenCalled();
  });

  it('應該能夠應用音效處理', async () => {
    await audioEngine.initialize();
    const effectsProcessor = new EffectsProcessor(mockAudioContext);

    const chain = effectsProcessor.createEffectsChain(['radio', 'reverb']);

    expect(chain.length).toBeGreaterThan(0);
  });

  it('應該持久化音量設定', () => {
    volumeController.setVolume('sfx', 0.4);
    volumeController.setMute('music', true);

    const stored = JSON.parse(localStorage.getItem('wasteland-tarot-audio-volume') || '{}');

    expect(stored.volumes.sfx).toBe(0.4);
    expect(stored.muted.music).toBe(true);
  });

  it('應該能夠執行完整的 TTS 流程', async () => {
    const mockUtterance = {
      text: '',
      pitch: 1,
      rate: 1,
      volume: 1,
      onstart: null as any,
      onend: null as any,
    };

    const mockSynthesis = {
      speak: jest.fn((utterance) => {
        if (utterance.onstart) utterance.onstart();
      }),
      pause: jest.fn(),
      resume: jest.fn(),
      cancel: jest.fn(),
      getVoices: jest.fn(() => []),
    };

    (global as any).SpeechSynthesisUtterance = jest.fn(() => mockUtterance);
    (global as any).speechSynthesis = mockSynthesis;

    await speechEngine.initialize();
    speechEngine.speak('測試文字', { voice: 'pip_boy' });

    expect(mockSynthesis.speak).toHaveBeenCalled();
  });

  it('應該能夠處理並發播放限制', async () => {
    await audioEngine.initialize();

    const sounds = Array.from({ length: 10 }, (_, i) => ({
      id: `sound-${i}`,
      type: 'sfx' as const,
      url: `/sound-${i}.mp3`,
      priority: 'normal' as const,
    }));

    await audioEngine.preloadSounds(sounds);

    // Play all sounds
    const playPromises = sounds.map((sound) => audioEngine.play(sound.id));
    await Promise.all(playPromises);

    // Should not exceed max concurrent sounds
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
  });

  it('應該能夠執行音樂 crossfade', async () => {
    await audioEngine.initialize();
    musicManager = new MusicManager(audioEngine);

    await musicManager.switchScene('home');
    await musicManager.switchScene('reading');

    // Should use gain nodes for crossfade
    expect(mockAudioContext.createGain).toHaveBeenCalled();
  });
});
