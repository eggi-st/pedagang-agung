// Sistem ekonomi: jual-beli komoditas, perlengkapan, ramuan, pabrik
// pengolahan, penukaran Trade Point, dan perjalanan antar kota.
//
// PASAR YANG BEREAKSI:
//   - Menjual menekan harga barang itu di kota itu; membeli menaikkannya.
//   - Tiap hari (perjalanan), harga semua kota ditarik pelan kembali ke
//     baseline masing-masing (state.basePrices) — rute yang kamu tekan
//     pulih dalam beberapa hari, jadi tidak bisa di-spam.
//   - Baseline per kota berbeda (dari harga awal acak), jadi tiap kota
//     tetap punya karakter harga sendiri: beli murah di A, jual mahal di B.

import { state, setDungeonState } from '../state.js';
import { rand } from '../core/rng.js';
import { render, startBattle, checkEndConditions } from '../core/bus.js';
import { showEvent } from '../ui/overlay.js';
import { addLog, gainGold, reputationBonusPct } from './character.js';
import { genRecruits } from './generators.js';
import { GOODS, WEAPONS, ARMORS, FACTORY_RECIPES, FACTORY_PRICE, ELITE_EXCHANGES } from '../data/economy.js';
import { CITIES, CITY_NATION, NATION_LABEL } from '../data/world.js';
import { seasonalFactor } from '../data/calendar.js';
import { releaseWeaponFromMembers } from './generals.js';
import { sfx } from '../audio/sfx.js';

// Parameter pasar. Semua relatif terhadap baseline kota, bukan angka mutlak.
//
// Harga disimpan sebagai PECAHAN di dalam state.prices dan hanya dibulatkan
// saat ditampilkan/dibayar. Ini membuat dampak per transaksi terasa halus &
// rasional: barang murah bergerak pelan (satu penjualan tidak mengguncang
// pasar), tanpa lompatan paksa ±1 yang dulu bikin harga anjlok berlebihan.
const SELL_IMPACT = 0.03;  // tiap unit dijual: harga turun 3%
const BUY_IMPACT = 0.02;   // tiap unit dibeli: harga naik 2%
const RECOVERY = 0.15;     // tiap hari: 15% jarak ke baseline ditutup
const NOISE = 3;           // ±3% derau harian
const FLOOR_MULT = 0.5;    // harga tak jatuh di bawah 50% baseline
const CAP_MULT = 1.6;      // harga tak naik di atas 160% baseline

// Perjalanan laut antar-negara: lebih lama & berongkos daripada darat.
const SHIP_DAYS = 2;
const SHIP_FARE = 50;

/** Harga "wajar" sebuah barang di sebuah kota. Aman untuk save lama. */
function baseline(city, id) {
  const b = state.basePrices && state.basePrices[city];
  if (b && b[id] != null) return b[id];
  const g = GOODS.find((x) => x.id === id);
  return g ? g.base : 10;
}

/**
 * Selisih harga sekarang terhadap baseline, dalam persen (dibulatkan).
 * Positif = di atas normal (bagus untuk dijual), negatif = di bawah
 * (bagus untuk dibeli). Dipakai lapisan render untuk indikator ↑/↓.
 */
export function priceTrend(city, id) {
  return Math.round((state.prices[city][id] / baseline(city, id) - 1) * 100);
}

// ---------- KOMODITAS ----------

export function buy(id) {
  const basePrice = state.prices[state.city][id];
  const discPct = Math.min(30, (state.classDiscountPct || 0) + reputationBonusPct(state.city));
  const price = Math.max(1, Math.round(basePrice * (1 - discPct / 100)));
  if (state.gold < price || state.cap >= state.capMax) { sfx('error'); return; }
  state.gold -= price; state.inventory[id]++; state.cap++;
  state.reputation[state.city] = (state.reputation[state.city] || 0) + 1;
  // Permintaanmu menaikkan harga di kota ini, dibatasi CAP_MULT × baseline.
  {
    const cap = baseline(state.city, id) * CAP_MULT;
    state.prices[state.city][id] = Math.min(cap, state.prices[state.city][id] * (1 + BUY_IMPACT));
  }
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
  // Pasokanmu menekan harga di kota ini, tak jatuh di bawah FLOOR_MULT × baseline.
  {
    const floor = Math.max(3, baseline(state.city, id) * FLOOR_MULT);
    state.prices[state.city][id] = Math.max(floor, state.prices[state.city][id] * (1 - SELL_IMPACT));
  }
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
  // Kalau senjata ini sedang dipegang anggota pasukan, lepaskan dulu.
  if (slot === 'weapon') releaseWeaponFromMembers(id);
  state.equipment[slot] = id;
  render();
}

