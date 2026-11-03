// ============================================================
// src/world/camera.js — kamera follow dengan smoothing + clamp.
// Semua satuan dalam "game pixel" (sudah termasuk skala).
// ============================================================

export function createCamera(viewW, viewH) {
  return { x: 0, y: 0, w: viewW, h: viewH };
}

export function snapCamera(cam, tx, ty) {
  cam.x = tx - cam.w / 2;
  cam.y = ty - cam.h / 2;
}

// Ikuti target (tx, ty) dengan lerp, lalu clamp ke batas peta.
export function followCamera(cam, tx, ty, dt, mapW, mapH) {
  const k = 1 - Math.pow(0.0001, dt); // smoothing framerate-independent
  cam.x += (tx - cam.w / 2 - cam.x) * k;
  cam.y += (ty - cam.h / 2 - cam.y) * k;
  clampCamera(cam, mapW, mapH);
}

export function clampCamera(cam, mapW, mapH) {
  cam.x = Math.max(0, Math.min(Math.max(0, mapW - cam.w), cam.x));
  cam.y = Math.max(0, Math.min(Math.max(0, mapH - cam.h), cam.y));
}
