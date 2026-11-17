/**
 * Web Audio API Synthesizer & Phone Vibration Engine
 * Generates zero-latency, high-fidelity chimes and haptics without requiring MP3 assets.
 * Works 100% offline and handles mobile browser gesture unlocking.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Prime and unlock the Web Audio API context on mobile touch/click
 */
export function unlockAudioContext(): boolean {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    // Play an inaudible 1ms buffer to satisfy iOS Safari/Chrome autoplay policy
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    return true;
  } catch (err) {
    console.warn('[AudioChime] Failed to unlock audio context:', err);
    return false;
  }
}

/**
 * Play a single pure synthetic tone with an exponential decay envelope
 */
function playTone(
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainLevel: number = 0.3
) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(gainLevel, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch (err) {
    console.warn('[AudioChime] Play tone error:', err);
  }
}

/**
 * Ascending 3-Tone Chime + Mobile Vibration (Apple/Google Style)
 * Triggered on: Class Rescheduled, Venue Swap, Class Cancelled
 */
export function playVenueChangeChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Ascending chord: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
    playTone(523.25, now + 0.00, 0.28, 'sine', 0.35);
    playTone(659.25, now + 0.15, 0.32, 'sine', 0.35);
    playTone(783.99, now + 0.30, 0.55, 'triangle', 0.45);

    // Haptic vibration: buzz-buzz-buzz
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
  } catch (err) {
    console.warn('[AudioChime] Venue change chime error:', err);
  }
}

/**
 * Gentle Dual Harmonic Bell
 * Triggered at: 30 minutes before class start
 */
export function playThirtyMinReminder() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Harmonic bell: A4 (440Hz) -> C#5 (554Hz)
    playTone(440.00, now + 0.00, 0.45, 'sine', 0.3);
    playTone(554.37, now + 0.20, 0.65, 'triangle', 0.35);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([150, 100, 150]);
    }
  } catch (err) {
    console.warn('[AudioChime] 30m reminder chime error:', err);
  }
}

/**
 * Urgent Double Pulse Alert + Vibration
 * Triggered at: 10 minutes before class start
 */
export function playTenMinUrgentReminder() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Urgent double pulse: E5 (659Hz) twice in rapid succession
    playTone(659.25, now + 0.00, 0.16, 'sawtooth', 0.25);
    playTone(659.25, now + 0.18, 0.30, 'triangle', 0.35);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([300, 150, 300]);
    }
  } catch (err) {
    console.warn('[AudioChime] 10m reminder chime error:', err);
  }
}

/**
 * Trigger Native Service Worker Notification
 */
export async function triggerSystemNotification(title: string, body: string) {
  if (typeof window === 'undefined') return;

  // 1. Try Service Worker showNotification (works on mobile lockscreen)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        reg.showNotification(title, {
          body,
          icon: '/icons/icon-192.svg',
          badge: '/icons/icon-192.svg',
          tag: `timy-${Date.now()}`,
          ...( { vibrate: [200, 100, 200, 100, 400] } as any ),
        });
        return;
      }
    } catch (e) {
      console.warn('[Notification] Service Worker notification error:', e);
    }
  }

  // 2. Fallback to standard Notification API
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icons/icon-192.svg',
    });
  }
}
