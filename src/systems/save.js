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
  // Pabrik per-kota (dari pabrik tunggal lama).
  if (!state.factories) {
    state.factories = {};
    CITIES.forEach((c) => { state.factories[c] = { owned: false, active: null }; });
    if (state.factory) {
      // Migrasi produksi tunggal lama ke pabrik kota yang sesuai (dianggap dimiliki).
      if (state.factory.active) {
        const r = FACTORY_RECIPES.find((x) => x.id === state.factory.active.recipeId);
        if (r && state.factories[r.city]) { state.factories[r.city].owned = true; state.factories[r.city].active = state.factory.active; }
      }
      delete state.factory;
    }
  }
  if (!state.processedGoods) { state.processedGoods = {}; FACTORY_RECIPES.forEach((r) => state.processedGoods[r.id] = 0); }
  if (!state.guildQuest) state.guildQuest = genGuildQuest();
  if (state.tradePoints === undefined) state.tradePoints = 0;
  if (state.upgradeParts === undefined) state.upgradeParts = 0;
  if (state.rebirthStones === undefined) state.rebirthStones = 0;
  if (state.classTransformed === undefined) state.classTransformed = false;
  if (state.lastTestTown === undefined) state.lastTestTown = Math.max(0, state.day - 7);
  if (!state.goldHistory) state.goldHistory = [{ day: state.day, gold: state.gold }];
  if (!state.playerName) state.playerName = 'Saudagar Kelana'; // save lama tanpa nama
  // Equip multi-slot: pindahkan armor lama (satu slot) ke slot 'badan',
  // lalu pastikan keempat slot pelindung ada.
  const eq = state.equipment;
  if (eq) {
    if (eq.armor !== undefined) { if (eq.badan == null) eq.badan = eq.armor; delete eq.armor; }
    ['kepala', 'badan', 'celana', 'sepatu'].forEach((s) => { if (eq[s] === undefined) eq[s] = null; });
  }
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
    // Level per anggota: backfill untuk save lama.
    if (g.level === undefined) { g.level = 1; g.exp = 0; g.expMax = 50; }
  });
}
