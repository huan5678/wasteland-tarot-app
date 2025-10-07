/**
 * MusicGenerator - Web Audio API 背景音樂生成器
 * 需求 3.1: 使用 Web Audio API 即時生成背景音樂，避免載入外部音檔
 */

/**
 * 音樂生成選項
 */
export interface MusicGeneratorOptions {
  duration?: number;
  volume?: number;
  sampleRate?: number;
}

/**
 * 生成廢土環境音 (Wasteland Ambient)
 * 使用低頻 drone + 隨機風聲效果
 *
 * @param audioContext - AudioContext 實例
 * @param options - 音樂選項
 * @returns AudioBuffer
 */
export async function generateWastelandAmbient(
  audioContext: AudioContext,
  options: MusicGeneratorOptions = {}
): Promise<AudioBuffer> {
  if (!audioContext) {
    throw new Error('AudioContext is required');
  }

  const duration = Math.max(10, options.duration || 20);
  const volume = Math.min(1, Math.max(0, options.volume || 0.3));
  const sampleRate = options.sampleRate || audioContext.sampleRate;

  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(2, length, sampleRate);

  // 雙聲道處理
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // 低頻 drone (60Hz - 120Hz)
      const droneFreq1 = 60 + Math.sin(t * 0.1) * 10;
      const droneFreq2 = 90 + Math.cos(t * 0.15) * 15;
      const drone =
        Math.sin(2 * Math.PI * droneFreq1 * t) * 0.3 +
        Math.sin(2 * Math.PI * droneFreq2 * t) * 0.2;

      // 風聲效果 (filtered noise with slow envelope)
      const windEnvelope = (Math.sin(t * 0.5) + 1) / 2;
      const windNoise = (Math.random() * 2 - 1) * 0.15 * windEnvelope;

      // 偶爾的低頻脈衝 (模擬遠方爆炸或雷聲)
      const pulseFreq = 0.05; // 每 20 秒一次
      const pulsePhase = (t * pulseFreq) % 1;
      const pulse = pulsePhase < 0.1
        ? Math.exp(-pulsePhase * 50) * Math.sin(2 * Math.PI * 40 * t) * 0.2
        : 0;

      // 混合所有元素
      data[i] = (drone + windNoise + pulse) * volume;
    }
  }

  return buffer;
}

/**
 * 生成占卜主題音樂 (Divination Theme)
 * 使用神秘感的和弦進行和緩慢的琶音
 *
 * @param audioContext - AudioContext 實例
 * @param options - 音樂選項
 * @returns AudioBuffer
 */
export async function generateDivinationTheme(
  audioContext: AudioContext,
  options: MusicGeneratorOptions = {}
): Promise<AudioBuffer> {
  if (!audioContext) {
    throw new Error('AudioContext is required');
  }

  const duration = Math.max(10, options.duration || 15);
  const volume = Math.min(1, Math.max(0, options.volume || 0.4));
  const sampleRate = options.sampleRate || audioContext.sampleRate;

  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(2, length, sampleRate);

  // 神秘和弦 (C minor 調式)
  const chordFrequencies = [
    [261.63, 311.13, 392.00], // C - Eb - G
    [293.66, 349.23, 440.00], // D - F - A
    [246.94, 293.66, 369.99], // B - D - F#
  ];

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // 和弦進行 (每 5 秒切換一次)
      const chordIndex = Math.floor((t / 5) % chordFrequencies.length);
      const chord = chordFrequencies[chordIndex];

      // 琶音效果 (每個音符緩慢淡入淡出)
      const arpeggioSpeed = 0.3; // Hz
      const arpeggioPhase = (t * arpeggioSpeed) % 1;
      const noteIndex = Math.floor(arpeggioPhase * chord.length);
      const noteEnvelope = Math.sin(arpeggioPhase * Math.PI);

      // 主音符
      const mainNote = Math.sin(2 * Math.PI * chord[noteIndex] * t) * noteEnvelope * 0.3;

      // 和弦背景 (所有音符輕微混合)
      const chordBackground = chord.reduce((sum, freq) => {
        return sum + Math.sin(2 * Math.PI * freq * t) * 0.1;
      }, 0);

      // 神秘氛圍 (高頻泛音)
      const shimmer = Math.sin(2 * Math.PI * 1200 * t + Math.sin(t * 2)) * 0.05;

      // 整體包絡 (緩慢呼吸感)
      const breathEnvelope = (Math.sin(t * 0.5) * 0.3 + 0.7);

      // 混合
      data[i] = (mainNote + chordBackground + shimmer) * breathEnvelope * volume;
    }
  }

  return buffer;
}

/**
 * 生成 Vault 主題音樂 (Vault Theme)
 * 使用金屬感音色和機械節奏
 *
 * @param audioContext - AudioContext 實例
 * @param options - 音樂選項
 * @returns AudioBuffer
 */
export async function generateVaultTheme(
  audioContext: AudioContext,
  options: MusicGeneratorOptions = {}
): Promise<AudioBuffer> {
  if (!audioContext) {
    throw new Error('AudioContext is required');
  }

  const duration = Math.max(10, options.duration || 18);
  const volume = Math.min(1, Math.max(0, options.volume || 0.4));
  const sampleRate = options.sampleRate || audioContext.sampleRate;

  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(2, length, sampleRate);

  // Vault 主題頻率 (金屬感和弦)
  const vaultFrequencies = [
    [220.00, 277.18, 329.63], // A - C# - E
    [196.00, 246.94, 293.66], // G - B - D
  ];

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // 和弦切換 (每 9 秒)
      const chordIndex = Math.floor((t / 9) % vaultFrequencies.length);
      const chord = vaultFrequencies[chordIndex];

      // 主和弦 (方波混合，模擬金屬感)
      const mainChord = chord.reduce((sum, freq) => {
        const phase = (t * freq) % 1;
        const square = phase < 0.5 ? 1 : -1;
        return sum + square * 0.15;
      }, 0);

      // 機械脈衝節奏 (每 2 秒)
      const pulseFreq = 0.5; // Hz
      const pulsePhase = (t * pulseFreq) % 1;
      const mechanicalPulse = pulsePhase < 0.05
        ? Math.sin(2 * Math.PI * 60 * t) * Math.exp(-pulsePhase * 100) * 0.3
        : 0;

      // 嗡嗡聲 (模擬電力系統)
      const hum = Math.sin(2 * Math.PI * 60 * t) * 0.05; // 60Hz hum

      // 高頻金屬泛音
      const metallic = Math.sin(2 * Math.PI * 1800 * t + Math.sin(t)) * 0.03;

      // 整體節奏包絡
      const rhythmEnvelope = (Math.sin(t * 2) * 0.2 + 0.8);

      // 混合所有元素
      data[i] = (mainChord + mechanicalPulse + hum + metallic) * rhythmEnvelope * volume;
    }
  }

  return buffer;
}

/**
 * 根據音樂 ID 生成對應的背景音樂
 *
 * @param musicId - 音樂 ID
 * @param audioContext - AudioContext 實例
 * @param options - 音樂選項
 * @returns AudioBuffer
 */
export async function generateMusicById(
  musicId: string,
  audioContext: AudioContext,
  options: MusicGeneratorOptions = {}
): Promise<AudioBuffer> {
  switch (musicId) {
    case 'wasteland-ambient':
      return generateWastelandAmbient(audioContext, options);

    case 'divination-theme':
      return generateDivinationTheme(audioContext, options);

    case 'vault-theme':
      return generateVaultTheme(audioContext, options);

    default:
      // 預設使用廢土環境音
      return generateWastelandAmbient(audioContext, options);
  }
}
