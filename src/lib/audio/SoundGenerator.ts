/**
 * SoundGenerator - Web Audio API 音效生成器
 * 需求 3.1: 使用 Web Audio API 即時生成音效，避免載入外部音檔
 */

/**
 * 音效生成選項
 */
export interface SoundGeneratorOptions {
  frequency?: number;
  duration?: number;
  volume?: number;
  waveType?: OscillatorType;
  envelope?: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  startFrequency?: number;
  endFrequency?: number;
}

/**
 * 生成按鈕點擊音效
 * 使用 sine wave 產生短促的高頻音
 *
 * @param audioContext - AudioContext 實例
 * @param destination - 音訊目標節點
 * @param options - 音效選項
 * @returns AudioBuffer
 */
export async function generateButtonClick(
  audioContext: AudioContext,
  destination: AudioNode,
  options: SoundGeneratorOptions = {}
): Promise<AudioBuffer> {
  if (!audioContext) {
    throw new Error('AudioContext is required');
  }

  const frequency = Math.max(0, options.frequency || 800);
  const duration = Math.max(0.01, options.duration || 0.1);
  const volume = Math.min(1, Math.max(0, options.volume || 0.7));

  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // 生成 sine wave with envelope
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 20); // 快速衰減
    data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * volume;
  }

  return buffer;
}

/**
 * 生成翻牌音效
 * 使用 noise + envelope 模擬紙牌摩擦聲
 *
 * @param audioContext - AudioContext 實例
 * @param destination - 音訊目標節點
 * @param options - 音效選項
 * @returns AudioBuffer
 */
export async function generateCardFlip(
  audioContext: AudioContext,
  destination: AudioNode,
  options: SoundGeneratorOptions = {}
): Promise<AudioBuffer> {
  if (!audioContext) {
    throw new Error('AudioContext is required');
  }

  const duration = Math.max(0.05, options.duration || 0.25);
  const volume = Math.min(1, Math.max(0, options.volume || 0.6));
  const envelope = options.envelope || {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.3,
    release: 0.14,
  };

  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // 生成 white noise with ADSR envelope
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    let envelopeValue = 0;

    // ADSR Envelope
    const attackTime = envelope.attack;
    const decayTime = envelope.attack + envelope.decay;
    const releaseStart = duration - envelope.release;

    if (t < attackTime) {
      // Attack
      envelopeValue = t / attackTime;
    } else if (t < decayTime) {
      // Decay
      const decayProgress = (t - attackTime) / envelope.decay;
      envelopeValue = 1 - (1 - envelope.sustain) * decayProgress;
    } else if (t < releaseStart) {
      // Sustain
      envelopeValue = envelope.sustain;
    } else {
      // Release
      const releaseProgress = (t - releaseStart) / envelope.release;
      envelopeValue = envelope.sustain * (1 - releaseProgress);
    }

    // White noise
    const noise = Math.random() * 2 - 1;
    data[i] = noise * envelopeValue * volume;
  }

  return buffer;
}

/**
 * 生成 Pip-Boy 嗶聲
 * 使用方波振盪器產生特色音效
 *
 * @param audioContext - AudioContext 實例
 * @param destination - 音訊目標節點
 * @param options - 音效選項
 * @returns AudioBuffer
 */
export async function generatePipBoyBeep(
  audioContext: AudioContext,
  destination: AudioNode,
  options: SoundGeneratorOptions = {}
): Promise<AudioBuffer> {
  if (!audioContext) {
    throw new Error('AudioContext is required');
  }

  const frequency = Math.max(0, options.frequency || 1000);
  const duration = Math.max(0.01, options.duration || 0.15);
  const volume = Math.min(1, Math.max(0, options.volume || 0.5));

  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // 生成 square wave
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const cycle = Math.floor(t * frequency % 1);
    const envelope = Math.exp(-t * 10);
    data[i] = (cycle < 0.5 ? 1 : -1) * envelope * volume;
  }

  return buffer;
}

/**
 * 生成終端機打字音
 * 使用短脈衝音模擬按鍵聲
 *
 * @param audioContext - AudioContext 實例
 * @param destination - 音訊目標節點
 * @param options - 音效選項
 * @returns AudioBuffer
 */
export async function generateTerminalType(
  audioContext: AudioContext,
  destination: AudioNode,
  options: SoundGeneratorOptions = {}
): Promise<AudioBuffer> {
  if (!audioContext) {
    throw new Error('AudioContext is required');
  }

  const frequency = Math.max(0, options.frequency || 600);
  const duration = Math.max(0.01, options.duration || 0.05);
  const volume = Math.min(1, Math.max(0, options.volume || 0.4));

  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // 生成短脈衝 (triangle wave)
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const phase = (t * frequency) % 1;
    const triangle = Math.abs((phase * 4) - 2) - 1;
    const envelope = Math.exp(-t * 40); // 極快衰減
    data[i] = triangle * envelope * volume;
  }

  return buffer;
}

/**
 * 生成 Vault 門開啟音
 * 使用低頻 + 掃頻效果模擬厚重金屬門
 *
 * @param audioContext - AudioContext 實例
 * @param destination - 音訊目標節點
 * @param options - 音效選項
 * @returns AudioBuffer
 */
