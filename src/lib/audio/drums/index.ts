/**
 * Drums Module - 程序式鼓組系統
 *
 * 匯出所有鼓組相關類別和類型
 */

export { NoiseGenerator } from './NoiseGenerator';
export { KickDrum, type KickDrumOptions, type KickDrumPreset } from './KickDrum';
export { SnareDrum, type SnareDrumOptions, type SnareDrumPreset } from './SnareDrum';
export { HiHat, type HiHatOptions, type HiHatPreset, type HiHatType } from './HiHat';
export { DrumKit, type DrumKitOptions, type DrumType } from './DrumKit';
export {
  DrumPatternEngine,
  type DrumPatternEngineOptions,
  type DrumPattern,
  type DrumHit,
  type PatternName,
  type TimeSignature,
} from './DrumPatternEngine';
