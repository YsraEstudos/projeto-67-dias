export function playSound(type: 'work-end' | 'break-end', volume: number = 0.5) {
  try {
    if (volume <= 0) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    
    if (type === 'work-end') {
      // Relaxing chime (Pomodoro finished, time to rest)
      playTone(ctx, 440, 'sine', 0, 0.5, volume);
      playTone(ctx, 554.37, 'sine', 0.1, 0.5, volume);
      playTone(ctx, 659.25, 'sine', 0.2, 0.8, volume);
    } else {
      // Alert beep (Break finished, time to work)
      playTone(ctx, 880, 'square', 0, 0.15, volume);
      playTone(ctx, 880, 'square', 0.25, 0.15, volume);
      playTone(ctx, 880, 'square', 0.5, 0.4, volume);
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
}

export function playAlertFailSound(volume: number = 0.5) {
  try {
    if (volume <= 0) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play a repeating low discordant sawtooth alarm
    playTone(ctx, 150, 'sawtooth', 0, 0.3, volume);
    playTone(ctx, 120, 'sawtooth', 0.15, 0.3, volume);
    playTone(ctx, 150, 'sawtooth', 0.3, 0.3, volume);
    playTone(ctx, 120, 'sawtooth', 0.45, 0.3, volume);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
}

function playTone(ctx: AudioContext, freq: number, type: OscillatorType, delay: number, duration: number, volume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.value = freq;
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  const startTime = ctx.currentTime + delay;
  
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  
  osc.start(startTime);
  osc.stop(startTime + duration);
}
