let audioCtx = null;
export let soundOn = true;

export function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* unsupported */ }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

export function beep(freq, dur, type) {
  if (!soundOn) return;
  ensureAudio();
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type || 'square';
  o.frequency.value = freq;
  g.gain.value = 0.08;
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.stop(audioCtx.currentTime + dur);
}

export function sfx(name) {
  switch (name) {
    case 'buy': beep(440, 0.08); break;
    case 'sell': beep(330, 0.08); break;
    case 'win': beep(523, 0.12); setTimeout(() => beep(659, 0.12), 100); setTimeout(() => beep(784, 0.16), 200); break;
    case 'lose': beep(180, 0.2, 'sawtooth'); break;
    case 'levelup': beep(392, 0.1); setTimeout(() => beep(523, 0.1), 100); setTimeout(() => beep(659, 0.15), 200); break;
    case 'dungeon': beep(196, 0.15); setTimeout(() => beep(261, 0.2), 150); break;
    case 'error': beep(120, 0.15, 'sawtooth'); break;
    case 'craft': beep(587, 0.1); setTimeout(() => beep(784, 0.15), 100); break;
    case 'quest': beep(659, 0.08); setTimeout(() => beep(880, 0.12), 90); break;
    default: break;
  }
}

export function toggleMute(onLabelEl) {
  soundOn = !soundOn;
  if (onLabelEl) onLabelEl.textContent = soundOn ? '🔊 Suara' : '🔇 Bisu';
  if (soundOn) beep(440, 0.06);
  return soundOn;
}

export function haptic(pattern) {
  if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) { /* unsupported */ } }
}
