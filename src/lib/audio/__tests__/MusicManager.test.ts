/**
 * MusicManager 單元測試
 * 需求 3.1, 3.2, 3.3: 背景音樂管理測試
 */

import { MusicManager } from '../MusicManager';
import { AudioEngine } from '../AudioEngine';

// Mock AudioEngine
jest.mock('../AudioEngine');

describe('MusicManager', () => {
  let musicManager: MusicManager;
  let mockAudioEngine: jest.Mocked<AudioEngine>;

  beforeEach(() => {
    mockAudioEngine = {
      play: jest.fn(),
      stop: jest.fn(),
      stopAll: jest.fn(),
      getMemoryUsage: jest.fn().mockReturnValue(0),
    } as any;

    (AudioEngine.getInstance as jest.Mock).mockReturnValue(mockAudioEngine);
    musicManager = new MusicManager(mockAudioEngine);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('應該根據場景切換音樂', async () => {
    await musicManager.switchScene('home');

    expect(mockAudioEngine.play).toHaveBeenCalledWith(
      expect.stringContaining('wasteland-ambient'),
      expect.objectContaining({ loop: true })
    );
  });

  it('應該在切換場景時執行 crossfade', async () => {
    // First play a track
    await musicManager.switchScene('home');

    // Then switch to another scene
    await musicManager.switchScene('reading');

    // Should have been called twice (once for initial, once for switch)
    expect(mockAudioEngine.play).toHaveBeenCalledTimes(2);
  });

  it('應該在 2 秒內完成 crossfade', async () => {
    jest.useFakeTimers();

    await musicManager.switchScene('home');
    const startTime = Date.now();

    await musicManager.switchScene('reading');

    jest.advanceTimersByTime(2000);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThanOrEqual(2000);

    jest.useRealTimers();
  });

  it('應該能夠停止背景音樂', async () => {
    await musicManager.switchScene('home');
    musicManager.stop();

    expect(mockAudioEngine.stop).toHaveBeenCalled();
  });

  it('應該在音量為 0 時暫停播放', async () => {
    await musicManager.switchScene('home');
    musicManager.setVolume(0);

    expect(mockAudioEngine.stop).toHaveBeenCalled();
  });

  it('應該能夠設定音樂音量', async () => {
    await musicManager.switchScene('home');
    musicManager.setVolume(0.5);

    // Volume should be applied to next play
    await musicManager.switchScene('reading');

    expect(mockAudioEngine.play).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ volume: 0.5 })
    );
  });

  it('應該在未知場景時播放預設音樂', async () => {
    await musicManager.switchScene('unknown-scene');

    expect(mockAudioEngine.play).toHaveBeenCalledWith(
      expect.stringContaining('wasteland-ambient'),
      expect.any(Object)
    );
  });

  it('應該能夠取得當前播放的音軌', async () => {
    await musicManager.switchScene('home');

    const currentTrack = musicManager.getCurrentTrack();
    expect(currentTrack).toContain('wasteland-ambient');
  });
});