export function sellGear(slot, id) {
  const list = slot === 'weapon' ? WEAPONS : ARMORS;
  const ownedArr = slot === 'weapon' ? state.ownedWeapons : state.ownedArmors;
  const idx = ownedArr.indexOf(id);
  if (idx < 0 || state.equipment[slot] === id) return;
  if (slot === 'weapon') releaseWeaponFromMembers(id); // jangan tersisa di pasukan
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

// ---------- PENGINAPAN (heal di luar pertempuran) ----------

/** Biaya memulihkan HP kamu + seluruh jendral ke penuh: 0,5 gold per HP hilang. */
export function restCost() {
  let missing = Math.max(0, state.char.maxHp - state.char.hp);
  state.generals.forEach((g) => { missing += Math.max(0, g.maxHp - g.hp); });
  return Math.ceil(missing * 0.5);
}

export function restAtInn() {
  const cost = restCost();
  if (cost <= 0) return;                       // sudah penuh
  if (state.gold < cost) { sfx('error'); return; }
  state.gold -= cost;
  state.char.hp = state.char.maxHp;
  state.char.poison = null;
  state.generals.forEach((g) => { g.hp = g.maxHp; g.poison = null; });
  sfx('buy');
  addLog(`Beristirahat di penginapan seharga ${cost}g. HP kamu & pasukan pulih penuh.`);
  render();
}

// ---------- PABRIK PENGOLAHAN ----------

/** Beli (miliki) pabrik di kota saat ini. Harus punya sebelum bisa produksi. */
export function buyFactory(city) {
  const f = state.factories[city];
  if (!f || f.owned) return;
  if (state.gold < FACTORY_PRICE) { sfx('error'); return; }
  state.gold -= FACTORY_PRICE;
  f.owned = true;
  sfx('buy');
  addLog(`Membeli pabrik di ${city} seharga ${FACTORY_PRICE}g.`);
  render();
}

export function startProduction(recipeId) {
  const r = FACTORY_RECIPES.find((x) => x.id === recipeId);
  if (!r) return;
  const f = state.factories[r.city];
  // Hanya bisa produksi di kota pabriknya, kalau pabrik dimiliki & sedang kosong.
  if (!f || !f.owned || f.active || r.city !== state.city) { sfx('error'); return; }
  const canAfford = Object.entries(r.inputs).every(([gid, qty]) => state.inventory[gid] >= qty) && state.gold >= r.goldCost;
  if (!canAfford) { sfx('error'); return; }
  Object.entries(r.inputs).forEach(([gid, qty]) => { state.inventory[gid] -= qty; state.cap -= qty; });
  state.gold -= r.goldCost;
  f.active = { recipeId, readyDay: state.day + r.days };
  sfx('buy');
  addLog(`Memulai produksi ${r.name} di ${r.city}, selesai dalam ${r.days} hari.`);
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

/** Info perjalanan ke sebuah kota dari kota saat ini: darat vs kapal. */
export function travelInfo(dest) {
  const ship = CITY_NATION[dest] !== CITY_NATION[state.city];
  return { ship, days: ship ? SHIP_DAYS : 1, fare: ship ? SHIP_FARE : 0 };
}

// Pemulihan harga SATU hari: tiap kota ditarik pelan ke baseline × musim + derau.
function agePricesOneDay() {
  CITIES.forEach((city) => {
    const cityPrices = state.prices[city];
    GOODS.forEach((g) => {
      const cur = cityPrices[g.id];
      const target = baseline(city, g.id) * seasonalFactor(g.id, state.day);
      let next = cur + (target - cur) * RECOVERY;
      next *= 1 + rand(-NOISE, NOISE) / 100;
      cityPrices[g.id] = Math.max(3, next);
    });
  });
}

export function travel(dest) {
  const { ship, days, fare } = travelInfo(dest);
  if (state.gold < fare) { sfx('error'); return; } // tak mampu ongkos kapal
  if (fare) { state.gold -= fare; }
  state.day += days;
  state.city = dest;
  if (!state.goldHistory) state.goldHistory = [];
  state.goldHistory.push({ day: state.day, gold: state.gold });
  if (state.goldHistory.length > 150) state.goldHistory.shift();

  const prices = state.prices[dest];
  let eventMsg = null;

  if (ship) addLog(`⛵ Berlayar ke ${dest} (${NATION_LABEL[CITY_NATION[dest]]}) — ${days} hari, ongkos ${fare}g.`);

  // Pemulihan harga berjalan per hari yang dilewati (kapal = beberapa hari),
  // jadi rute yang ditekan tetap pulih sesuai lama perjalanan.
  for (let d = 0; d < days; d++) agePricesOneDay();

  // Kejutan pasar sesekali di kota tujuan: kelangkaan melonjak, panen anjlok.
  // Deviasi ini lalu ikut pulih ke baseline pada hari-hari berikutnya.
  if (Math.random() < 0.12) {
    const g = GOODS[rand(0, GOODS.length - 1)];
    const shortage = Math.random() < 0.5;
    prices[g.id] = Math.max(3, prices[g.id] * (shortage ? 1.6 : 0.55));
    eventMsg = shortage ? `Kelangkaan ${g.name} di ${dest}! Harga melonjak.` : `Panen ${g.name} melimpah di ${dest}! Harga anjlok.`;
  }

  if (!state.recruits[dest] || state.recruits[dest].length === 0) state.recruits[dest] = genRecruits();

  // Semua pabrik yang dimiliki berjalan otomatis; panen yang sudah selesai.
  CITIES.forEach((c) => {
    const f = state.factories[c];
    if (f && f.active && state.day >= f.active.readyDay) {
      const r = FACTORY_RECIPES.find((x) => x.id === f.active.recipeId);
      state.processedGoods[r.id] = (state.processedGoods[r.id] || 0) + 1;
      addLog(`Produksi ${r.name} di ${c} selesai! Siap dijual.`);
      f.active = null;
    }
  });

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
