// ============================================================
// src/world/loop.js — game loop requestAnimationFrame, fixed timestep.
// Update jalan 60 Hz deterministik; render tiap frame.
// ============================================================

export function startLoop(update, render) {
  const STEP = 1 / 60;
  let last = performance.now();
  let acc = 0;
  let running = true;

  function frame(now) {
    if (!running) return;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25; // jeda tab: jangan kejar ketinggalan jauh
    acc += dt;
    while (acc >= STEP) { update(STEP); acc -= STEP; }
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return () => { running = false; };
}
