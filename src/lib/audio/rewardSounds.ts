/**
 * Reward Sound Effects
 * 獎勵通知音效（程序化生成）
 */

/**
 * 播放獎勵慶祝音效
 * 使用 Web Audio API 生成愉快的上升音效
 */
export function playRewardSound(): void {
  // 確保在瀏覽器環境中執行
  if (typeof window === 'undefined' || !window.AudioContext) {
    return;
  }

  try {
    // 建立 AudioContext（如果不存在）
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;

    // 建立增益節點（控制音量）
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);

    // 設定音量包絡（ADSR）
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05); // Attack
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.15); // Decay
    gainNode.gain.setValueAtTime(0.2, now + 0.4); // Sustain
    gainNode.gain.linearRampToValueAtTime(0, now + 0.6); // Release

    // 播放上升音階（C - E - G - C，歡樂和弦）
    const notes = [
      { freq: 523.25, time: 0 },    // C5
      { freq: 659.25, time: 0.1 },  // E5
      { freq: 783.99, time: 0.2 },  // G5
      { freq: 1046.50, time: 0.3 }, // C6
    ];

    notes.forEach(({ freq, time }) => {
      const osc = audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);
      osc.connect(gainNode);
      osc.start(now + time);
      osc.stop(now + time + 0.15);
    });

  } catch (error) {
    // 靜默失敗，不影響應用程式運行
    console.warn('[RewardSounds] Failed to play reward sound:', error);
  }
}

/**
 * 播放成就解鎖音效
 * 使用 Web Audio API 生成更豐富的音效（帶有閃光效果）
 */
export function playAchievementSound(): void {
  // 確保在瀏覽器環境中執行
  if (typeof window === 'undefined' || !window.AudioContext) {
    return;
  }

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;

    // 主音效（上升音階）
    const mainGain = audioContext.createGain();
    mainGain.connect(audioContext.destination);
    mainGain.gain.setValueAtTime(0, now);
    mainGain.gain.linearRampToValueAtTime(0.25, now + 0.05);
    mainGain.gain.linearRampToValueAtTime(0.15, now + 0.2);
    mainGain.gain.setValueAtTime(0.15, now + 0.6);
    mainGain.gain.linearRampToValueAtTime(0, now + 0.8);

    // 播放主音階
    const mainNotes = [
      { freq: 659.25, time: 0 },    // E5
      { freq: 783.99, time: 0.08 }, // G5
      { freq: 987.77, time: 0.16 }, // B5
      { freq: 1318.51, time: 0.24 },// E6
    ];

    mainNotes.forEach(({ freq, time }) => {
      const osc = audioContext.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);
      osc.connect(mainGain);
      osc.start(now + time);
      osc.stop(now + time + 0.2);
    });

    // 閃光音效（高頻脈衝）
    const sparkleGain = audioContext.createGain();
    sparkleGain.connect(audioContext.destination);
    sparkleGain.gain.setValueAtTime(0, now + 0.3);
    sparkleGain.gain.linearRampToValueAtTime(0.15, now + 0.32);
    sparkleGain.gain.linearRampToValueAtTime(0, now + 0.5);

    const sparkle = audioContext.createOscillator();
    sparkle.type = 'sine';
    sparkle.frequency.setValueAtTime(2093, now + 0.3); // C7
    sparkle.frequency.exponentialRampToValueAtTime(4186, now + 0.5); // C8
    sparkle.connect(sparkleGain);
    sparkle.start(now + 0.3);
    sparkle.stop(now + 0.5);

  } catch (error) {
    // 靜默失敗
    console.warn('[RewardSounds] Failed to play achievement sound:', error);
  }
}
