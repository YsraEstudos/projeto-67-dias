/**
 * Audio helpers for Pomodoro timer.
 * Uses a shared AudioContext singleton to avoid resource leaks.
 */

interface WebkitWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (sharedCtx) {
    if (sharedCtx.state === 'suspended') {
      sharedCtx.resume().catch((err) => {
        console.warn('[PomodoroAudio] Failed to resume suspended AudioContext:', err);
      });
    }
    return sharedCtx;
  }

  const Ctor = (window.AudioContext || (window as WebkitWindow).webkitAudioContext) as typeof AudioContext | undefined;
  if (!Ctor) return null;

  try {
    sharedCtx = new Ctor();
    return sharedCtx;
  } catch (e) {
    console.error('[PomodoroAudio] Failed to create AudioContext:', e);
    return null;
  }
}

export function playSound(type: 'work-end' | 'break-end', volume: number = 0.5) {
  try {
    if (volume <= 0) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    if (type === 'work-end') {
      playTone(ctx, 440, 'sine', 0, 0.5, volume);
      playTone(ctx, 554.37, 'sine', 0.1, 0.5, volume);
      playTone(ctx, 659.25, 'sine', 0.2, 0.8, volume);
    } else {
      playTone(ctx, 880, 'square', 0, 0.15, volume);
      playTone(ctx, 880, 'square', 0.25, 0.15, volume);
      playTone(ctx, 880, 'square', 0.5, 0.4, volume);
    }
  } catch (e) {
    console.error(`[PomodoroAudio] Failed to play "${type}" sound:`, e);
  }
}

export function playAlertFailSound(volume: number = 0.5) {
  try {
    if (volume <= 0) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    playTone(ctx, 150, 'sawtooth', 0, 0.3, volume);
    playTone(ctx, 120, 'sawtooth', 0.15, 0.3, volume);
    playTone(ctx, 150, 'sawtooth', 0.3, 0.3, volume);
    playTone(ctx, 120, 'sawtooth', 0.45, 0.3, volume);
  } catch (e) {
    console.error('[PomodoroAudio] Failed to play alert fail sound:', e);
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  delay: number,
  duration: number,
  volume: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;

  osc.connect(gain);
  gain.connect(ctx.destination);

  const startTime = ctx.currentTime + delay;
  const endTime = startTime + duration;

  // Start at 0, ramp up smoothly, then fade out
  // Max gain capped at 0.3 to keep sounds gentle even at 100%
  const maxGain = 0.3;
  const normalizedVolume = Math.min(volume / 100, 1);
  const peakGain = normalizedVolume * maxGain;
  
  gain.gain.setValueAtTime(0, startTime - 0.001);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
  gain.gain.setValueAtTime(peakGain, startTime + 0.01);
  gain.gain.linearRampToValueAtTime(Math.max(0.001, peakGain * 0.8), endTime - 0.05);
  gain.gain.linearRampToValueAtTime(0, endTime);

  osc.start(startTime);
  osc.stop(endTime + 0.1);
}
