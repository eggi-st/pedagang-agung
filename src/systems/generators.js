// Pembangkit nilai acak untuk dunia permainan: harga kota, calon rekrutan,
// item rampasan, dan misi. Semuanya murni menghasilkan objek baru — tidak
// ada yang mengubah state, sehingga aman diuji satuan.

import { state } from '../state.js';
import { rand } from '../core/rng.js';
import { GOODS } from '../data/economy.js';
import { ELEMENTS } from '../data/elements.js';
import { MERC_NAMES } from '../data/mercenaries/index.js';
import { RARITY_RANGE, RARITY_SELL, ITEM_TYPE_NAMES } from '../data/items.js';

export function genPrices() {
  const p = {};
  GOODS.forEach((g) => { p[g.id] = Math.max(3, Math.round(g.base * (0.6 + Math.random() * 0.9))); });
  return p;
}

export function genRecruits() {
  const pool = [];
  for (let i = 0; i < 2; i++) {
    const name = MERC_NAMES[rand(0, MERC_NAMES.length - 1)];
    const tier = rand(1, 3);
    const elem = ELEMENTS[rand(0, ELEMENTS.length - 1)];
    pool.push({ name: name, maxHp: 20 + tier * 15, atk: 4 + tier * 4, price: 60 + tier * 70, elem });
  }
  return pool;
}

export function genItem(rarity) {
  const type = ['offensive', 'defensive', 'balanced'][rand(0, 2)];
  const names = ITEM_TYPE_NAMES[type][rarity];
  const name = names[rand(0, names.length - 1)];
  const range = RARITY_RANGE[rarity];
  const bonus = rand(range[0], range[1]);
  return { uid: 'it' + Date.now() + rand(0, 9999), name, rarity, type, bonus, sellValue: RARITY_SELL[rarity] + rand(0, 20) };
}

export function rollDrop(luck) {
  const roll = Math.random();
  if (roll < 0.03 + luck * 0.015) return genItem('Legendaris');
  if (roll < 0.15 + luck * 0.03) return genItem('Langka');
  if (roll < 0.5 + luck * 0.05) return genItem('Biasa');
  return null;
}

export function genQuest() {
  const type = Math.random() < 0.5 ? 'sell' : 'hunt';
  if (type === 'sell') {
    const good = GOODS[rand(0, GOODS.length - 1)];
    return { type: 'sell', goodId: good.id, goodName: good.name, target: rand(3, 6), progress: 0, reward: rand(40, 90), rewardMedal: rand(0, 1), completed: false };
  }
  return { type: 'hunt', target: rand(1, 3), progress: 0, reward: rand(50, 110), rewardMedal: 1, completed: false };
}

export function genGuildQuest() {
  const types = ['gold', 'level', 'defeat'];
  const t = types[rand(0, 2)];
  if (t === 'gold') return { type: 'gold', target: state.gold + rand(300, 600), reward: rand(200, 350), rewardMedal: rand(3, 6) };
  if (t === 'level') return { type: 'level', target: state.char.level + rand(2, 4), reward: rand(250, 400), rewardMedal: rand(3, 6) };
  return { type: 'defeat', target: (state.stats.battlesWon || 0) + rand(3, 6), reward: rand(200, 350), rewardMedal: rand(3, 6) };
}

export function guildQuestReady() {
  const q = state.guildQuest;
  if (!q) return false;
  if (q.type === 'gold') return state.gold >= q.target;
  if (q.type === 'level') return state.char.level >= q.target;
  if (q.type === 'defeat') return state.stats.battlesWon >= q.target;
  return false;
}

export function guildQuestLabel() {
  const q = state.guildQuest;
  if (!q) return '';
  if (q.type === 'gold') return `Kumpulkan total ${q.target} gold`;
  if (q.type === 'level') return `Capai Level ${q.target}`;
  return `Menangkan total ${q.target} pertempuran`;
}

export function guildQuestProgressNow() {
  const q = state.guildQuest;
  if (!q) return 0;
  if (q.type === 'gold') return state.gold;
  if (q.type === 'level') return state.char.level;
  return state.stats.battlesWon;
}
