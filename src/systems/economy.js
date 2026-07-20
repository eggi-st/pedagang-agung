// Sistem ekonomi: jual-beli komoditas, perlengkapan, ramuan, pabrik
// pengolahan, penukaran Trade Point, dan perjalanan antar kota.
//
// CATATAN DESAIN (belum dikerjakan): harga di sini TIDAK bereaksi terhadap
// volume jualan pemain — sell() menaikkan gold dan reputasi, tapi tidak
// menyentuh state.prices sama sekali. Akibatnya rute dagang yang sudah
// ketahuan untung bisa di-spam tanpa batas. Perbaikannya tinggal di sini
// setelah desain ekonominya disepakati.

import { state, setDungeonState } from '../state.js';
import { rand } from '../core/rng.js';
import { render, startBattle, checkEndConditions } from '../core/bus.js';
import { showEvent } from '../ui/overlay.js';
import { addLog, gainGold, reputationBonusPct } from './character.js';
import { genRecruits } from './generators.js';
import { GOODS, WEAPONS, ARMORS, FACTORY_RECIPES, ELITE_EXCHANGES } from '../data/economy.js';
import { sfx } from '../audio/sfx.js';

// ---------- KOMODITAS ----------

export function buy(id) {
  const basePrice = state.prices[state.city][id];
  const discPct = Math.min(30, (state.classDiscountPct || 0) + reputationBonusPct(state.city));
  const price = Math.max(1, Math.round(basePrice * (1 - discPct / 100)));
  if (state.gold < price || state.cap >= state.capMax) { sfx('error'); return; }
  state.gold -= price; state.inventory[id]++; state.cap++;
  state.reputation[state.city] = (state.reputation[state.city] || 0) + 1;
  sfx('buy');
  render();
}

export function sell(id) {
  const basePrice = state.prices[state.city][id];
  const repPct = reputationBonusPct(state.city);
  const price = Math.round(basePrice * (1 + repPct / 100));
  if (state.inventory[id] <= 0) return;
  gainGold(price); state.inventory[id]--; state.cap--;
  state.reputation[state.city] = (state.reputation[state.city] || 0) + 1;
  state.tradePoints = (state.tradePoints || 0) + 1;
  const q = state.quests[state.city];
  if (q && q.type === 'sell' && q.goodId === id && q.progress < q.target) { q.progress++; }
  sfx('sell');
  addLog(`Menjual ${GOODS.find((g) => g.id === id).name} seharga ${price}g.`);
  render();
}

// ---------- PERLENGKAPAN ----------

export function buyGear(slot, id) {
  const list = slot === 'weapon' ? WEAPONS : ARMORS;
  const ownedArr = slot === 'weapon' ? state.ownedWeapons : state.ownedArmors;
  const item = list.find((x) => x.id === id);
  if (state.gold < item.price || ownedArr.includes(id)) { sfx('error'); return; }
  state.gold -= item.price;
  ownedArr.push(id);
  state.equipment[slot] = id;
  sfx('buy');
  addLog(`Membeli dan memasang ${item.name}.`);
  render();
}

export function equipGear(slot, id) {
  const ownedArr = slot === 'weapon' ? state.ownedWeapons : state.ownedArmors;
  if (!ownedArr.includes(id)) return;
  state.equipment[slot] = id;
  render();
}

export function sellGear(slot, id) {
  const list = slot === 'weapon' ? WEAPONS : ARMORS;
  const ownedArr = slot === 'weapon' ? state.ownedWeapons : state.ownedArmors;
  const idx = ownedArr.indexOf(id);
  if (idx < 0 || state.equipment[slot] === id) return;
  const item = list.find((x) => x.id === id);
  gainGold(Math.round(item.price * 0.5));
  ownedArr.splice(idx, 1);
  sfx('sell');
  addLog(`Menjual ${item.name} dari gudang seharga ${Math.round(item.price * 0.5)}g.`);
  render();
}

export function buyPotion() {
  if (state.gold < 25) { sfx('error'); return; }
  state.gold -= 25; state.potions++;
  sfx('buy');
  addLog(`Membeli ramuan penyembuh. Total ramuan: ${state.potions}.`);
  render();
}

// ---------- PABRIK PENGOLAHAN ----------

export function startProduction(recipeId) {
  if (state.factory.active) return;
  const r = FACTORY_RECIPES.find((x) => x.id === recipeId);
  const canAfford = Object.entries(r.inputs).every(([gid, qty]) => state.inventory[gid] >= qty) && state.gold >= r.goldCost;
  if (!canAfford) { sfx('error'); return; }
  Object.entries(r.inputs).forEach(([gid, qty]) => { state.inventory[gid] -= qty; state.cap -= qty; });
  state.gold -= r.goldCost;
  state.factory.active = { recipeId, readyDay: state.day + r.days };
  sfx('buy');
  addLog(`Memulai produksi ${r.name}, selesai dalam ${r.days} hari.`);
  render();
}

