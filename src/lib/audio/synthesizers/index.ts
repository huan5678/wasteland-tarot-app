/**
 * Synthesizers Index
 * 導出所有合成器模組和工具函式
 */

// ADSR Envelope
export {
  ADSREnvelope,
  createADSRFromPreset,
  ADSR_PRESETS,
  type ADSRConfig,
} from './ADSREnvelope';

// Bass Synthesizer
export {
  BassSynthesizer,
  createBassFromPreset,
  BASS_PRESETS,
  BASS_NOTE_RANGE,
  type BassSynthConfig,
} from './BassSynthesizer';

// Pad Synthesizer
export {
  PadSynthesizer,
  createPadFromPreset,
  PAD_PRESETS,
  generateTriadFrequencies,
  generateSeventhFrequencies,
  type PadSynthConfig,
} from './PadSynthesizer';

// Lead Synthesizer
export {
  LeadSynthesizer,
  createLeadFromPreset,
  LEAD_PRESETS,
  LEAD_NOTE_RANGE,
  type LeadSynthConfig,
  type LFOConfig,
} from './LeadSynthesizer';

// Procedural Music Engine
export {
  ProceduralMusicEngine,
  createMusicEngine,
  CHORD_PROGRESSIONS,
  type MusicMode,
  type MusicEngineConfig,
  type ChordProgression,
  type ChordDefinition,
} from '../ProceduralMusicEngine';

/**
 * MIDI 工具函式 (共用)
 */
export { midiToFrequency } from './BassSynthesizer';
