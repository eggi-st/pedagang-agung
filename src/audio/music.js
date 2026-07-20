import { ensureAudio } from './sfx.js';

export let musicOn = true;
let musicTimer = null;
let musicToken = 0;
let currentTrack = null;
let sharedAudioCtx = null;

const EXPLORE_SEQ = [261.63, 0, 293.66, 329.63, 0, 392.0, 440.0, 392.0, 329.63, 0, 293.66, 261.63, 0, 0, 220.0, 0];
const BATTLE_SEQ = [220.0, 246.94, 220.0, 196.0, 220.0, 246.94, 261.63, 246.94, 220.0, 196.0, 174.61, 196.0, 220.0, 246.94, 220.0, 174.61];
const VICTORY_SEQ = [392.0, 392.0, 392.0, 523.25, 659.25, 0, 659.25, 783.99];

function getCtx() {
  ensureAudio();
  // sfx.js owns the actual AudioContext instance; this module just needs `window`'s shared one.
  return window.__pedagangAudioCtx || (window.__pedagangAudioCtx = new (window.AudioContext || window.webkitAudioContext)());
}

function musicNote(freq, dur, type = 'triangle', vol = 0.035) {
  if (!musicOn || freq <= 0) return;
  const ctx = getCtx();
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  o.stop(ctx.currentTime + dur);
}

function scheduleLoop(seq, noteDur, token) {
  let i = 0;
  (function step() {
    if (token !== musicToken || !musicOn) return;
    const freq = seq[i % seq.length];
    if (freq > 0) musicNote(freq, noteDur * 0.85);
    i++;
    musicTimer = setTimeout(step, noteDur * 1000);
  })();
}

export function playMusic(track) {
  currentTrack = track;
  musicToken++;
  const token = musicToken;
  clearTimeout(musicTimer);
  if (!musicOn) return;
  if (track === 'explore') scheduleLoop(EXPLORE_SEQ, 0.26, token);
  else if (track === 'battle') scheduleLoop(BATTLE_SEQ, 0.16, token);
}

export function stopMusic() {
  musicToken++;
  clearTimeout(musicTimer);
}

export function toggleMusic(labelEl) {
  musicOn = !musicOn;
  if (labelEl) labelEl.textContent = musicOn ? '🎵 Musik' : '🎵 Off';
  if (musicOn && currentTrack) playMusic(currentTrack);
  else stopMusic();
  return musicOn;
}

export function playVictoryJingle() {
  if (!musicOn) return;
  VICTORY_SEQ.forEach((freq, i) => {
    if (freq > 0) setTimeout(() => musicNote(freq, 0.18, 'square', 0.04), i * 140);
  });
}
