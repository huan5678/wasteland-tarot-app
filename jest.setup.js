/**
 * Jest Setup File
 * 配置測試環境
 */

// 匯入 @testing-library/jest-dom 提供額外的 matchers
import '@testing-library/jest-dom';

// Mock Web Audio API (如果需要全局 mock)
global.AudioContext = global.AudioContext || class AudioContext {
  sampleRate = 44100;
  destination = {
    connect: jest.fn(),
    disconnect: jest.fn(),
  };

  createBuffer(channels, length, sampleRate) {
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: (channel) => new Float32Array(length),
    };
  }

  createGain() {
    return {
      gain: { value: 1 },
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      onended: null,
    };
  }

  createOscillator() {
    return {
      frequency: { value: 440 },
      type: 'sine',
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };
  }

  resume() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }

  get state() {
    return 'running';
  }
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.location
delete window.location;
window.location = {
  pathname: '/',
  search: '',
  hash: '',
  href: 'http://localhost:3000/',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  toString: jest.fn(() => 'http://localhost:3000/'),
};
