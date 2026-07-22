// Pasukan jendral: rekrutmen, urutan formasi (indeks 0 = garda depan),
// promosi pangkat, dan penguatan permanen lewat Rebirth Stone.

import { state } from '../state.js';
import { render } from '../core/bus.js';
import { addLog } from './character.js';
import { RANK_NAMES, MAX_GENERALS } from '../data/mercenaries/index.js';
import { WEAPONS } from '../data/economy.js';
import { sfx } from '../audio/sfx.js';

// ---------- SENJATA PASUKAN ----------
// Tiap anggota pasukan (jendral & monster) bisa dipasangi senjata cadangan.
// Senjata menambah ATK dan MENGGANTI elemen anggota (untuk strategi counter).

/** Objek senjata yang terpasang pada anggota, atau null. */
export function memberWeapon(m) {
  return m && m.weapon ? WEAPONS.find((w) => w.id === m.weapon) || null : null;
}
/** ATK efektif = ATK dasar + ATK senjata terpasang. */
export function memberAtk(m) {
  const w = memberWeapon(m);
  return m.atk + (w ? w.atk : 0);
}
/** Elemen efektif = elemen senjata bila terpasang, jika tidak elemen bawaan. */
export function memberElem(m) {
  const w = memberWeapon(m);
  return w ? w.elem : m.elem;
}

/** Senjata yang boleh dipasang ke anggota idx: dimiliki, bukan senjata pemain,
 *  bukan dipakai anggota lain. (Senjata anggota ini sendiri tetap disertakan.) */
export function availableWeaponsFor(idx) {
  return state.ownedWeapons.filter((id) => {
    if (id === state.equipment.weapon) return false;
    const usedByOther = state.generals.some((o, i) => i !== idx && o.weapon === id);
    return !usedByOther;
  });
}

export function equipGeneralWeapon(idx, weaponId) {
  const g = state.generals[idx];
  if (!g) return;
  if (!weaponId) { g.weapon = null; render(); return; } // lepas senjata
  if (!state.ownedWeapons.includes(weaponId)) return;
  if (state.equipment.weapon === weaponId) return;
  if (state.generals.some((o, i) => i !== idx && o.weapon === weaponId)) return;
  g.weapon = weaponId;
  sfx('buy');
  const w = WEAPONS.find((x) => x.id === weaponId);
  addLog(`${g.name} dipersenjatai ${w.name} (elemen ${w.elem}).`);
  render();
}

/** Lepaskan sebuah senjata dari semua anggota (dipanggil saat pemain memakai
 *  atau menjual senjata itu, agar tak terpasang di dua tempat). */
export function releaseWeaponFromMembers(id) {
  state.generals.forEach((g) => { if (g.weapon === id) g.weapon = null; });
}

// EXP awal yang dibutuhkan anggota untuk naik ke level 2.
export const MEMBER_EXPMAX = 50;

/** Field level default untuk anggota pasukan baru. */
export function memberProgressFields(){
  return { level: 1, exp: 0, expMax: MEMBER_EXPMAX };
}

/**
 * Beri EXP ke satu anggota; naikkan level selama cukup. Mengembalikan jumlah
 * level yang diperoleh (0 kalau tidak naik) untuk dicatat pemanggil.
 */
export function giveMemberExp(m, amt){
  if(m.level===undefined){ Object.assign(m, memberProgressFields()); }
  m.exp += amt;
  let gained = 0;
  while(m.exp >= m.expMax){
    m.exp -= m.expMax;
    m.level++;
    m.expMax = Math.round(m.expMax*1.3);
    m.atk += 2;
    m.maxHp += 8;
    m.hp = m.maxHp;
    gained++;
  }
  return gained;
}

export function recruitGeneral(idx){
  const m = state.recruits[state.city][idx];
  if(state.gold<m.price || state.generals.length>=MAX_GENERALS) { sfx('error'); return; }
  state.gold -= m.price;
  state.generals.push({name:m.name, rank:0, maxHp:m.maxHp, hp:m.maxHp, atk:m.atk, elem:m.elem, ...memberProgressFields()});
  state.recruits[state.city].splice(idx,1);
  sfx('buy');
  addLog(`Merekrut ${m.name} sebagai Prajurit ke dalam pasukan.`);
  render();
}

export function moveGeneral(idx, dir){
  const target = idx+dir;
  if(target<0 || target>=state.generals.length) return;
  const arr = state.generals;
  [arr[idx],arr[target]] = [arr[target],arr[idx]];
  render();
}

// ---------- BARAK (cadangan pasukan) ----------

/** Pindahkan anggota aktif ke barak (bebaskan slot pasukan). */
export function stashToBarracks(idx){
  const m = state.generals[idx];
  if(!m) return;
  state.generals.splice(idx, 1);
  (state.barracks || (state.barracks = [])).push(m);
  addLog(`${m.name} diistirahatkan ke barak.`);
  render();
}

/** Panggil anggota dari barak ke pasukan aktif (kalau slot masih ada). */
export function callFromBarracks(idx){
  if(state.generals.length >= MAX_GENERALS) { sfx('error'); return; }
  const m = state.barracks[idx];
  if(!m) return;
  state.barracks.splice(idx, 1);
  state.generals.push(m);
  addLog(`${m.name} dipanggil dari barak ke pasukan.`);
  render();
}

export function useRebirthStone(idx){
  if((state.rebirthStones||0)<=0) return;
  const g = state.generals[idx];
  state.rebirthStones--;
  g.rebirthBonus = (g.rebirthBonus||0) + 5;
  g.atk += 5;
  g.maxHp += 10;
  g.hp = g.maxHp;
  sfx('craft');
  addLog(`${g.name} diperkuat permanen dengan Rebirth Stone (+5 ATK, +10 HP maksimal).`);
  render();
}

export function promoteCost(g){
  const parts = g.rank>=3 ? (g.rank-2) : 0;
  return { gold: 100 + (g.rank+1)*150, medals: (g.rank+1), parts };
}

export function promoteGeneral(idx){
  const g = state.generals[idx];
  const cost = promoteCost(g);
  if(state.gold<cost.gold || state.medals<cost.medals || (state.upgradeParts||0)<cost.parts || g.rank>=RANK_NAMES.length-1) return;
  state.gold -= cost.gold; state.medals -= cost.medals; state.upgradeParts -= cost.parts;
  g.rank++; g.maxHp += 20; g.hp = g.maxHp; g.atk += 8;
  sfx('levelup');
  addLog(`${g.name} dipromosikan menjadi ${RANK_NAMES[g.rank]}!`);
  render();
}
