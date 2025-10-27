/**
 * Waveform Analyzer
 *
 * Analyzes audio files using Web Audio API and extracts waveform data
 * for visual representation in audio players.
 */

/**
 * Waveform data structure
 */
export interface WaveformData {
  /** Normalized amplitude values (0-1) for each bar */
  peaks: number[]
  /** Duration of the audio in seconds */
  duration: number
  /** Sample rate used for analysis */
  sampleRate: number
}

/**
 * Options for waveform analysis
 */
export interface WaveformAnalysisOptions {
  /** Number of bars to generate (default: auto-calculated based on duration) */
  barCount?: number
  /** Minimum bar count (default: 50) */
  minBars?: number
  /** Maximum bar count (default: 200) */
  maxBars?: number
  /** Bars per second (used when barCount is not specified, default: 10) */
  barsPerSecond?: number
}

/**
 * Extract waveform data from an audio file URL
 *
 * @param audioUrl - URL of the audio file
 * @param options - Analysis options
 * @returns Promise resolving to waveform data
 */
export async function analyzeWaveform(
  audioUrl: string,
  options: WaveformAnalysisOptions = {}
): Promise<WaveformData> {
  const {
    barCount,
    minBars = 50,
    maxBars = 200,
    barsPerSecond = 10,
  } = options

  // Create audio context
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

  try {
    // Fetch audio file
    const response = await fetch(audioUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()

    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    // Calculate number of bars
    const duration = audioBuffer.duration
    const calculatedBarCount = barCount ?? Math.min(
      maxBars,
      Math.max(minBars, Math.floor(duration * barsPerSecond))
    )

    // Extract peaks
    const peaks = extractPeaks(audioBuffer, calculatedBarCount)

    return {
      peaks,
      duration,
      sampleRate: audioBuffer.sampleRate,
    }
  } finally {
    // Clean up audio context
    await audioContext.close()
  }
}

/**
 * Extract peak values from audio buffer
 *
 * @param audioBuffer - Decoded audio buffer
 * @param barCount - Number of bars to generate
 * @returns Array of normalized peak values (0-1)
 */
function extractPeaks(audioBuffer: AudioBuffer, barCount: number): number[] {
  const channelData = audioBuffer.getChannelData(0) // Use first channel (mono or left)
  const sampleSize = Math.floor(channelData.length / barCount)
  const peaks: number[] = []

  for (let i = 0; i < barCount; i++) {
    const start = i * sampleSize
    const end = Math.min(start + sampleSize, channelData.length)

    // Find peak (max absolute value) in this segment
    let peak = 0
    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j])
      if (abs > peak) {
        peak = abs
      }
    }

    peaks.push(peak)
  }

  // Normalize peaks to 0-1 range
  const maxPeak = Math.max(...peaks, 0.1) // Prevent division by zero
  return peaks.map(peak => peak / maxPeak)
}

/**
 * Calculate optimal bar count based on container width
 *
 * @param containerWidth - Width of the container in pixels
 * @param barWidth - Width of each bar in pixels (default: 2)
 * @param gap - Gap between bars in pixels (default: 1)
 * @param minBars - Minimum number of bars (default: 50)
 * @param maxBars - Maximum number of bars (default: 300)
 * @returns Optimal number of bars
 */
export function calculateBarCount(
  containerWidth: number,
  barWidth: number = 2,
  gap: number = 1,
  minBars: number = 50,
  maxBars: number = 300
): number {
  const barTotalWidth = barWidth + gap
  const calculatedBars = Math.floor(containerWidth / barTotalWidth)
  return Math.min(maxBars, Math.max(minBars, calculatedBars))
}

/**
 * Resample waveform data to a different bar count
 * Useful for responsive design when container width changes
 *
 * @param originalPeaks - Original peak data
 * @param newBarCount - New number of bars
 * @returns Resampled peak data
 */
export function resampleWaveform(originalPeaks: number[], newBarCount: number): number[] {
  if (originalPeaks.length === newBarCount) {
    return originalPeaks
  }

  const resampled: number[] = []
  const ratio = originalPeaks.length / newBarCount

  for (let i = 0; i < newBarCount; i++) {
    const start = Math.floor(i * ratio)
    const end = Math.floor((i + 1) * ratio)

    // Average the values in this range
    let sum = 0
    let count = 0
    for (let j = start; j < end; j++) {
      sum += originalPeaks[j] || 0
      count++
    }

    resampled.push(count > 0 ? sum / count : 0)
  }

  return resampled
}

/**
 * Generate fallback waveform data (for Web Speech API mode or errors)
 * Creates a semi-random but consistent waveform pattern
 *
 * @param barCount - Number of bars
 * @param seed - Seed for random generation (default: 42)
 * @returns Fallback waveform data
 */
export function generateFallbackWaveform(barCount: number, seed: number = 42): number[] {
  const peaks: number[] = []
  let random = seed

  // Simple pseudo-random number generator
  const seededRandom = () => {
    random = (random * 9301 + 49297) % 233280
    return random / 233280
  }

  for (let i = 0; i < barCount; i++) {
    // Create a wave-like pattern with some randomness
    const wave = Math.sin(i / barCount * Math.PI * 4) * 0.3 + 0.5
    const noise = seededRandom() * 0.3
    peaks.push(Math.min(1, Math.max(0.1, wave + noise)))
  }

  return peaks
}
