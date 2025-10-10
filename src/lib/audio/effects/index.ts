/**
 * Synthwave Lofi Audio Effects
 * Web Audio 音效處理器模組
 *
 * 包含 6 個專業音效處理器：
 * - Gated Reverb: Synthwave 標誌性混響效果
 * - Ping-pong Delay: 立體聲乒乓延遲
 * - Chorus: 音色寬度和溫暖感增強
 * - Pitch Warble: Lofi 音高不穩定 (磁帶效果)
 * - Tape Saturation: 類比磁帶飽和失真
 * - Bit Crusher: Lofi 數位失真
 *
 * 使用範例:
 * ```ts
 * import { EffectChain, SYNTHWAVE_LOFI_PRESET } from '@/lib/audio/effects';
 *
 * const chain = new EffectChain(audioContext);
 * chain.loadPreset(SYNTHWAVE_LOFI_PRESET);
 * chain.startEffects();
 *
 * source.connect(chain.input);
 * chain.output.connect(audioContext.destination);
 * ```
 */

// Effect processors
export { GatedReverb, type GatedReverbParams } from './GatedReverb';
export { PingPongDelay, type PingPongDelayParams } from './PingPongDelay';
export { Chorus, type ChorusParams } from './Chorus';
export { PitchWarble, type PitchWarbleParams } from './PitchWarble';
export { TapeSaturation, type TapeSaturationParams } from './TapeSaturation';
export { BitCrusher, type BitCrusherParams } from './BitCrusher';

// Effect chain manager
export {
  EffectChain,
  type EffectType,
  type EffectParams,
  type EffectInstance,
  type EffectConfig,
  RECOMMENDED_ORDER,
  SYNTHWAVE_LOFI_PRESET,
  SYNTHWAVE_PRESET,
  HEAVY_LOFI_PRESET,
} from './EffectChain';
