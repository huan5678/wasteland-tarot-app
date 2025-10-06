/**
 * VolumeController 單元測試
 * 需求 4.1, 4.2, 4.3: 音量控制測試
 */

import { VolumeController } from '../VolumeController';

describe('VolumeController', () => {
  let volumeController: VolumeController;

  beforeEach(() => {
    volumeController = new VolumeController();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('應該設定預設音量', () => {
    expect(volumeController.getVolume('sfx')).toBe(0.7);
    expect(volumeController.getVolume('music')).toBe(0.5);
    expect(volumeController.getVolume('voice')).toBe(0.8);
  });

  it('應該能夠設定音量', () => {
    volumeController.setVolume('sfx', 0.5);
    expect(volumeController.getVolume('sfx')).toBe(0.5);
  });

  it('應該限制音量範圍在 0-1', () => {
    volumeController.setVolume('sfx', 1.5);
    expect(volumeController.getVolume('sfx')).toBe(1);

    volumeController.setVolume('sfx', -0.5);
    expect(volumeController.getVolume('sfx')).toBe(0);
  });

  it('應該能夠靜音和取消靜音', () => {
    volumeController.setMute('sfx', true);
    expect(volumeController.isMuted('sfx')).toBe(true);

    volumeController.setMute('sfx', false);
    expect(volumeController.isMuted('sfx')).toBe(false);
  });

  it('應該將設定持久化到 localStorage', () => {
    volumeController.setVolume('sfx', 0.6);
    volumeController.setMute('music', true);

    const stored = JSON.parse(localStorage.getItem('wasteland-tarot-audio-volume') || '{}');
    expect(stored.volumes.sfx).toBe(0.6);
    expect(stored.muted.music).toBe(true);
  });

  it('應該從 localStorage 載入設定', () => {
    const initialData = {
      volumes: { sfx: 0.3, music: 0.4, voice: 0.5 },
      muted: { sfx: true, music: false, voice: false },
    };
    localStorage.setItem('wasteland-tarot-audio-volume', JSON.stringify(initialData));

    const newController = new VolumeController();
    expect(newController.getVolume('sfx')).toBe(0.3);
    expect(newController.isMuted('sfx')).toBe(true);
  });

  it('應該能夠重置所有音量', () => {
    volumeController.setVolume('sfx', 0.3);
    volumeController.setVolume('music', 0.2);

    volumeController.reset();

    expect(volumeController.getVolume('sfx')).toBe(0.7);
    expect(volumeController.getVolume('music')).toBe(0.5);
  });

  it('應該能夠取得所有音量設定', () => {
    volumeController.setVolume('sfx', 0.3);
    volumeController.setVolume('music', 0.4);

    const volumes = volumeController.getAllVolumes();

    expect(volumes).toEqual({
      sfx: 0.3,
      music: 0.4,
      voice: 0.8,
    });
  });

  it('應該在靜音時返回有效音量', () => {
    volumeController.setVolume('sfx', 0.6);
    volumeController.setMute('sfx', true);

    expect(volumeController.getVolume('sfx')).toBe(0.6);
    expect(volumeController.getEffectiveVolume('sfx')).toBe(0);
  });
});