export async function generateVaultDoor(
  audioContext: AudioContext,
  destination: AudioNode,
  options: SoundGeneratorOptions = {}
): Promise<AudioBuffer> {
  if (!audioContext) {
    throw new Error('AudioContext is required');
  }

  const startFrequency = Math.max(0, options.startFrequency || 120);
  const endFrequency = Math.max(0, options.endFrequency || 60);
  const duration = Math.max(0.5, options.duration || 2.0);
  const volume = Math.min(1, Math.max(0, options.volume || 0.6));

  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(2, length, sampleRate);

  // 雙聲道處理
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;

      // 頻率掃描（從高到低）
      const frequency = startFrequency + (endFrequency - startFrequency) * progress;

      // Envelope: 緩慢 attack, 長 sustain, 緩慢 release
      let envelope = 0;
      if (t < 0.2) {
        envelope = t / 0.2;
      } else if (t < duration - 0.5) {
        envelope = 1.0;
      } else {
        envelope = (duration - t) / 0.5;
      }

      // 混合 sine wave 和 sawtooth wave
      const sine = Math.sin(2 * Math.PI * frequency * t);
      const sawtooth = 2 * ((t * frequency) % 1) - 1;
      const mixed = (sine * 0.7 + sawtooth * 0.3) * envelope * volume;

      // 添加輕微的隨機噪音模擬金屬摩擦
      const noise = (Math.random() * 2 - 1) * 0.05;

      data[i] = mixed + noise * envelope;
    }
  }

  return buffer;
}

/**
 * 生成洗牌音效
 * 使用 filtered noise 模擬紙牌洗牌聲
 *
 * @param audioContext - AudioContext 實例
 * @param destination - 音訊目標節點
 * @param options - 音效選項
 * @returns AudioBuffer
 */
export async function generateShuffle(
  audioContext: AudioContext,
  destination: AudioNode,
  options: SoundGeneratorOptions = {}
): Promise<AudioBuffer> {
  if (!audioContext) {
    throw new Error('AudioContext is required');
  }

  const duration = Math.max(0.1, options.duration || 0.6);
  const volume = Math.min(1, Math.max(0, options.volume || 0.5));

  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // 生成多層 filtered noise 模擬洗牌
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const progress = t / duration;

    // 波動的 envelope
    const envelope = Math.sin(progress * Math.PI) * Math.sin(progress * Math.PI * 10);

    // Filtered white noise
    const noise = Math.random() * 2 - 1;
    data[i] = noise * envelope * volume;
  }

  return buffer;
}

/**
 * 生成揭示音效
 * 使用上升音階模擬神秘揭示
 *
 * @param audioContext - AudioContext 實例
 * @param destination - 音訊目標節點
 * @param options - 音效選項
 * @returns AudioBuffer
 */
export async function generateReveal(
  audioContext: AudioContext,
  destination: AudioNode,
  options: SoundGeneratorOptions = {}
): Promise<AudioBuffer> {
  if (!audioContext) {
    throw new Error('AudioContext is required');
  }

  const duration = Math.max(0.2, options.duration || 1.2);
  const volume = Math.min(1, Math.max(0, options.volume || 0.6));
  const startFrequency = Math.max(0, options.startFrequency || 200);
  const endFrequency = Math.max(0, options.endFrequency || 800);

  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;

      // 頻率掃描（從低到高，使用指數曲線）
      const frequency = startFrequency * Math.pow(endFrequency / startFrequency, progress);

      // Envelope
      const envelope = Math.sin(progress * Math.PI); // Bell curve

      // 混合 sine 和 triangle wave
      const sine = Math.sin(2 * Math.PI * frequency * t);
      const phase = (t * frequency) % 1;
      const triangle = Math.abs((phase * 4) - 2) - 1;

      data[i] = (sine * 0.6 + triangle * 0.4) * envelope * volume;
    }
  }

  return buffer;
}

/**
 * 生成 UI 懸停音效
 * 使用極短、柔和的高頻音提供微妙的音訊反饋
 * 需求: 為 UI 互動提供輕微的音效反饋，不干擾用戶體驗
 *
 * @param audioContext - AudioContext 實例
 * @param destination - 音訊目標節點
 * @param options - 音效選項
 * @returns AudioBuffer
 */
export async function generateUIHover(
  audioContext: AudioContext,
  destination: AudioNode,
  options: SoundGeneratorOptions = {}
): Promise<AudioBuffer> {
  if (!audioContext) {
    throw new Error('AudioContext is required');
  }

  const frequency = Math.max(0, options.frequency || 1200); // 較高頻率，更柔和
  const duration = Math.max(0.01, options.duration || 0.05); // 極短持續時間
  const volume = Math.min(1, Math.max(0, options.volume || 0.2)); // 低音量

  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // 生成柔和的 sine wave with 極快 envelope
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    // 極快衰減的 envelope (decay rate = 50)
    const envelope = Math.exp(-t * 50);
    // Pure sine wave 產生乾淨、柔和的音色
    data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * volume;
  }

  return buffer;
}

/**
 * 🟢 TDD P1: Generate typing sound effect
 * Short, crisp click sound for typewriter effect
 * Uses high-frequency sine wave with rapid decay
 *
 * @param audioContext - AudioContext instance
 * @param destination - Audio destination node
 * @param options - Sound generation options
 * @returns AudioBuffer
 */
export async function generateTypingSound(
  audioContext: AudioContext,
  destination: AudioNode,
  options: SoundGeneratorOptions = {}
): Promise<AudioBuffer> {
  if (!audioContext) {
    throw new Error('AudioContext is required');
  }

  const frequency = Math.max(0, options.frequency || 1200); // High frequency for crisp sound
  const duration = Math.max(0.01, options.duration || 0.03); // Very short duration
  const volume = Math.min(1, Math.max(0, options.volume || 0.3)); // Low volume

  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // Generate short click with rapid decay
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    // Very fast decay for click sound
    const envelope = Math.exp(-t * 100);
    // Sine wave for clean sound
    data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * volume;
  }

  return buffer;
}
