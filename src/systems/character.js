// Perhitungan turunan karakter: ATK, DEF, kontribusi aksesoris, dan
// dua penyunting state kecil yang dipakai hampir semua sistem lain
// (addLog dan gainGold).

import { state } from '../state.js';
import { WEAPONS, ARMORS, ARMOR_SLOTS } from '../data/economy.js';

export function addLog(msg) {
  state.log.unshift(`Hari ${state.day}: ${msg}`);
  if (state.log.length > 40) state.log.pop();
}

export function gainGold(amount) {
  state.gold += amount;
  state.stats.totalGoldEarned += Math.max(0, amount);
}

/** Total bonus dari kedua slot aksesoris yang sedang terpasang. */
export function accessoryContribution() {
  let atk = 0, def = 0, str = 0, agi = 0;
  [state.equipment.accessory1, state.equipment.accessory2].forEach((uid) => {
    if (!uid) return;
    const it = state.items.find((i) => i.uid === uid);
    if (!it) return;
    if (it.type === 'offensive') atk += it.bonus;
    else if (it.type === 'defensive') def += it.bonus;
    else { atk += Math.round(it.bonus * 0.4); def += Math.round(it.bonus * 0.4); str += 1; agi += 1; }
  });
  return { atk, def, str, agi };
}

export function currentWeaponAtk() {
  return state.equipment.weapon ? WEAPONS.find((w) => w.id === state.equipment.weapon).atk : 0;
}

/** Total DEF dari semua slot pelindung tubuh yang terpasang. */
export function currentArmorDef() {
  return ARMOR_SLOTS.reduce((sum, s) => {
    const id = state.equipment[s.key];
    if (!id) return sum;
    const a = ARMORS.find((x) => x.id === id);
    return sum + (a ? a.def : 0);
  }, 0);
}

export function getAtk() {
  const c = state.char;
  return Math.round((c.str + accessoryContribution().str) * 1.5 + currentWeaponAtk() + accessoryContribution().atk + (c.classAtkBonus || 0));
}

export function getDef() {
  const c = state.char;
  return Math.round((c.agi + accessoryContribution().agi) * 0.5 + currentArmorDef() + accessoryContribution().def);
}

/** Bonus harga jual dari reputasi di sebuah kota, dibatasi 20%. */
export function reputationBonusPct(city) {
  return Math.min(20, Math.floor((state.reputation[city] || 0) / 5));
}
