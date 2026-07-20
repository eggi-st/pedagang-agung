// INDIREKSI UI <-> SISTEM.
//
// Masalah yang dipecahkan: hampir setiap fungsi sistem diakhiri render(),
// sedangkan render() sendiri memanggil balik banyak fungsi sistem. Kalau
// sistem mengimpor modul UI secara langsung, terbentuk impor melingkar —
// dan itu berbahaya di sini karena game.js punya efek samping saat modul
// dievaluasi (renderSlotRow/initContinueSlot dijalankan di akhir berkas).
//
// Solusinya: sistem memanggil lewat perantara ini, dan lapisan yang
// memiliki implementasinya mendaftarkan diri lewat registerHooks().
// Dengan begitu arah impor selalu satu arah: sistem -> bus.

const hooks = {
  render: () => {},
  renderBattle: () => {},
  startBattle: () => {},
  checkEndConditions: () => false,
  endGame: () => {},
};

/** Dipanggil sekali oleh pemilik implementasi (saat ini game.js). */
export function registerHooks(next) {
  Object.assign(hooks, next);
}

// Dibungkus fungsi, bukan diekspor langsung, supaya selalu memanggil
// versi terbaru yang terdaftar — bukan nilai kosong saat modul dimuat.
export const render = (...args) => hooks.render(...args);
export const renderBattle = (...args) => hooks.renderBattle(...args);
export const startBattle = (...args) => hooks.startBattle(...args);
export const checkEndConditions = (...args) => hooks.checkEndConditions(...args);
export const endGame = (...args) => hooks.endGame(...args);
