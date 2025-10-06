/**
 * EffectsProcessor 單元測試
 * 需求 1.4: 音效處理器測試
 */

import { EffectsProcessor } from '../EffectsProcessor';
import type { AudioEffect } from '../types';

// Mock Web Audio API
const mockAudioContext = {
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: { value: 1 },
  })),
  createBiquadFilter: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    type: '',
    frequency: { value: 0 },
    Q: { value: 0 },
  })),
  createConvolver: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    buffer: null,
  })),
  createWaveShaper: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    curve: null,
  })),
  createBuffer: jest.fn(() => ({})),
  sampleRate: 44100,
} as any;

describe('EffectsProcessor', () => {
  let effectsProcessor: EffectsProcessor;

  beforeEach(() => {
    effectsProcessor = new EffectsProcessor(mockAudioContext);
    jest.clearAllMocks();
  });

  it('應該建立 reverb 效果', () => {
    const chain = effectsProcessor.createEffectsChain(['reverb']);

    expect(chain).toHaveLength(1);
    expect(mockAudioContext.createConvolver).toHaveBeenCalled();
  });

  it('應該建立 8-bit 效果', () => {
    const chain = effectsProcessor.createEffectsChain(['8bit']);

    expect(chain).toHaveLength(1);
    expect(mockAudioContext.createWaveShaper).toHaveBeenCalled();
  });

  it('應該建立 radio 效果', () => {
    const chain = effectsProcessor.createEffectsChain(['radio']);

    expect(chain).toHaveLength(1);
    expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
  });

  it('應該建立 distortion 效果', () => {
    const chain = effectsProcessor.createEffectsChain(['distortion']);

    expect(chain).toHaveLength(1);
    expect(mockAudioContext.createWaveShaper).toHaveBeenCalled();
  });

  it('應該能夠組合多個效果', () => {
    const effects: AudioEffect[] = ['radio', 'distortion', 'reverb'];
    const chain = effectsProcessor.createEffectsChain(effects);

    expect(chain).toHaveLength(3);
  });

  it('應該快取效果節點', () => {
    effectsProcessor.createEffectsChain(['reverb']);
    effectsProcessor.createEffectsChain(['reverb']);

    // Should create convolver only once due to caching
    expect(mockAudioContext.createConvolver).toHaveBeenCalledTimes(1);
  });

  it('應該能夠清除效果快取', () => {
    effectsProcessor.createEffectsChain(['reverb']);
    effectsProcessor.clearCache();
    effectsProcessor.createEffectsChain(['reverb']);

    // Should create convolver twice (once before clear, once after)
    expect(mockAudioContext.createConvolver).toHaveBeenCalledTimes(2);
  });

  it('應該能夠連接效果鏈', () => {
    const mockSource = { connect: jest.fn() } as any;
    const mockDestination = { connect: jest.fn() } as any;

    effectsProcessor.applyEffects(mockSource, mockDestination, ['radio', 'reverb']);

    expect(mockSource.connect).toHaveBeenCalled();
  });

  it('應該在空效果列表時直接連接 source 和 destination', () => {
    const mockSource = { connect: jest.fn() } as any;
    const mockDestination = { connect: jest.fn() } as any;

    effectsProcessor.applyEffects(mockSource, mockDestination, []);

    expect(mockSource.connect).toHaveBeenCalledWith(mockDestination);
  });
});
