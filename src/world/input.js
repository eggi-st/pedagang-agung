// ============================================================
// src/world/input.js — keyboard (WASD/panah + E) dan joystick sentuh.
// State dibaca tiap tick oleh player.js. DOM-free saat import.
// ============================================================

export function createInput() {
  return {
    up: false, down: false, left: false, right: false,
    interact: false,      // true selama tombol E / ketuk prompt ditekan
    interactPressed: false, // true hanya pada frame tombol baru ditekan
    attack: false,        // true selama tombol serang ditekan
    attackPressed: false, // true hanya pada frame tombol serang baru ditekan
    skill1: false, skill1Pressed: false, // Tebasan Api (K)
    skill2: false, skill2Pressed: false, // Dash (L)
    joyX: 0, joyY: 0,     // vektor joystick analog (-1..1)
    joyActive: false,
  };
}

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

export function attachKeyboard(input) {
  const down = (e) => {
    const k = KEYMAP[e.code];
    if (k) { input[k] = true; e.preventDefault(); }
    if (e.code === 'KeyE' || e.code === 'Enter') {
      if (!input.interact) input.interactPressed = true;
      input.interact = true;
      e.preventDefault();
    }
    if (e.code === 'Space' || e.code === 'KeyJ') {
      if (!input.attack) input.attackPressed = true;
      input.attack = true;
      e.preventDefault();
    }
    if (e.code === 'KeyK') {
      if (!input.skill1) input.skill1Pressed = true;
      input.skill1 = true;
      e.preventDefault();
    }
    if (e.code === 'KeyL') {
      if (!input.skill2) input.skill2Pressed = true;
      input.skill2 = true;
      e.preventDefault();
    }
    // Hotkey menu: C=Status, I=Tas, U=Equip, P=Party. Esc=tutup.
    const menuKey = { KeyC: 'status', KeyI: 'tas', KeyU: 'equip', KeyP: 'party' }[e.code];
    if (menuKey) {
      if (!input.menuPressed) { input.menuPressed = true; input.menuTab = menuKey; }
      e.preventDefault();
    }
    if (e.code === 'Escape') {
      if (!input.escapePressed) input.escapePressed = true;
      e.preventDefault();
    }
  };
  const up = (e) => {
    const k = KEYMAP[e.code];
    if (k) input[k] = false;
    if (e.code === 'KeyE' || e.code === 'Enter') input.interact = false;
    if (e.code === 'Space' || e.code === 'KeyJ') input.attack = false;
    if (e.code === 'KeyK') input.skill1 = false;
    if (e.code === 'KeyL') input.skill2 = false;
    if (['KeyC', 'KeyI', 'KeyU', 'KeyP'].includes(e.code)) input.menuPressed = false;
    if (e.code === 'Escape') input.escapePressed = false;
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
  };
}

// Joystick virtual: sentuh paruh kiri layar = area joystick (origin dinamis).
export function attachTouch(input, el) {
  let joyId = null, ox = 0, oy = 0;
  const R = 56; // radius joystick (px layar)

  const setKnob = (dx, dy) => {
    const len = Math.hypot(dx, dy) || 1;
    const cl = Math.min(len, R);
    const nx = dx / len, ny = dy / len;
    input.joyX = (nx * cl) / R;
    input.joyY = (ny * cl) / R;
    input.joyActive = true;
    const knob = document.getElementById('joy-knob');
    const base = document.getElementById('joy-base');
    if (knob && base) {
      base.style.display = 'block';
      base.style.left = (ox - R) + 'px';
      base.style.top = (oy - R) + 'px';
      knob.style.transform = `translate(${nx * cl}px, ${ny * cl}px)`;
    }
  };
  const clearKnob = () => {
    input.joyX = 0; input.joyY = 0; input.joyActive = false;
    const base = document.getElementById('joy-base');
    if (base) base.style.display = 'none';
  };

  const onStart = (e) => {
    for (const t of e.changedTouches) {
      // Abaikan sentuhan pada tombol/prompt (mereka punya handler sendiri).
      if (t.target.closest && t.target.closest('[data-ui]')) continue;
      if (joyId === null && t.clientX < window.innerWidth * 0.6) {
        joyId = t.identifier; ox = t.clientX; oy = t.clientY;
        setKnob(0, 0);
        e.preventDefault();
      }
    }
  };
  const onMove = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyId) { setKnob(t.clientX - ox, t.clientY - oy); e.preventDefault(); }
    }
  };
  const onEnd = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyId) { joyId = null; clearKnob(); }
    }
  };
  el.addEventListener('touchstart', onStart, { passive: false });
  el.addEventListener('touchmove', onMove, { passive: false });
  el.addEventListener('touchend', onEnd);
  el.addEventListener('touchcancel', onEnd);
  return () => {
    el.removeEventListener('touchstart', onStart);
    el.removeEventListener('touchmove', onMove);
    el.removeEventListener('touchend', onEnd);
    el.removeEventListener('touchcancel', onEnd);
  };
}

// Dipanggil di akhir tiap tick untuk reset edge-trigger.
export function endTick(input) {
  input.interactPressed = false;
  input.attackPressed = false;
  input.skill1Pressed = false;
  input.skill2Pressed = false;
  input.menuPressed = false;
  input.escapePressed = false;
}
