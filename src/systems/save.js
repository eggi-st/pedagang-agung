// Penyimpanan ke localStorage dan migrasi save lama.
//
// Sengaja hanya berisi I/O murni. Alur layar yang memakainya
// (renderSlotRow, initContinueSlot, continueGame, confirmReset) masih di
// game.js karena menyentuh DOM dan endGame — dipisah belakangan setelah
// lapisan UI dipecah.

import { state, dungeonState } from '../state.js';
import { rand } from '../core/rng.js';
import { genGuildQuest } from './generators.js';
import { CITIES } from '../data/world.js';
import { ELEMENTS } from '../data/elements.js';
import { FACTORY_RECIPES } from '../data/economy.js';

export const SAVE_PREFIX = 'pedagangAgungSave_slot';

export function saveGame() {
  if (!state) return;
  try {
    localStorage.setItem(SAVE_PREFIX + state.currentSlot, JSON.stringify({ state, dungeonState }));
  } catch (e) { /* kuota penuh atau mode privat — abaikan, jangan sampai game mati */ }
}

export function loadSavedGame(slot) {
  try {
    const raw = localStorage.getItem(SAVE_PREFIX + slot);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

export function clearSave(slot) {
  try { localStorage.removeItem(SAVE_PREFIX + slot); } catch (e) { /* abaikan */ }
}

/**
 * Menambal save lama yang dibuat sebelum sebuah fitur ada, supaya pemain
 * lama tidak kehilangan progres saat game diperbarui.
 */
export function migrateState() {
  if (!state) return;
  if (!state.factory) state.factory = { active: null };
  if (!state.processedGoods) { state.processedGoods = {}; FACTORY_RECIPES.forEach((r) => state.processedGoods[r.id] = 0); }
  if (!state.guildQuest) state.guildQuest = genGuildQuest();
  if (state.tradePoints === undefined) state.tradePoints = 0;
  if (state.upgradeParts === undefined) state.upgradeParts = 0;
  if (state.rebirthStones === undefined) state.rebirthStones = 0;
  if (state.classTransformed === undefined) state.classTransformed = false;
  if (state.lastTestTown === undefined) state.lastTestTown = Math.max(0, state.day - 7);
  if (!state.goldHistory) state.goldHistory = [{ day: state.day, gold: state.gold }];
  // Save lama belum punya baseline harga: pakai harga saat ini sebagai patokan.
  if (!state.basePrices) state.basePrices = {};
  CITIES.forEach((c) => {
    if (!state.cityUpgrades[c]) state.cityUpgrades[c] = { gudang: 0, benteng: 0 };
    if (state.cityUpgrades[c].benteng === undefined) state.cityUpgrades[c].benteng = 0;
    if (!state.basePrices[c] && state.prices[c]) state.basePrices[c] = { ...state.prices[c] };
  });
  state.generals.forEach((g) => {
    if (!g.elem) g.elem = ELEMENTS[rand(0, ELEMENTS.length - 1)];
    if (g.rebirthBonus === undefined) g.rebirthBonus = 0;
  });
}
