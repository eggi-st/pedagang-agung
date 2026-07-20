// Overlay kejadian (event) — panel modal yang menahan alur permainan
// sampai pemain menekan "Lanjutkan".
//
// Callback disimpan di modul ini, bukan di pemanggil, supaya closeEvent()
// bisa dipanggil dari mana saja (termasuk atribut onclick di markup).

import { addLog } from '../systems/character.js';
import { render, checkEndConditions } from '../core/bus.js';

let eventCallback = null;

/**
 * @param {string} title  judul overlay
 * @param {string} desc   isi pesan (ikut dicatat ke log perjalanan)
 * @param {Function} [cb] dijalankan saat pemain menutup overlay; kalau
 *                        kosong, game hanya merender ulang.
 */
export function showEvent(title, desc, cb) {
  document.getElementById('event-title').textContent = title;
  document.getElementById('event-desc').textContent = desc;
  const ov = document.getElementById('event-overlay');
  ov.style.display = 'flex';
  // Reflow paksa supaya animasi masuk terpicu ulang walau kelasnya sama.
  ov.classList.remove('overlay-anim'); void ov.offsetWidth; ov.classList.add('overlay-anim');
  eventCallback = cb || null;
  addLog(desc);
}

export function closeEvent() {
  document.getElementById('event-overlay').style.display = 'none';
  const cb = eventCallback;
  eventCallback = null;
  if (cb) cb();
  else if (!checkEndConditions()) render();
}