export function sellProcessed(recipeId) {
  const r = FACTORY_RECIPES.find((x) => x.id === recipeId);
  if ((state.processedGoods[recipeId] || 0) <= 0) return;
  state.processedGoods[recipeId]--;
  gainGold(r.sellValue);
  state.tradePoints = (state.tradePoints || 0) + 3;
  sfx('sell');
  addLog(`Menjual ${r.name} seharga ${r.sellValue}g.`);
  render();
}

// ---------- NPC DAGANG ELIT ----------

export function exchangeTP(id) {
  const ex = ELITE_EXCHANGES.find((x) => x.id === id);
  if ((state.tradePoints || 0) < ex.tp) { sfx('error'); return; }
  state.tradePoints -= ex.tp;
  if (id === 'rebirth_stone') state.rebirthStones = (state.rebirthStones || 0) + 1;
  else if (id === 'upgrade_part') state.upgradeParts = (state.upgradeParts || 0) + 1;
  else if (id === 'potion_bundle') state.potions += 3;
  sfx('buy');
  addLog(`Menukar ${ex.tp} TP dengan ${ex.name}.`);
  render();
}

export function enterHistoricalScenario() {
  if (state.char.level < 10 || (state.tradePoints || 0) < 40) { sfx('error'); return; }
  state.tradePoints -= 40;
  setDungeonState({ city: state.city, floor: 1, maxFloor: 1, historical: true });
  sfx('dungeon');
  startBattle('historical', state.city);
}

// ---------- PERJALANAN ----------

export function travel(dest) {
  state.day++;
  state.city = dest;
  if (!state.goldHistory) state.goldHistory = [];
  state.goldHistory.push({ day: state.day, gold: state.gold });
  if (state.goldHistory.length > 150) state.goldHistory.shift();

  const prices = state.prices[dest];
  let eventMsg = null;

  // Kejutan pasar sesekali: kelangkaan menaikkan harga, panen menurunkan.
  if (Math.random() < 0.12) {
    const g = GOODS[rand(0, GOODS.length - 1)];
    const shortage = Math.random() < 0.5;
    prices[g.id] = Math.max(3, Math.round(prices[g.id] * (shortage ? 1.6 : 0.55)));
    eventMsg = shortage ? `Kelangkaan ${g.name} di ${dest}! Harga melonjak.` : `Panen ${g.name} melimpah di ${dest}! Harga anjlok.`;
  }
  // Pergeseran harga harian yang kecil dan acak.
  GOODS.forEach((g) => {
    const drift = rand(-15, 15) / 100;
    prices[g.id] = Math.max(3, Math.round(prices[g.id] * (1 + drift)));
  });

  if (!state.recruits[dest] || state.recruits[dest].length === 0) state.recruits[dest] = genRecruits();

  if (state.factory.active && state.day >= state.factory.active.readyDay) {
    const r = FACTORY_RECIPES.find((x) => x.id === state.factory.active.recipeId);
    state.processedGoods[r.id] = (state.processedGoods[r.id] || 0) + 1;
    addLog(`Produksi ${r.name} selesai! Siap dijual di Pabrik.`);
    state.factory.active = null;
  }

  if (state.owned.length > 0) {
    let income = 0;
    state.owned.forEach((c) => { income += rand(15, 35) + (state.cityUpgrades[c].gudang * 10); });
    gainGold(income);
    addLog(`Pajak dari ${state.owned.length} wilayah kekuasaanmu: +${income} gold.`);

    // Wilayah kekuasaan sesekali diserang balik; benteng menentukan bertahan.
    state.owned.slice().forEach((c) => {
      if (Math.random() < 0.08) {
        const defense = 40 + (state.cityUpgrades[c].benteng * 25);
        const attackPower = rand(30, 90);
        if (attackPower > defense) {
          state.owned = state.owned.filter((x) => x !== c);
          addLog(`⚠️ ${c} berhasil direbut kembali oleh pasukan musuh! Wilayah itu kini netral lagi.`);
        } else {
          state.medals += 1;
          addLog(`Wilayah ${c} berhasil bertahan dari serangan musuh berkat Benteng. +1 medali.`);
        }
      }
    });
  }
  if (eventMsg) addLog(eventMsg);

  const roll = Math.random();
  if (roll < 0.4) {
    startBattle('travel', dest);
    return;
  } else if (roll < 0.55) {
    const bonus = rand(20, 60);
    gainGold(bonus);
    showEvent('💰 Rejeki Nomplok', `Kamu menemukan karavan tersesat dan diberi imbalan ${bonus} gold karena membantu mereka.`);
  } else {
    addLog(`Tiba dengan selamat di ${dest}.`);
    checkEndConditions();
  }
  render();
}
